import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Motion Avatar",
  description: "ブラウザ内で動く無料のリアルタイムモーションアバター",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
