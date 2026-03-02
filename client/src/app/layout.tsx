import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/shared/providers/query-provider";
import { ThemeSync } from "@/shared/lib/theme-sync";
import { Toaster } from "@/shared/ui/shadcn/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Что поесть?",
  description: "Telegram Mini App для выбора рецептов",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ThemeSync />
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
