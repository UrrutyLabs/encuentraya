import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/Provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CrashReportingInit } from "@/components/CrashReportingInit";
import { CategoriesPrefetcher } from "@/components/CategoriesPrefetcher";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Arreglatodo - Soluciones confiables para tu hogar",
  description:
    "Encontrá, reservá y pagá profesionales verificados para arreglos y servicios cotidianos en Uruguay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <CrashReportingInit />
          <TRPCProvider>
            <CategoriesPrefetcher />
            {children}
          </TRPCProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
