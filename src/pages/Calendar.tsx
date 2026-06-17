import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarBoard } from "@/components/game/CalendarBoard";

/**
 * 稼ぎカレンダー。月間グリッドに日別収入を表示する。
 */
export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/30">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">稼ぎカレンダー</h1>
          <p className="text-sm text-muted-foreground">日々の稼ぎを振り返る</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-5">
          <CalendarBoard />
        </CardContent>
      </Card>
    </div>
  );
}
