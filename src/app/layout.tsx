import type { Metadata } from "next";
import { Hanken_Grotesk, Manrope } from "next/font/google";
import { UserProvider } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastContainer } from "@/components/ui/toast";
import { BaselineGrid } from "@/components/dev/BaselineGrid";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Stock Market Game",
  description: "Learn, practice, and succeed in the market",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${hankenGrotesk.variable} ${manrope.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <UserProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
              <BaselineGrid />
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
