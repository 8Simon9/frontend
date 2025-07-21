import { useDisclosure } from "@/hooks/useDisclosure";
import { RootState } from "@/redux/reducers";
import { fetchProfileDetails, logout } from "@/redux/reducers/userReducer";
import { AppDispatch } from "@/redux/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaWallet } from "react-icons/fa";
import { GoHistory } from "react-icons/go";
import { useDispatch, useSelector } from "react-redux";
import DepositModal from "./Modals/DepositModal";
import WithdrawalModal from "./Modals/WithdrawalModal";

const Navbar = () => {
  const [isLogout, setIsLogout] = useState(false);
  const [isDropdown, setIsDropDown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { user, loading } = useSelector((store: RootState) => store.user);

  const router = useRouter();

  const depositModal = useDisclosure();
  const withdrawModal = useDisclosure();

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchProfileDetails());
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Call the logout API route to clear the HTTP-only cookie
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important to include credentials for cookie operations
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Update Redux state regardless of API response
      dispatch(logout());

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear Redux state and redirect even if API call fails
      dispatch(logout());
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
      setIsLogout(false); // Close the logout dropdown
    }
  };

  return (
    <nav className="relative bg-primaryBlue text-white">
      <div className=" flex gap-6 py-2">
        <div className="w-[320px] p-4 text-xl md:text-2xl lg:text-3xl border-r-2 border-[#040b11]">
          <Link href={"/trade"}>
            <img src="/logo.png" alt="logo" />
          </Link>
        </div>

        <div className="absolute md:relative  top-full left-0 flex gap-5 md:gap:10 lg:gap-14 items-center  justify-center md:justify-end lg:justify-center w-full py-3 border-r-2 border-[#040b11]">
          <div className="w-full  flex gap-10 justify-center lg:justify-start sm:gap-5 md:gap:10 lg:gap-24">
            <div>
              <p className="text-xs sm:text-sm md:text-base lg:text-base">
                CREDIT
              </p>
              <p className="text-xs sm:text-sm md:text-base lg:text-base">
              ${loading ? "..." : user.credit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm md:text-base lg:text-base">
                EQUITY
              </p>
              <p className="text-xs sm:text-sm md:text-base lg:text-base">
                ${loading ? "..." : user.equity.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm md:text-base lg:text-base">
                CLOSE P&L
              </p>
              <p className="text-xs sm:text-sm md:text-base lg:text-base">
                ${loading ? "..." : user.close_p_and_l.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 items-center pr-0 lg:pr-0">
          <span className="zr:hidden md:flex text-[20px] md:text-[25px] lg:text-[30px]">
            <FaWallet />
          </span>
          <div className="">
            <p className="text-xs mb:text-sm md:text-base lg:text-base">
              BALANCE
            </p>
            <p className="text-xs mb:text-sm md:text-base lg:text-base">
              {" "}
              ${user.balance.toFixed(2)}
            </p>
          </div>

          <button
            onClick={depositModal.open}
            className="bg-[#18a0fb] text-[10px] mb:text-sm md:text-base px-4 md:px-8 py-1 rounded-lg h-fit"
          >
            DEPOSIT
          </button>
          <button
            onClick={withdrawModal.open}
            className="bg-green-600 text-white text-[10px] mb:text-sm md:text-base px-4 md:px-8 py-1 rounded-lg h-fit"
          >
            WITHDRAW
          </button>
        </div>

        <div className="flex gap-5 items-center px-4 border-l-2 border-[#040b11]">
          <div
            className={`absolute xl:relative top-full xl:top-auto right-0 bg-primaryBlue p-5 xl:p-0 flex gap-5 items-center ${
              isDropdown ? "flex" : "zr:hidden xl:flex"
            } `}
          >
            <Link href={"/transactions"}>
              <span>
                <GoHistory size={30} />
              </span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="  z-[99] text-primaryBlue bg-red-400 hover:bg-primaryBlue hover:text-red-400 border border-red-400  py-3 px-6 rounded-[6px] disabled:opacity-70"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
          <button onClick={() => setIsDropDown((prev) => !prev)}>
            <span className="zr:flex xl:hidden text-base ">
              <BsThreeDotsVertical />
            </span>
          </button>
        </div>
      </div>

      <DepositModal modal={depositModal} />
      <WithdrawalModal modal={withdrawModal} />
    </nav>
  );
};

export default Navbar;
