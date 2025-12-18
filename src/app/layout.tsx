import type { Metadata, Viewport } from "next";
import ProviderWrapper from "@/components/ProviderWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisualTrade",
  description: "The best trading platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="">
        <div className="w-full">
          <ProviderWrapper>{children}</ProviderWrapper>
        </div>
      </body>
    </html>
  );
}
