import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Stage, type StageCoin } from "@/components/pixel/Stage";
import { DQCommand, DQWindow } from "@/components/pixel/DQWindow";
import { Overworld } from "@/components/game/Overworld";
import { TouchControls } from "@/components/game/TouchControls";
import { WorkMenu } from "@/components/game/WorkMenu";
import { MapEditor, type Brush } from "@/components/game/MapEditor";
import { useOverworld } from "@/game/useOverworld";
import { DOOR, SIGN_POS, type TileChar } from "@/game/map";
import { addProp, paintTile } from "@/game/mapStore";
import { createWorkplace } from "@/game/workplace";
import { useSalaryEngine } from "@/hooks/useSalaryEngine";
import { multiplierAt } from "@/lib/earnings";
import { deleteWorkplace, getWorkplaces, upsertWorkplace } from "@/lib/store";
import type { Workplace } from "@/lib/types";
import { levelInfo, rankForLevel } from "@/lib/rpg";
import { cn, formatDuration, formatYen, formatYenPrecise, uid } from "@/lib/utils";

type Scene = "roam" | "work";

/**
 * 給料クエスト（ホーム）— ドラクエ風トップダウンRPG。
 *
 * 草原を自由に歩き、バイト先（¥バイトの建物）に近づくと選択肢が出る。
 * 複数のバイトを登録・選択でき、「はたらく」を選ぶと労働モードへ。
 * 労働中は横スクロールの仕事シーンで収入＝ゴールド＝経験値が増えていく。
 */
export default function Home() {
  const engine = useSalaryEngine();
  const { sessionEarnings, totalGold, elapsedSec } = engine;

  const [scene, setScene] = useState<Scene>("roam");
  const working = scene === "work";

  // 編集モード（ダッシュボード）。公開時はこの一式を外すだけ
  const [editMode, setEditMode] = useState(false);
  const [brush, setBrush] = useState<Brush>({ kind: "tile", ch: "G" as TileChar });
  function handleTileClick(x: number, y: number) {
    if (brush.kind === "tile") paintTile(x, y, brush.ch);
    else if (brush.kind === "erase") paintTile(x, y, "G");
    else if (brush.kind === "prop") addProp({ id: uid(), src: brush.src, x, y, w: 3 });
  }

  // バイト先（無ければ既定を1件作って保存）
  const [workplaces, setWorkplaces] = useState<Workplace[]>(() => {
    const ws = getWorkplaces();
    if (ws.length > 0) return ws;
    const def = createWorkplace("マイバイト", 1100, true);
    upsertWorkplace(def);
    return [def];
  });
  const refresh = () => setWorkplaces(getWorkplaces());

  const overworld = useOverworld({ enabled: scene === "roam" && !editMode });
  const { snap } = overworld;

  // 時刻（時間帯・バフ用）
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const activeWp = working ? engine.runningWorkplace : null;
  const multiplier = activeWp ? multiplierAt(new Date(nowTs), activeWp.timeRules) : 1;
  const perSecond =
    activeWp && activeWp.payType === "hourly"
      ? (activeWp.hourlyRate / 3600) * multiplier
      : 0;

  const level = useMemo(() => levelInfo(totalGold), [totalGold]);
  const rank = rankForLevel(level.level);

  // 接近判定（バイト先 / 看板）
  const hx = Math.round(snap.px);
  const hy = Math.round(snap.py);
  const settled = !snap.moving;
  const man = (ax: number, ay: number) => Math.abs(hx - ax) + Math.abs(hy - ay);
  const nearShop = !working && settled && man(DOOR.x, DOOR.y) <= 1;
  const nearSign = !working && settled && !nearShop && man(SIGN_POS.x, SIGN_POS.y) <= 1;

  /* ---- コイン演出 ---- */
  const [coins, setCoins] = useState<StageCoin[]>([]);
  const lastIntRef = useRef(0);
  const coinIdRef = useRef(0);
  useEffect(() => {
    if (!working) {
      lastIntRef.current = Math.floor(sessionEarnings);
      return;
    }
    const cur = Math.floor(sessionEarnings);
    const delta = cur - lastIntRef.current;
    if (delta > 0) {
      lastIntRef.current = cur;
      const id = ++coinIdRef.current;
      setCoins((prev) => [...prev.slice(-5), { id, amount: delta }]);
      window.setTimeout(() => setCoins((prev) => prev.filter((c) => c.id !== id)), 1000);
    }
  }, [sessionEarnings, working]);

  /* ---- レベルアップ演出 ---- */
  const [levelUp, setLevelUp] = useState<{ level: number; rank: string } | null>(null);
  const prevLevelRef = useRef(level.level);
  useEffect(() => {
    if (level.level > prevLevelRef.current && working) {
      setLevelUp({ level: level.level, rank: rankForLevel(level.level).name });
      window.setTimeout(() => setLevelUp(null), 2600);
    }
    prevLevelRef.current = level.level;
  }, [level.level, working]);

  /* ---- 操作 ---- */
  function startWork(wp: Workplace) {
    lastIntRef.current = 0;
    prevLevelRef.current = levelInfo(totalGold).level;
    engine.start(wp);
    setScene("work");
  }
  function stopWork() {
    engine.stop();
    engine.reset();
    setScene("roam");
  }
  function addWorkplace(wp: Workplace) {
    upsertWorkplace(wp);
    refresh();
  }
  function removeWorkplace(id: string) {
    deleteWorkplace(id);
    refresh();
  }

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-[#3f9e44]">
      {working ? (
        /* ============ 労働シーン ============ */
        <div className="no-scrollbar mx-auto flex h-full max-w-md flex-col gap-3 overflow-y-auto px-4 py-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-pixel text-lg font-bold text-gold-gradient">はたらいています</h1>
            <span className="font-pixel text-[11px] text-white/60">{activeWp?.name}</span>
          </div>

          <Stage walking level={level.level} nowTs={nowTs} coins={coins} buffed={multiplier > 1} />

          <DQWindow title="しょとく">
            <div className="text-center">
              <p className="font-pixel text-4xl font-bold leading-none text-gold-gradient">
                ¥{formatYenPrecise(sessionEarnings, 2)}
              </p>
              <p className="font-pixel mt-1 text-xs text-white/70">
                {formatYen(totalGold, false)} G ためた
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between font-pixel text-sm">
                <span>{rank.emoji} {rank.name}</span>
                <span className="text-gold">Lv.{level.level}</span>
              </div>
              <ExpBar progress={level.progress} />
              <p className="font-pixel text-right text-[11px] text-white/60">
                つぎのレベルまで あと {formatYen(level.remaining)}
              </p>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 font-pixel text-[11px] text-white/70">
              <span className="tabular">{formatDuration(elapsedSec)}</span>
              <span className="text-white/30">／</span>
              <span>{perSecond > 0 ? `¥${perSecond.toFixed(2)}/秒` : "—"}</span>
              {multiplier > 1 && (
                <span className="rounded bg-gold/20 px-1.5 py-0.5 font-bold text-gold">🌙 ×{multiplier}</span>
              )}
            </div>
          </DQWindow>

          <DQWindow title="コマンド">
            <DQCommand label="しごとを やめて まちに もどる" active accent="red" onClick={stopWork} />
          </DQWindow>
        </div>
      ) : (
        /* ============ 町（トップダウン） ============ */
        <>
          <Overworld
            snap={snap}
            className="absolute inset-0"
            editMode={editMode}
            onTileClick={editMode ? handleTileClick : undefined}
          />

          {/* 上部HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
            <div className="dq-window pointer-events-auto px-3 py-1.5">
              <div className="flex items-center gap-3 font-pixel text-xs">
                <span className="text-gold">Lv.{level.level}</span>
                <span>{formatYen(totalGold, false)} G</span>
              </div>
              <div className="mt-1 w-28">
                <ExpBar progress={level.progress} thin />
              </div>
            </div>
            <div className="pointer-events-auto flex gap-1">
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className={cn(
                  "dq-window grid h-9 w-9 place-items-center text-sm",
                  editMode && "ring-2 ring-gold",
                )}
                aria-label="編集モード"
                title="編集モード（公開時は外す）"
              >
                🛠
              </button>
              <Link to="/calendar" className="dq-window grid h-9 w-9 place-items-center text-sm" aria-label="カレンダー">
                📅
              </Link>
              <Link to="/presets" className="dq-window grid h-9 w-9 place-items-center text-sm" aria-label="バイト先">
                ⚙️
              </Link>
            </div>
          </div>

          {/* 編集モード：マップエディタ */}
          {editMode && <MapEditor brush={brush} setBrush={setBrush} onClose={() => setEditMode(false)} />}

          {/* バイト先に接近 → 選択肢（複数選択・追加・削除） */}
          {!editMode && nearShop && (
            <div className="absolute left-1/2 top-16 w-full max-w-xs -translate-x-1/2 px-4">
              <WorkMenu
                workplaces={workplaces}
                onStart={startWork}
                onAdd={addWorkplace}
                onDelete={removeWorkplace}
              />
            </div>
          )}

          {/* 看板に接近 → 説明 */}
          {!editMode && nearSign && (
            <div className="absolute left-1/2 top-20 w-full max-w-xs -translate-x-1/2 px-4">
              <DQWindow title="たてふだ" className="anim-dq-pop">
                <p className="font-pixel text-sm leading-relaxed text-white">
                  やあ ぼうけんしゃ！
                  <br />
                  十字キーで あるいて
                  <br />
                  「¥バイト」に ちかづくと
                  <br />
                  はたらけるぞ！
                </p>
              </DQWindow>
            </div>
          )}

          {!editMode && <TouchControls onPress={overworld.press} onRelease={overworld.release} />}

          {/* ヒント */}
          {!editMode && !nearShop && !nearSign && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
              <p className="font-pixel rounded bg-black/55 px-3 py-1 text-[11px] text-white/80">
                十字キーで移動・「¥バイト」に近づこう
              </p>
            </div>
          )}
        </>
      )}

      {/* レベルアップ メッセージ */}
      {levelUp && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center px-6">
          <DQWindow className="anim-dq-pop w-full max-w-xs text-center">
            <p className="font-pixel text-sm leading-relaxed text-white">
              ＊「ゆうしゃ」は
              <br />
              レベル <span className="text-gold">{levelUp.level}</span> に あがった！
            </p>
            <p className="font-pixel mt-2 text-sm text-gold">{`「${levelUp.rank}」になった！`}</p>
          </DQWindow>
        </div>
      )}
    </div>
  );
}

/** 経験値バー（ドラクエ風） */
function ExpBar({ progress, thin }: { progress: number; thin?: boolean }) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-sm bg-black ring-1 ring-white/40",
        thin ? "h-2" : "h-3",
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-300"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );
}
