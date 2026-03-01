import type { Metadata } from "next";
import "./globals.css";

const fontLinks = [
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap",
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
];

export const metadata: Metadata = {
  title: "Media Play | Man-of Group",
  description: "주간 콘텐츠 포인트 트래킹 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {fontLinks.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body className="antialiased min-h-screen bg-[#F9F7F4]">
        {/* Header */}
        <header className="bg-[#1C1917] text-white sticky top-0 z-50 border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C0F0FB] to-[#7DD3FC] flex items-center justify-center text-[#1C1917] text-sm font-bold font-heading">
                M
              </div>
              <div>
                <span className="font-heading font-semibold text-base tracking-wide group-hover:text-[#C0F0FB] transition-colors">
                  Media Play
                </span>
                <span className="text-[10px] text-[#78716C] ml-2 hidden sm:inline">
                  Man-of Group
                </span>
              </div>
            </a>
            <nav className="flex items-center gap-3 text-sm">
              <a
                href="/"
                className="text-white/70 hover:text-[#C0F0FB] transition-colors text-xs"
              >
                Leaderboard
              </a>
              <a
                href="/add"
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C0F0FB] to-[#7DD3FC] text-[#1C1917] font-semibold
                           hover:from-[#FFEA00] hover:to-[#FCD34D] transition-all text-xs shadow-sm"
              >
                + 콘텐츠 추가
              </a>
            </nav>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>

        {/* Footer */}
        <footer className="bg-[#1C1917] text-[#78716C] text-xs py-6 mt-12 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 text-center space-y-1">
            <p className="font-heading text-white/30">Man-of Group</p>
            <p>Media Play Tracker</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
