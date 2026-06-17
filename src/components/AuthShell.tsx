import { LogoMark } from "./Logo";

/** 認証画面（ログイン/登録/パスワード）共通の中央寄せレイアウト */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-app-radial flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="h-14 w-14" />
          <h1 className="mt-4 text-2xl font-black tracking-tight text-gold-gradient">
            今いくら稼いでる？
          </h1>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            EarnFlow
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-xl">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">{description}</p>
          {children}
        </div>

        {footer ? <div className="mt-5 text-center text-sm">{footer}</div> : null}
      </div>
    </div>
  );
}
