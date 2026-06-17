import { useNavigate, Link } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * ログイン。
 * TODO: 本物の認証に接続する（今はそのままホームへ遷移するだけ）。
 */
export default function Login() {
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/");
  }

  return (
    <AuthShell
      title="ログイン"
      description="アカウントにログインして稼ぎを記録しよう"
      footer={
        <>
          <Link to="/forgot-password" className="text-muted-foreground hover:text-gold">
            パスワードを忘れた場合
          </Link>
          <p className="mt-2 text-muted-foreground">
            アカウントがない？{" "}
            <Link to="/register" className="font-bold text-gold hover:underline">
              新規登録
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input type="email" placeholder="メールアドレス" autoComplete="email" required />
        <Input type="password" placeholder="パスワード" autoComplete="current-password" required />
        <Button type="submit" size="lg" className="mt-2">
          ログイン
        </Button>
      </form>
    </AuthShell>
  );
}
