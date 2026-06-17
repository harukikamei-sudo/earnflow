import { Coins, Pause, Play, RotateCcw } from "lucide-react";
import { PageStub } from "@/components/PageStub";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * 給料カウンター（ホーム）。
 *
 * 今は静的なプレビュー表示。リアルタイム計算ロジックは
 * src/lib/earnings.ts の currentEarnings() を毎秒呼び出して接続する。
 */
export default function Home() {
  return (
    <PageStub
      icon={Coins}
      title="給料カウンター"
      subtitle="今いくら稼いでる？"
      todo={[
        "バイト先を選択して「スタート」で計測開始",
        "毎秒、時給・時間帯別倍率に応じて収入を加算表示",
        "ストップでセッションを確定し履歴へ保存",
        "月目標トラッカー（今月の合計・進捗・あと¥◯）",
      ]}
    >
      {/* カウンター表示プレビュー */}
      <Card className="gold-glow overflow-hidden">
        <CardContent className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="text-xs font-medium tracking-wider text-muted-foreground">
            今のセッション
          </p>
          <p className="tabular text-5xl font-black text-gold-gradient">¥0.00</p>
          <p className="tabular mt-1 text-sm text-muted-foreground">00:00:00 ・ 待機中</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Button size="lg" className="col-span-2">
          <Play className="fill-current" />
          スタート
        </Button>
        <Button size="lg" variant="secondary" disabled>
          <Pause />
        </Button>
        <Button size="lg" variant="outline" className="col-span-3">
          <RotateCcw />
          リセット
        </Button>
      </div>
    </PageStub>
  );
}
