import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReferralCapture from "@/components/ReferralCapture";
import IntroAnimation from "@/components/IntroAnimation";
import WhitelistGuard from "@/components/WhitelistGuard";
import Maintenance from "@/components/Maintenance";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";


const inter = Inter({ subsets: ["latin"] });

// Set to true to force maintenance mode, or false to disable.
// Can also be controlled via NEXT_PUBLIC_MAINTENANCE_MODE environment variable.
const MAINTENANCE_MODE = true || (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true");

export const metadata = {
  title: "Golden Goal | Solana Prediction Market",
  description: "Forecast the future with Golden Goal competitive prediction markets on Solana.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if (window.location.hostname === 'goldengoalsol.com') {
            window.location.replace('https://www.goldengoalsol.com' + window.location.pathname + window.location.search);
          }
        ` }} />
      </head>
      <body className={`${inter.className} bg-black text-zinc-50 min-h-screen flex flex-col relative`}>
        {MAINTENANCE_MODE ? (
          <Maintenance />
        ) : (
          <>
            <IntroAnimation />
            {/* Web3 Glowing Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
              <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/25 blur-[120px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-600/15 blur-[120px]"></div>
              <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-indigo-600/15 blur-[100px]"></div>
            </div>

            <WalletContextProvider>
              <Header />
              <Suspense fallback={null}>
                <ReferralCapture />
              </Suspense>
              <main className="flex-1 flex flex-col">
                <WhitelistGuard>
                  {children}
                </WhitelistGuard>
              </main>
              <Footer />
            </WalletContextProvider>
          </>
        )}
        <Analytics />
      </body>
    </html>
  );
}

