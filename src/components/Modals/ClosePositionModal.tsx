import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { IoClose } from "react-icons/io5";
import { style } from "./config";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/reducers";
import { setTransactions } from "@/redux/reducers/tradeReducer";
import { fetchProfileDetails } from "@/redux/reducers/userReducer";
import { AppDispatch } from "@/redux/store";

const ClosePositionModal: React.FC<ModalProps> = ({ modal }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [profitLoss, setProfitLoss] = useState<{
    amount: number;
    percentage: number;
  } | null>(null);

  const {
    selectedTransaction,
    transactions,
    selectedPairPrice,
    priceUpdated,
    isCalculate,
  } = useSelector((store: RootState) => store.trade);

  const dispatch = useDispatch<AppDispatch>();

  // Calculate profit/loss when selected transaction or current price changes
  useEffect(() => {
    if (selectedTransaction && (currentPrice || selectedPairPrice)) {
      calculateProfitLoss();
    }
  }, [selectedTransaction, currentPrice, selectedPairPrice]);

  // Fetch current market price when modal opens
  useEffect(() => {
    if (modal.isOpen && selectedTransaction) {
      // Use the current market price from Redux if available
      if (selectedPairPrice) {
        // Use bid for sell positions and ask for buy positions (inverse of opening)
        const price =
          selectedTransaction.type === "BUY"
            ? selectedPairPrice.bid
            : selectedPairPrice.ask;

        setCurrentPrice(price);
      } else {
        // Fallback to using the price from when the position was opened
        // In a real application, you'd fetch the current market price here
        setCurrentPrice(parseFloat(selectedTransaction.meta_data.boughtAt));
      }
    }
  }, [modal.isOpen, selectedTransaction, selectedPairPrice]);

  const calculateProfitLoss = () => {
    // console.log("calculating profit loss start");
    console.log(
      "selectedTransaction",
      selectedTransaction,
      "currentPrice",
      currentPrice
    );

    if (!selectedTransaction || !currentPrice) return;
    console.log("calculating profit loss passed return");

    // Extract necessary values
    const openPrice = parseFloat(selectedTransaction.meta_data.boughtAt);
    const tradeSize = parseFloat(selectedTransaction.price.toString());
    const leverage = parseFloat(selectedTransaction.meta_data.leverage || "1");
    const margin = selectedTransaction.meta_data.margin
      ? parseFloat(selectedTransaction.meta_data.margin)
      : tradeSize / leverage;

    // Calculate price difference
    let priceDiff = 0;

    if (selectedTransaction.type === "BUY") {
      // For long positions: current - open
      priceDiff = currentPrice - openPrice;
    } else {
      // For short positions: open - current
      priceDiff = openPrice - currentPrice;
    }

    // Calculate profit/loss
    // For forex/crypto pairs where price is in quote currency
    const quantity = selectedTransaction.meta_data.quantity
      ? selectedTransaction.meta_data.quantity
      : tradeSize;

    // Calculate based on trade size, price difference, and leverage
    const pnlAmount = (priceDiff / openPrice) * quantity * leverage;

    // Calculate percentage gain/loss relative to margin
    const pnlPercentage = (pnlAmount / margin) * 100;

    if (isCalculate) {
      setProfitLoss({
        amount: pnlAmount,
        percentage: pnlPercentage,
      });
    } else {
      setProfitLoss({
        amount: selectedPairPrice.bid,
        percentage: (selectedPairPrice.bid / margin) * 100,
      });
    }
  };

  const submitTrade = async () => {
    console.log("=== CLOSE POSITION DEBUG START ===");
    console.log("Selected transaction:", selectedTransaction);
    console.log("Current price:", currentPrice);
    console.log("Profit/Loss:", profitLoss);

    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      // Include profit/loss in the metadata
      const tradeData = {
        meta_data: {
          closedAt: currentPrice
            ? currentPrice.toString()
            : selectedTransaction?.meta_data.boughtAt,
          profitLoss: profitLoss ? profitLoss.amount : 0,
          profitLossPercentage: profitLoss ? profitLoss.percentage : 0,
          openPrice: selectedTransaction?.meta_data.boughtAt,
        },
        id: selectedTransaction?.id,
      };

      console.log("Trade data being sent:", tradeData);

      const endpoint = `/api/trade/close`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tradeData),
      });

      const data = await response.json();
      console.log("Backend response:", {
        status: response.status,
        ok: response.ok,
        data: data,
      });

      if (!response.ok) {
        throw new Error(data.message || `Failed to close trade`);
      }

      // Update local transactions list
      const newTransactions = transactions.map((transaction) =>
        transaction.id === selectedTransaction?.id
          ? {
              ...transaction,
              closed: true,
              meta_data: {
                ...transaction.meta_data,
                closedAt: currentPrice?.toString(),
                profitLoss: profitLoss?.amount || 0, // FIXED: removed incorrect addition
                profitLossPercentage: profitLoss?.percentage,
              },
            }
          : transaction
      );

      console.log("Updated transactions:", newTransactions);
      dispatch(setTransactions(newTransactions));

      console.log("Dispatching fetchProfileDetails...");
      try {
        const profileResult = await dispatch(fetchProfileDetails()).unwrap();
        console.log("Profile refresh result:", profileResult);
      } catch (profileError) {
        console.error("Profile refresh failed:", profileError);
        setErrorMessage(
          "Position closed but balance may not reflect immediately"
        );
      }

      console.log("=== CLOSE POSITION DEBUG END ===");
      modal.close();
    } catch (error) {
      console.error("Close position error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={modal.isOpen}
      onClose={modal.close}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className="backdrop-blur-[3px]"
    >
      <Box
        sx={style}
        className="bg-white py-[37px] px-[48px] md:max-w-[680px] max-w-[370px] w-full md:w-[680px] rounded-[15px] "
      >
        <h2 className="text-zinc-800 flex justify-between text-2xl font-semibold font-['Poppins']">
          Close Position
          <button onClick={modal.close}>
            <IoClose />
          </button>
        </h2>
        <p className="text-zinc-800 mt-8 mb-[0px] text-base font-normal font-['Poppins']">
          Trade: {selectedTransaction?.id}
        </p>
        <div className="text-zinc-800 mt-4 mb-3 text-xl flex justify-between font-normal font-['Poppins']">
          <span className="font-bold ">
            {selectedTransaction?.meta_data.pair}
          </span>{" "}
          <span>{selectedTransaction?.price}</span>
        </div>

        {/* Trade Details */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-500">Entry Price</p>
              <p className="font-semibold">
                {selectedTransaction?.meta_data.boughtAt}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="font-semibold">
                {!priceUpdated
                  ? "..."
                  : currentPrice?.toFixed(5) || "Loading..."}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trade Type</p>
              <p
                className={`font-semibold ${
                  selectedTransaction?.type === "BUY"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {selectedTransaction?.type}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Leverage</p>
              <p className="font-semibold">
                {selectedTransaction?.meta_data.leverage
                  ? `1:${selectedTransaction.meta_data.leverage}`
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Profit/Loss Display */}
        {profitLoss && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              profitLoss.amount >= 0 ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">Profit/Loss</p>
                <p
                  className={`text-2xl font-bold ${
                    profitLoss.amount >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${profitLoss.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Return</p>
                <p
                  className={`text-2xl font-bold ${
                    profitLoss.percentage >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {profitLoss.percentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        <div className="w-full flex gap-[22px] justify-end">
          <button
            onClick={modal.close}
            className="w-[173px] h-[58px] bg-[#54163E12] rounded-[10px]"
          >
            <span className="text-zinc-800 text-lg font-medium font-['Poppins']">
              Cancel
            </span>
          </button>
          <button
            disabled={isSubmitting || !currentPrice || !priceUpdated}
            onClick={submitTrade}
            className="w-[173px] h-[58px] disabled:opacity-30 hover:bg-white hover:text-primaryBlue text-white border border-primaryBlue bg-primaryBlue rounded-[10px]"
          >
            <span className="text-lg font-medium font-['Poppins'] disabled:opacity-50 ">
              {isSubmitting ? "Processing..." : "Close Trade"}
            </span>
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default ClosePositionModal;
