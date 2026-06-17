import { useNavigate, Link } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * 新しいパスワードの設定。
 * TODO: 本物の認証に接続する（今はそのままログインへ遷移するだけ）。
 */
export default function ResetPassword() {
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/login");
  }

  return (
    <AuthShell
      title="新しいパスワード"
      description="新しいパスワードを設定してください"
      footer={
        <Link to="/login" className="text-muted-foreground hover:text-gold">
          ログインに戻る
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input type="password" placeholder="新しいパスワード" autoComplete="new-password" required />
        <Input type="password" placeholder="パスワード（確認）" autoComplete="new-password" required />
        <Button type="submit" size="lg" className="mt-2">
          パスワードを更新
        </Button>
      </form>
    </AuthShell>
  );
}
