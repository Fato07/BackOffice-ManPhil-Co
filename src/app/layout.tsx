import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: "ManPhil&Co Property Management",
  description: "Back office system for managing luxury vacation rental properties",
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: "ManPhil&Co Property Management",
    description: "Back office system for managing luxury vacation rental properties",
    siteName: "ManPhil&Co",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${playfair.variable} ${inter.className}`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NuqsAdapter>
              <QueryProvider>
                {children}
                <Toaster />
              </QueryProvider>
            </NuqsAdapter>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
