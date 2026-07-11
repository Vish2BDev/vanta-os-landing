import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const aeonik = localFont({
  variable: "--aeonik",
  display: "swap",
  src: [
    { path: "../../public/assets/fonts/aeonik/Aeonik-Light.otf", weight: "300", style: "normal" },
    { path: "../../public/assets/fonts/aeonik/Aeonik-LightItalic.otf", weight: "300", style: "italic" },
    { path: "../../public/assets/fonts/aeonik/Aeonik-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/assets/fonts/aeonik/Aeonik-Medium.otf", weight: "500", style: "normal" },
  ],
});

const organetto = localFont({
  variable: "--organetto",
  display: "swap",
  src: [
    { path: "../../public/assets/fonts/organetto/organetto-bold.otf", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Vanta OS - infrastructure for high-performance living",
  description:
    "Vanta OS reads your bloodwork, wearables, diet and symptoms together, and tells you what they mean. For the Enhanced Generation.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${aeonik.variable} ${organetto.variable} antialiased`}
    >
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
