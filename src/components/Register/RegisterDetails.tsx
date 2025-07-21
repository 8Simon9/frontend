import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, ChangeEvent, FormEvent } from "react";

// Define types for form data
interface FormData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

// Define types for API request payload
interface ApiPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Define types for API response
interface ApiResponse {
  message?: string;
  success?: boolean;
  data?: any;
  // Add other properties based on actual API response
}

const RegisterDetails: React.FC = () => {
  // State for form fields with typed initial values
  const [formData, setFormData] = useState<FormData>({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  // State for form submission status
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const router = useRouter();

  // Handle input changes with proper typing
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission with proper typing
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate form data
    if (
      !formData.firstname ||
      !formData.lastname ||
      !formData.email ||
      !formData.password
    ) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!formData.terms) {
      setError("You must agree to the terms and policies");
      setLoading(false);
      return;
    }

    // Prepare data for API submission
    const apiData = {
      email: formData.email,
      password: formData.password,
      full_name: `${formData.firstname} ${formData.lastname}`,
      username: formData.firstname,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/account/signup/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      );

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Registration successful! You can now sign in.");
      // Reset form after successful submission

      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      router.push("/login");
    } catch (err) {
      console.log(err);
      if (err instanceof Error) {
        setError(err.message || "Something went wrong. Please try again.");
      } else {
        setError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full h-full flex">
      <div className="zr:hidden md:flex w-full relative min-h-lvh max-w-[50%]">
        <Image
          src={"/register.png"}
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: "100%", height: "100%" }}
          alt="register"
          className="object-cover"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-[#00000061]"></div>
      </div>

      <div className="min-h-lvh p-6 md:p-10 bg-[hsl(222,65%,8%)] w-full">
        <div className="flex justify-between w-full">
          <Link href={"/"}>
            <div className="w-full h-fit max-w-[200px]">
              <Image
                src={"/logo.png"}
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: "100%", height: "100%" }}
                alt="register"
              />
            </div>
          </Link>
          <div className="h-fit flex gap-5 items-center">
            <p className="zr:hidden md:flex text-white">
              Already have an account?
            </p>
            <Link href={"/login"}>
              <button className="bg-base text-black text-sm md:text-[16px] py-2 md:py-3 px-[20px] md:px-[30px] lg:px-[40px] hover:opacity-85 font-semibold rounded-[8px]">
                Sign In
              </button>
            </Link>
          </div>
        </div>

        <h2 className="text-[2rem] mt-20 font-bold text-white">Register Now</h2>
        <p className="text-[1rem] mt-5 text-white">
          Take the first step and unlock endless possibilities
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-md text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-md text-green-300">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-10 text-white flex flex-col gap-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
            <div className="flex flex-col gap-3">
              <label htmlFor="firstname">First Name</label>
              <input
                type="text"
                name="firstname"
                id="firstname"
                value={formData.firstname}
                onChange={handleChange}
                className="px-[24px] py-[14px] bg-[rgba(0,0,0,0.6)] border border-[rgba(0,0,0,0.2)] rounded-[8px] h-fit"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="lastname">Last Name</label>
              <input
                type="text"
                name="lastname"
                id="lastname"
                value={formData.lastname}
                onChange={handleChange}
                className="px-[24px] py-[14px] bg-[rgba(0,0,0,0.6)] border border-[rgba(0,0,0,0.2)] rounded-[8px] h-fit"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="px-[24px] py-[14px] bg-[rgba(0,0,0,0.6)] border border-[rgba(0,0,0,0.2)] rounded-[8px] h-fit"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col gap-3">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                className="px-[24px] py-[14px] bg-[rgba(0,0,0,0.6)] border border-[rgba(0,0,0,0.2)] rounded-[8px] h-fit"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="px-[24px] py-[14px] bg-[rgba(0,0,0,0.6)] border border-[rgba(0,0,0,0.2)] rounded-[8px] h-fit"
              />
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="checkbox"
              name="terms"
              id="terms"
              checked={formData.terms}
              onChange={handleChange}
            />
            <p className="text-xs md:text-base">
              I agree with <span className="">Privacy Policy </span>,{" "}
              <span className="">Terms of Service </span>,{" "}
              <span className="">Trading Policy</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 md:py-5 bg-base bg-gradient-to-r from-base to-[#fff3be] hover:from-[#fff3be] hover:to-base rounded-[12px] text-[1.125rem] text-black font-semibold flex gap-2 items-center justify-center disabled:opacity-70"
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default RegisterDetails;