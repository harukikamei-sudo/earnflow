import { useNavigate, Link } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * 新規登録。
 * TODO: 本物の認証に接続する（今はそのままホームへ遷移するだけ）。
 */
export default function Register() {
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/");
  }

  return (
    <AuthShell
      title="新規登録"
      description="無料でアカウントを作成"
      footer={
        <p className="text-muted-foreground">
          すでにアカウントをお持ち？{" "}
          <Link to="/login" className="font-bold text-gold hover:underline">
            ログイン
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input type="text" placeholder="ニックネーム" autoComplete="nickname" required />
        <Input type="email" placeholder="メールアドレス" autoComplete="email" required />
        <Input type="password" placeholder="パスワード" autoComplete="new-password" required />
        <Button type="submit" size="lg" className="mt-2">
          登録する
        </Button>
      </form>
    </AuthShell>
  );
}
