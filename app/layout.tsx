import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "PR Gradient",
  description: "Управление размещениями блогеров — НТС «Градиент»",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <QueryProvider>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            toastOptions={{ style: { fontSize: 13, fontFamily: "var(--font-sans)" } }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
