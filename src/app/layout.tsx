import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Misinformation Examination",
  description: "Examine commonly held misconceptions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
