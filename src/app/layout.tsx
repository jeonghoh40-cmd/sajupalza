import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0a1a",
};

export const metadata: Metadata = {
  title: "만세력 - 운명 캐릭터카드",
  description: "만세력 기반 사주, 자미두수, 수비학, MBTI를 교차검증하여 당신만의 운명 캐릭터카드를 만들어 드립니다.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "만세력",
    startupImage: "/icon.svg",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
