import type { Metadata } from "next";
import type { ReactNode } from "react";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "GS Mapeamento",
  description: "Atas e participação dos grupos",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
