import { CalendarDays } from "lucide-react";
import { PageStub } from "@/components/PageStub";

/**
 * 稼ぎカレンダー。
 *
 * store.getSessions() を日付(dateKey)で集計し、
 * 月間グリッド・月別収入グラフ(recharts)・セッション履歴を描画する。
 */
export default function CalendarPage() {
  return (
    <PageStub
      icon={CalendarDays}
      title="稼ぎカレンダー"
      subtitle="日々の稼ぎを振り返る"
      todo={[
        "月間カレンダーグリッドに日別収入を表示",
        "今月 / 今年 / 累計合計の切り替え",
        "月別収入グラフ（recharts の BarChart）",
        "セッション履歴一覧（日付・勤務時間・収入）",
      ]}
    />
  );
}
