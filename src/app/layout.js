import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import Header from "@/components/Header";
import ReferralCapture from "@/components/ReferralCapture";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Golden Goal | Solana Prediction Market",
  description: "Bet on the future with Golden Goal prediction markets on Solana.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-zinc-50 min-h-screen flex flex-col relative`}>
        {/* Web3 Glowing Background Orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/10 blur-[120px]"></div>
          <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-indigo-600/10 blur-[100px]"></div>
        </div>

        <WalletContextProvider>
          <Header />
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </WalletContextProvider>
      </body>
    </html>
  );
}
