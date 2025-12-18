import Image from "next/image";
import Link from "next/link";
import React from "react";
import { FaArrowTrendUp } from "react-icons/fa6";

const Banner = () => {
  return (
    <div
      className="min-h-lvh w-full relative "
      style={{
        backgroundImage: `url(https://script.viserlab.com/visertrade/assets/images/frontend/banner/65f552af8be571710576303.png)`,
      }}
    >
      <div className="absolute px-6 lg:px-0 top-0 left-0 radial-bg w-full h-full flex flex-col  justify-center items-center">
        <h1 className="text-[35px] sm:text-[45px] max-w-[900px] md:text-[55px] lg:text-[65px] text-white font-bold text-center ">
          Trade With Confidence On Our Platform
        </h1>
        <p className="max-w-[600px] text-sm md:text-[1rem] font-normal mt-6 text-white text-center">
          Ensure profitability and resilience by optimizing your trading
          strategy with advantageous conditions for precious metals, energies,
          crypto, equity investments, and FX.
        </p>

        <div className="mt-10 flex flex-wrap md:flex-nowrap justify-center  gap-5 md:gap-20">
          <div className="w-full justify-center flex  gap-5">
            <div className="w-full max-w-[40px] md:max-w-[70px]">
              <Image
                src={"/bolt.png"}
                width={0}
                height={0}
                alt="bolt"
                style={{ width: "100%", height: "100%" }}
                sizes="100vw"
                className="w-full min-w-[40px]"
              />
            </div>
            <div className="flex flex-col gap-3 ">
              <span className="text-[1.25rem] text-white">Built for</span>
              <p className="text-[1.25rem] w-max font-bold text-white">
                Beginner Traders
              </p>
            </div>
          </div>
          <div className="w-[5px] zr:hidden md:flex h-[60px] bg-gradient-to-b from-[#ffffff26] via-[#bbbbbb] to-[#ffffff26] "></div>
          <div className="w-full justify-center flex gap-5">
            <div className="w-full max-w-[70px]">
              <Image
                src={"/coin.png"}
                width={0}
                height={0}
                alt="bolt"
                style={{ width: "100%", height: "100%" }}
                sizes="100vw"
                className="w-full min-w-[70px] object-contain"
              />
            </div>
            <div className="flex flex-col gap-3 ">
              <span className="w-max text-[1.25rem] text-white">
                Tailored Trading
              </span>
              <p className="text-[1.25rem] w-max font-bold text-white">Elite</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 justify-center md:gap-5">
          {/* <button className="w-[180px] md:w-[230px] py-3 md:py-5 bg-base bg-gradient-to-r from-base to-[#fff3be] hover:from-[#fff3be] hover:to-base rounded-[16px] text-[1.125rem] font-semibold flex gap-2 items-center justify-center">
            Register
            <span>
              <FaArrowTrendUp />
            </span>
          </button> */}
          <Link href={"/login"}>
            <button className="w-[280px] md:w-[430px] text-base hover:text-black border border-base py-3 md:py-5 bg-transparent hover:bg-gradient-to-r hover:from-base hover:to-[#fff3be]  rounded-[16px] text-[1.425rem] font-semibold flex gap-2 items-center justify-center">
              Login
              <span>
                <FaArrowTrendUp />
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Banner;
