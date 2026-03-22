import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlanLab — Curriculum Planning Workspace",
  description: "A curriculum planning workspace for teachers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
