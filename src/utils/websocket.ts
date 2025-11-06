export class WebSocketClient {
  private _ws: WebSocket | null = null;
  private heartbeatCallback: (() => void) | null = null;
  private url: string = "";
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 1000; // Start with 1s, will increase exponentially
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalClose: boolean = false;

  get ws() {
    return this._ws;
  }

  connect(url: string) {
    if (typeof window !== "undefined") {
      // If we already have an active connection to the same URL, don't create a new one
      if (
        this._ws &&
        this._ws.readyState === WebSocket.OPEN &&
        this.url === url
      ) {
        // console.log(
        //   "WebSocket already connected to this URL. Reusing connection."
        // );
        return;
      }

      // If there's an existing connection, close it first
      if (this._ws) {
        // console.log("Closing existing connection before creating a new one");
        this.disconnect();
      }

      this.url = url;
      this.isIntentionalClose = false;
      this.createWebSocket(url);
    }
  }

  // Only create a new WebSocket if we don't already have an active one
  private createWebSocket(url: string) {
    // If we already have an active connection, don't create a new one
    if (this._ws) {
      if (this._ws.readyState === WebSocket.OPEN) {
        // console.log("WebSocket is already OPEN - not creating a new one");
        return;
      } else if (this._ws.readyState === WebSocket.CONNECTING) {
        // console.log("WebSocket is already CONNECTING - not creating a new one");
        return;
      }
    }

    // console.log("Creating new WebSocket connection");
    this._ws = new WebSocket(url);

    this._ws.addEventListener("open", () => {
      // console.log("Connected");
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.reconnectTimeout = 1000; // Reset timeout to initial value

      // Create a custom event that can be listened to
      if (typeof window !== "undefined") {
        const reconnectedEvent = new Event("websocket_reconnected");
        window.dispatchEvent(reconnectedEvent);
      }

      if (this.heartbeatCallback) {
        this.heartbeatCallback();
      }
    });

    this._ws.addEventListener("message", (event) => {
      // console.log("Received:", event.data);
    });

    this._ws.addEventListener("close", (event) => {
      // console.log("Disconnected", event);

      // Don't attempt to reconnect if it was an intentional close
      if (!this.isIntentionalClose) {
        this.attemptReconnect();
      }
    });

    this._ws.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      // Error event is usually followed by close event, so we'll handle reconnection there
    });
  }

  // Enhanced check to determine if a reconnection is actually needed
  private shouldAttemptReconnect() {
    // Don't reconnect if intentionally closed
    if (this.isIntentionalClose) {
      return false;
    }

    // Don't reconnect if we already have an active connection
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      // console.log("No need to reconnect - WebSocket is already OPEN");
      return false;
    }

    // Don't reconnect if we're in the process of connecting
    if (this._ws && this._ws.readyState === WebSocket.CONNECTING) {
      // console.log("No need to reconnect - WebSocket is already CONNECTING");
      return false;
    }

    return true;
  }

  private attemptReconnect() {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Check if reconnection is actually needed
    if (!this.shouldAttemptReconnect()) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      // Use exponential backoff for reconnection attempts
      const delay = Math.min(
        30000,
        this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1)
      );

      // console.log(
      //   `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts})`
      // );

      // Broadcast reconnection attempt event
      if (typeof window !== "undefined") {
        const reconnectingEvent = new Event("websocket_reconnecting");
        window.dispatchEvent(reconnectingEvent);
      }

      this.reconnectTimer = setTimeout(() => {
        // console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.createWebSocket(this.url);
      }, delay);
    } else {
      console.error(
        `Failed to reconnect after ${this.maxReconnectAttempts} attempts`
      );

      // Broadcast reconnection failure event
      if (typeof window !== "undefined") {
        const reconnectFailedEvent = new Event("websocket_reconnect_failed");
        window.dispatchEvent(reconnectFailedEvent);
      }
    }
  }

  setHeartbeatCallback(callback: () => void) {
    this.heartbeatCallback = callback;
  }

  // Check if WebSocket is connected and ready before sending
  isConnected() {
    return this._ws !== null && this._ws.readyState === WebSocket.OPEN;
  }

  sendMessage(message: string) {
    if (this.isConnected()) {
      this._ws!.send(message);
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);

      // If we're trying to send messages but not connected,
      // we might need to reconnect
      if (this._ws && this._ws.readyState === WebSocket.CLOSED) {
        // console.log(
        //   "WebSocket is closed but messages are being sent. Attempting to reconnect..."
        // );
        this.reconnect();
      }
    }
  }

  disconnect() {
    this.isIntentionalClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
  }

  // Manually trigger a reconnection - with checks
  reconnect() {
    // Only disconnect if we're currently connected or connecting
    if (
      this._ws &&
      (this._ws.readyState === WebSocket.OPEN ||
        this._ws.readyState === WebSocket.CONNECTING)
    ) {
      // console.log("Disconnecting before manual reconnect");
      this.disconnect();
    }

    // Reset reconnection state
    this.isIntentionalClose = false;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = 1000;

    // Only try to connect if we have a URL
    if (this.url) {
      // console.log("Manually reconnecting...");
      this.connect(this.url);
    } else {
      console.error("Cannot reconnect - no URL available");
    }
  }
}
export const wsClient = new WebSocketClient();
