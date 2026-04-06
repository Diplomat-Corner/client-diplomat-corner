import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "react-phone-number-input/style.css";
import { Suspense } from "react";
import LoadingComponent from "@/components/ui/loading-component";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Diplomat Corner",
  description: "Diplomat Corner - Your trusted marketplace For Diplomats",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ST2RQHCTC2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ST2RQHCTC2');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <Suspense fallback={<LoadingComponent />}>
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            appearance={{
              baseTheme: undefined,
              variables: {
                colorPrimary: "#5B8F2D",
              },
            }}
          >
            {children}
          </ClerkProvider>
        </Suspense>
      </body>
    </html>
  );
}
