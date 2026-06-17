import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface PageStubProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** これから実装する機能のチェックリスト（README の仕様と対応） */
  todo: string[];
  children?: React.ReactNode;
}

/**
 * 開発用のページ雛形。
 * 各ページの目的と「これから実装する機能」を明示しておき、
 * 後から中身を差し込みやすくする。
 */
export function PageStub({ icon: Icon, title, subtitle, todo, children }: PageStubProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/30">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {children}

      <Card className={cn("border-dashed")}>
        <CardContent className="pt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gold">
            実装予定（TODO）
          </p>
          <ul className="flex flex-col gap-2">
            {todo.map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/60" />
                {t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
