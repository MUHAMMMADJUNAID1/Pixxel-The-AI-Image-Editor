import {Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { shadesOfPurple } from "@clerk/themes";
import { FloatingShapes } from "@/components/floating-shapes";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import Header from "@/components/header";
import Link from "next/link";
import Image from "next/image";
const inter = Inter({subsets : ["latin"]})
export const metadata = {
  title: "Pixxel The Editor",
  description: "AI Image Editor Where dreams come true",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressContentEditableWarning>
      <body
        className={`${inter.className} antialiased`}
      >
      <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
                <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            appearance={{
              baseTheme: shadesOfPurple,
            }}
          >
            <ConvexClientProvider>
              <Header />
              <main className="bg-slate-900 min-h-screen text-white overflow-x-hidden">
                <FloatingShapes />
                <Toaster richColors />
                {children}
              </main>
            </ConvexClientProvider>
        </ClerkProvider>
  
        </ThemeProvider>
      </body>
    </html>
  );
}
