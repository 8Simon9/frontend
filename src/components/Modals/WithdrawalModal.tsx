import { Box, Modal, CircularProgress } from "@mui/material";
import React, { useState, useEffect } from "react";
import { style } from "./config";
import { FiCopy } from "react-icons/fi";
import { BsCheckCircleFill, BsArrowRight } from "react-icons/bs";
import { MdOutlineRefresh } from "react-icons/md";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/reducers";

interface ModalProps {
  modal: {
    isOpen: boolean;
    close: () => void;
  };
}

type TabType = "new" | "open" | "all";

const WithdrawalModal: React.FC<ModalProps> = ({ modal }) => {
  const [activeTab, setActiveTab] = useState<TabType>("new");
  const [amount, setAmount] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [requests, setRequests] = useState<RequestHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { user } = useSelector((store: RootState) => store);

  const {
    user: { balance },
  } = user;

  // Fetch requests when modal opens or tab changes
  useEffect(() => {
    if (modal.isOpen && (activeTab === "open" || activeTab === "all")) {
      fetchRequests();
    }
  }, [modal.isOpen, activeTab]);

  // Reset form when switching back to new request tab
  useEffect(() => {
    if (activeTab === "new") {
      setAmount("");
      setWalletAddress("");
      setError("");
      setIsSubmitted(false);
    }
  }, [activeTab]);

  // Fetch requests history from API
  const fetchRequests = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/requests", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data: RequestHistoryResponse = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication required. Please log in again.");
          return;
        }
        throw new Error(data.message || "Failed to fetch requests");
      }

      if (data.status === "success" && Array.isArray(data.data)) {
        // Filter requests based on the active tab
        if (activeTab === "open") {
          // Show only open withdrawal requests
          setRequests(
            data.data.filter(
              (request) => request.type === "withdrawal" && !request.approved
            )
          );
        } else if (activeTab === "all") {
          // Show all withdrawal requests
          setRequests(
            data.data.filter((request) => request.type === "withdrawal")
          );
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      setError("Failed to fetch request history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle withdrawal submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!walletAddress.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    setIsSubmitLoading(true);
    setError("");

    try {
      const requestData: WithdrawalRequest = {
        amount: amount,
        network: "usdt", // Fixed to USDT as requested
        wallet_address: walletAddress.trim(),
      };

      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Authentication required. Please log in again.");
          return;
        }
        throw new Error(data.message || "Failed to submit withdrawal request");
      }

      if (data.status === "success") {
        setIsSubmitted(true);
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setAmount("");
          setWalletAddress("");
          setActiveTab("open"); // Switch to open requests tab
        }, 3000);
      } else {
        throw new Error(data.message || "Failed to submit withdrawal request");
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit withdrawal request. Please try again."
      );
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Format date for display
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal
      open={modal.isOpen}
      onClose={modal.close}
      aria-labelledby="withdrawal-modal"
      aria-describedby="withdrawal-usdt-modal"
      className="backdrop-blur-[3px]"
    >
      <Box
        sx={style}
        className="bg-primaryBlue border max-h-[90%] overflow-y-scroll border-blue-400 py-[37px] px-[48px] md:max-w-[1020px] max-w-[370px] w-full md:w-[1020px] rounded-[0px]"
      >
        <h2 className="text-3xl text-white text-center font-bold">
          Withdrawal
        </h2>

        <div className="flex flex-col md:flex-row gap-6 mt-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-gray-900 rounded-lg p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("new")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "new"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                Submit New Request
              </button>
              <button
                onClick={() => setActiveTab("open")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "open"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                Open Requests
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === "all"
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                All Requests
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "new" && (
              <div>
                {isSubmitted ? (
                  <div className="text-center">
                    <div className="flex justify-center">
                      <BsCheckCircleFill className="text-green-500 text-6xl mb-4" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Withdrawal Request Submitted!
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Your withdrawal request has been successfully submitted
                      and is pending approval.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-base text-gray-300 mt-6 leading-[30px]">
                      Please ensure your withdrawal details are accurate.
                      Withdrawals are processed within 1-3 business days after
                      approval. For any issues, please contact support with your
                      transaction details.
                    </p>

                    <form
                      className="mt-8 flex flex-col gap-6"
                      onSubmit={handleSubmit}
                    >
                      <div>
                        <p className="text-white mb-2">
                          Amount (Available: {balance.toFixed(2)} USDT)
                        </p>
                        <div className="flex">
                          <input
                            type="number"
                            name="amount"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 py-4 border-blue-400 bg-[rgba(0,0,0,0.4)] text-white px-4 outline-none focus:border-blue-300"
                            placeholder="Enter withdrawal amount"
                            min="1"
                            max={balance}
                            step="any"
                            required
                          />
                          <label
                            htmlFor="amount"
                            className="w-24 py-4 px-4 bg-blue-800 text-white flex items-center justify-center"
                          >
                            USDT
                          </label>
                        </div>
                      </div>

                      <div>
                        <p className="text-white mb-2">
                          USDT Wallet Address (ERC20)
                        </p>
                        <input
                          type="text"
                          name="walletAddress"
                          id="walletAddress"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          className="w-full py-4 border-blue-400 bg-[rgba(0,0,0,0.4)] text-white px-4 outline-none focus:border-blue-300"
                          placeholder="Enter USDT wallet address"
                          required
                        />
                      </div>

                      {error && (
                        <div className="bg-red-900/30 border border-red-500 text-red-300 p-3 rounded-md">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-4 text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={isSubmitLoading}
                      >
                        {isSubmitLoading ? (
                          <>
                            <CircularProgress
                              size={20}
                              sx={{ color: "white", marginRight: "8px" }}
                            />
                            Processing...
                          </>
                        ) : (
                          <>
                            Submit Withdrawal
                            <BsArrowRight className="ml-2" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {(activeTab === "open" || activeTab === "all") && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {activeTab === "open"
                      ? "Open Withdrawal Requests"
                      : "All Withdrawal Requests"}
                  </h3>
                  <button
                    onClick={fetchRequests}
                    className="text-gray-300 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    <MdOutlineRefresh
                      size={24}
                      className={isLoading ? "animate-spin" : ""}
                    />
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <CircularProgress sx={{ color: "white" }} />
                  </div>
                ) : error ? (
                  <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-md">
                    {error}
                    <button onClick={fetchRequests} className="ml-4 underline">
                      Try again
                    </button>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">
                      No withdrawal requests found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-white font-semibold">
                                ID:
                              </span>
                              <span className="text-gray-300">
                                {request.id}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(request.id, request.id)
                                }
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                {copiedId === request.id ? (
                                  <BsCheckCircleFill
                                    size={16}
                                    className="text-green-500"
                                  />
                                ) : (
                                  <FiCopy size={16} />
                                )}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-400">Amount:</span>
                                <span className="text-white ml-2">
                                  {request.amount} USDT
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Wallet:</span>
                                <span className="text-white ml-2 truncate">
                                  {request.wallet_address}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`inline-block px-3 py-1 rounded-full text-sm ${
                                request.approved
                                  ? "bg-green-900/50 text-green-400"
                                  : "bg-yellow-900/50 text-yellow-400"
                              }`}
                            >
                              {request.approved ? "Approved" : "Pending"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Box>
    </Modal>
  );
};

export default WithdrawalModal;
