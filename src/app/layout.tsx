import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Wiki",
  description: "A personal wiki for documentation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
