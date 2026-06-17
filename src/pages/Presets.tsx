import { Settings } from "lucide-react";
import { PageStub } from "@/components/PageStub";

/**
 * バイト先管理 & 目標設定。
 *
 * store.upsertWorkplace() / deleteWorkplace() / saveGoal() を使って
 * バイト先の CRUD と月目標の設定を行う。
 */
export default function Presets() {
  return (
    <PageStub
      icon={Settings}
      title="バイト先管理"
      subtitle="給与タイプと割増ルールを設定"
      todo={[
        "バイト先の追加・編集・削除（名前・色）",
        "給与タイプ: 時給制 / 日給制 の切り替え",
        "時給(円/時) または 日給(円/日) の入力",
        "時間帯別倍率ルール（例: 深夜22時〜 1.25倍）",
        "月目標額の設定",
      ]}
    />
  );
}
