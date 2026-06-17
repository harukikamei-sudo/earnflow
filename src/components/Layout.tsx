import { Outlet } from "react-router-dom";
import { Logo } from "./Logo";

/**
 * アプリ共通レイアウト（ヘッダーのみ）。
 * ナビゲーション（カレンダー/バイト先）は廃止し、街の「わが家」「どうぐ屋」などで
 * すべて管理する。ホーム画面はこの上に全画面で重なる。
 */
export function Layout() {
  return (
    <div className="bg-app-radial flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
          <Logo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-10 pt-5">
        <Outlet />
      </main>
    </div>
  );
}
