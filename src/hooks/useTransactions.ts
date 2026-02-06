import { RootState } from "@/redux/reducers";
import { setTransactions } from "@/redux/reducers/tradeReducer";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useTransactions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { transactions } = useSelector((store: RootState) => store.trade);

  const dispatch = useDispatch();
  const router = useRouter();

  // Initial fetch - shows loading spinner
  const initialFetchTransactions = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions?page=${page}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication error, redirect to login
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data: TransactionsResponse = await response.json();

      if (data.status === "success") {
        dispatch(setTransactions(data.data));
        setHasNextPage(data.has_next);
      } else {
        throw new Error(data.message || "Failed to fetch transactions");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching transactions"
      );
      console.error("Transaction fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh fetch - does not show loading spinner and preserves real-time values
  const refreshTransactions = async (page: number) => {
    setError(null);

    try {
      // const response = await fetch(`/api/transactions?page=${page}`, {
      const response = await fetch(`/api/transactions`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication error, redirect to login (silent)
          router.push("/login");
          return;
        }
        // Only log error, don't display to user during refresh
        console.error(`Failed to refresh transactions: ${response.statusText}`);
        return;
      }

      const data: TransactionsResponse = await response.json();

      if (data.status === "success") {
        // Get current transactions from store
        const currentTransactions = transactions;

        // Process new transactions to preserve real-time P/L values
        const updatedTransactions = data.data.map((newTransaction) => {
          // Find matching transaction in current state
          const existingTransaction = currentTransactions.find(
            (t) => t.id === newTransaction.id
          );

          // Only update if existing transaction doesn't exist
          // OR if the transaction now has a non-zero profitLoss value when it didn't before
          if (!existingTransaction) {
            return newTransaction;
          }

          // Check if transaction status changed from no P/L to having P/L
          const hadProfitLoss =
            existingTransaction.meta_data.profitLoss !== undefined &&
            existingTransaction.meta_data.profitLoss !== 0;

          const nowHasProfitLoss =
            newTransaction.meta_data.profitLoss !== undefined &&
            newTransaction.meta_data.profitLoss !== 0;

          // If status changed or transaction is closed, use the new data
          if ((!hadProfitLoss && nowHasProfitLoss) || newTransaction.closed) {
            return newTransaction;
          }

          // Otherwise preserve the existing transaction data
          return existingTransaction;
        });

        dispatch(setTransactions(updatedTransactions));
        setHasNextPage(data.has_next);
      }
    } catch (err) {
      console.error("Silent transaction refresh error:", err);
      // Don't update error state during silent refresh
    }
  };

  // Set up initial fetch and auto-refresh
  useEffect(() => {
    // Initial fetch
    initialFetchTransactions(currentPage);

    // Set up auto-refresh every 10 seconds
    refreshIntervalRef.current = setInterval(() => {
      refreshTransactions(currentPage);
    }, 10000);

    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Function to extract trading pair in a readable format
  const formatPair = (pair: string) => {
    if (pair?.length === 6) {
      return `${pair?.slice(0, 3)}/${pair.slice(3, 6)}`;
    }
    return pair;
  };

  const exportToCSV = () => {
    if (transactions?.length === 0) return;

    // Create CSV content
    const headers = [
      "ID",
      "Type",
      "Pair",
      "Price",
      "Quantity",
      "Leverage",
      "Margin",
      "Order Type",
      "Date",
    ];
    const csvContent = [
      headers.join(","),
      ...transactions.map((t) =>
        [
          t.id,
          t.type,
          t.meta_data.pair,
          t.price,
          t.meta_data.quantity || "-",
          t.meta_data.leverage || "-",
          t.meta_data.margin || "-",
          t.meta_data.order_type || "-",
          formatDate(t.created_at),
        ].join(",")
      ),
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    loading,
    error,
    exportToCSV,
    transactions,
    formatDate,
    formatPair,
    handlePageChange,
    hasNextPage,
    currentPage,
    fetchTransactions: initialFetchTransactions, // Use the initial fetch for manual refreshes
  };
};
