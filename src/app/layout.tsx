import type { Metadata } from "next";
import { DM_Mono, Outfit } from "next/font/google";
import { UserProvider } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastContainer } from "@/components/ui/toast";
import "./globals.css";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
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
      <body className={`${dmMono.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <UserProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
