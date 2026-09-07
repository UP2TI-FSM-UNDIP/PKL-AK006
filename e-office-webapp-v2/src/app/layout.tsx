import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeProvider";

export const metadata: Metadata = {
  title: "E-Office FSM UNDIP",
  description: "Sistem Pengajuan Persuratan Digital untuk Mahasiswa",
  icons: {
    icon: [
      { url: '/persuratan-penyataan-masih-kuliah/favicon.png', type: 'image/png' },
    ],
    apple: '/persuratan-penyataan-masih-kuliah/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
