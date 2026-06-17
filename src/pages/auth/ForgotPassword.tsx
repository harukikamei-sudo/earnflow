import { Link } from "react-router-dom";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * パスワード再設定メールの送信。
 * TODO: 本物の認証に接続する。
 */
export default function ForgotPassword() {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <AuthShell
      title="パスワードをお忘れですか？"
      description="登録メールアドレスに再設定リンクを送信します"
      footer={
        <Link to="/login" className="text-muted-foreground hover:text-gold">
          ログインに戻る
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input type="email" placeholder="メールアドレス" autoComplete="email" required />
        <Button type="submit" size="lg" className="mt-2">
          再設定リンクを送信
        </Button>
      </form>
    </AuthShell>
  );
}
