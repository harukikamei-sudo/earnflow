import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, type StageCoin } from "@/components/pixel/Stage";
import { DQCommand, DQWindow } from "@/components/pixel/DQWindow";
import { Overworld } from "@/components/game/Overworld";
import { TouchControls } from "@/components/game/TouchControls";
import { WorkMenu } from "@/components/game/WorkMenu";
import { MapEditor, type Brush } from "@/components/game/MapEditor";
import { CostumePanel } from "@/components/game/CostumePanel";
import { CalendarBoard } from "@/components/game/CalendarBoard";
import { EarningsChart } from "@/components/game/EarningsChart";
import { GoalSettings } from "@/components/game/GoalSettings";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { PixelImage } from "@/components/pixel/PixelImage";
import { getBuiltinCharacter, HERO_DOWN_A, SHOPKEEPER, type HeroDir } from "@/components/pixel/sprites";
import { useOverworld } from "@/game/useOverworld";
import { DOOR, HOUSE_DOOR, MAP_H, MAP_W, MARKET_DOOR, SIGN_POS, TOWN_ID, type TileChar } from "@/game/map";
import { addProp, paintTile, resetTile, useActiveId, useCharacter } from "@/game/mapStore";
import { addGold, useEarningBoost, useWallet } from "@/game/playerStore";
import { sessionsInMonth, sumEarnings } from "@/lib/earnings";
import { getGoal, getSessions } from "@/lib/store";
import { downloadSessionsCsv } from "@/game/exportCsv";
import { resetProgress } from "@/game/resetProgress";
import { LanguageSelect } from "@/components/game/LanguageSelect";
import { notifyBlocked, requestNotifyPermission, setReminder, useReminder, useReminderScheduler } from "@/game/reminder";
import { useT } from "@/i18n";
import { createWorkplace, makeTimeRule } from "@/game/workplace";
import { useSalaryEngine } from "@/hooks/useSalaryEngine";
import { useIsTouch } from "@/hooks/useIsTouch";
import { AudioControl } from "@/components/game/AudioControl";
import { useBgm } from "@/audio/useAudio";
import { playSE } from "@/audio/engine";
import { multiplierAt } from "@/lib/earnings";
import { deleteWorkplace, getWorkplaces, upsertWorkplace } from "@/lib/store";
import type { Workplace } from "@/lib/types";
import { levelInfo, rankForLevel } from "@/lib/rpg";
import { cn, formatDuration, formatYen, formatYenPrecise, uid } from "@/lib/utils";

type Scene = "title" | "roam" | "work" | "home" | "shop";

/** リセット後はタイトルを飛ばして本編へ。それ以外は初回タイトル */
function initialScene(): Scene {
  try {
    if (sessionStorage.getItem("earnflow.enter") === "1") {
      sessionStorage.removeItem("earnflow.enter");
      return "roam";
    }
  } catch {
    /* ignore */
  }
  return "title";
}

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

  const [scene, setScene] = useState<Scene>(initialScene);
  const working = scene === "work";

  const activeId = useActiveId();
  const isTown = activeId === TOWN_ID;
  const character = useCharacter();
  const wallet = useWallet();
  const boost = useEarningBoost();
  const t = useT();
  const reminder = useReminder();
  useReminderScheduler(t("notify.title"), t("notify.body"));

  // 編集モード（ダッシュボード）。公開時はこの一式を外すだけ
  const [editMode, setEditMode] = useState(false);
  const [brush, setBrush] = useState<Brush>({ kind: "tile", ch: "P" as TileChar });
  const [editCam, setEditCam] = useState({ x: MAP_W / 2, y: MAP_H / 2 });
  function handleTileClick(x: number, y: number) {
    if (brush.kind === "tile") paintTile(x, y, brush.ch);
    else if (brush.kind === "erase") resetTile(x, y);
    else if (brush.kind === "prop") addProp({ id: uid(), src: brush.src, x, y, w: 3 });
  }

  // 編集中のカメラ移動（D-pad / 矢印キーで視点を動かす）
  const panRef = useRef<Set<HeroDir>>(new Set());
  const panPress = (d: HeroDir) => panRef.current.add(d);
  const panRelease = (d: HeroDir) => panRef.current.delete(d);
  useEffect(() => {
    if (!editMode) return;
    const dirs = panRef.current;
    let raf = 0;
    const loop = () => {
      if (dirs.size > 0) {
        setEditCam((c) => {
          const sp = 0.25;
          let { x, y } = c;
          if (dirs.has("left")) x -= sp;
          if (dirs.has("right")) x += sp;
          if (dirs.has("up")) y -= sp;
          if (dirs.has("down")) y += sp;
          return { x: Math.max(0, Math.min(MAP_W, x)), y: Math.max(0, Math.min(MAP_H, y)) };
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      dirs.clear();
    };
  }, [editMode]);
  useEffect(() => {
    if (!editMode) return;
    const keyMap: Record<string, HeroDir> = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right",
    };
    const kd = (e: KeyboardEvent) => {
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        panRef.current.add(dir);
      }
    };
    const ku = (e: KeyboardEvent) => {
      const dir = keyMap[e.key];
      if (dir) panRef.current.delete(dir);
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [editMode]);

  // バイト先（無ければ既定を1件作って保存）
  const [workplaces, setWorkplaces] = useState<Workplace[]>(() => {
    const ws = getWorkplaces();
    if (ws.length > 0) return ws;
    const def = createWorkplace("マイバイト", 1100, [makeTimeRule("深夜割増", 22, 5, 1.25)]);
    upsertWorkplace(def);
    return [def];
  });
  const refresh = () => setWorkplaces(getWorkplaces());

  const overworld = useOverworld({ enabled: scene === "roam" && !editMode, resetKey: activeId });
  const { snap, press, release } = overworld;
  const isTouch = useIsTouch();

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
      ? (activeWp.hourlyRate / 3600) * multiplier * boost
      : 0;

  const level = useMemo(() => levelInfo(totalGold), [totalGold]);
  const rank = rankForLevel(level.level);

  // シーン連動BGM（町は朝昼=townDay / 夜=townNight で切替）
  const bgmKey = useMemo(() => {
    if (scene === "title") return "title" as const;
    if (scene === "work") return "work" as const;
    if (scene === "shop") return "shop" as const;
    if (scene === "home") return "home" as const;
    const hour = new Date(nowTs).getHours();
    const night = hour >= 18 || hour < 6;
    return night ? ("townNight" as const) : ("townDay" as const);
  }, [scene, nowTs]);
  useBgm(bgmKey);

  // 接近判定（バイト先 / 看板）
  const hx = Math.round(snap.px);
  const hy = Math.round(snap.py);
  const settled = !snap.moving;
  const man = (ax: number, ay: number) => Math.abs(hx - ax) + Math.abs(hy - ay);
  const nearShop = isTown && !working && !editMode && settled && man(DOOR.x, DOOR.y) <= 1;
  const nearMarket = isTown && !working && !editMode && settled && !nearShop && man(MARKET_DOOR.x, MARKET_DOOR.y) <= 1;
  const nearHouse =
    isTown && !working && !editMode && settled && !nearShop && !nearMarket && man(HOUSE_DOOR.x, HOUSE_DOOR.y) <= 1;
  const nearSign =
    isTown && !working && !editMode && settled && !nearShop && !nearMarket && !nearHouse && man(SIGN_POS.x, SIGN_POS.y) <= 1;

  // 今月のノルマ進捗（家の中で確認）
  const monthEarned = useMemo(() => {
    const now = new Date();
    return sumEarnings(sessionsInMonth(getSessions(), now.getFullYear(), now.getMonth()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const goal = useMemo(() => getGoal(), [scene]);

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
  const [levelUp, setLevelUp] = useState<{ level: number; rank: string; gold: number } | null>(null);
  const prevLevelRef = useRef(level.level);
  useEffect(() => {
    if (level.level > prevLevelRef.current && working) {
      const gained = level.level - prevLevelRef.current;
      const gold = gained * 100; // レベルアップ報酬ゴールド
      addGold(gold);
      playSE("levelup");
      setLevelUp({ level: level.level, rank: rankForLevel(level.level).name, gold });
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
      {scene === "title" ? (
        /* ============ タイトル ============ */
        <div className="bg-app-radial flex h-full flex-col items-center justify-center gap-6 px-8 text-center" style={{ background: "linear-gradient(180deg,#0a0c1c 0%,#141a48 70%,#27306a 100%)" }}>
          <div>
            <p className="font-pixel text-[11px] tracking-[0.35em] text-gold">RPG SALARY QUEST</p>
            <h1 className="font-pixel text-3xl font-black text-gold-gradient">{t("title.name")}</h1>
            <p className="font-pixel mt-1 text-xs text-white/60">〜 {t("title.sub")} 〜</p>
          </div>

          <div className="anim-hero-bob">
            <PixelSprite sprite={HERO_DOWN_A} scale={5} />
          </div>

          <DQWindow className="w-full max-w-xs">
            <DQCommand
              label={t("title.new")}
              active
              accent="gold"
              onClick={() => {
                if (window.confirm(t("title.confirmNew"))) resetProgress();
              }}
            />
            <DQCommand label={`${t("title.continue")}（Lv.${level.level}）`} active onClick={() => setScene("roam")} />
          </DQWindow>

          <LanguageSelect />
          <p className="font-pixel text-[10px] text-white/40">{t("hint.move")}</p>
        </div>
      ) : working ? (
        /* ============ 労働シーン ============ */
        <div className="no-scrollbar mx-auto flex h-full max-w-md flex-col gap-3 overflow-y-auto px-4 py-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-pixel text-lg font-bold text-gold-gradient">{t("work.header")}</h1>
            <span className="font-pixel text-[11px] text-white/60">{activeWp?.name}</span>
          </div>

          <Stage walking level={level.level} nowTs={nowTs} coins={coins} buffed={multiplier > 1} characterSrc={character} />

          <DQWindow title={t("work.income")}>
            <div className="text-center">
              <p className="font-pixel text-4xl font-bold leading-none text-gold-gradient">
                ¥{formatYenPrecise(sessionEarnings, 2)}
              </p>
              <p className="font-pixel mt-1 text-xs text-white/70">
                {t("work.saved", { n: formatYen(totalGold, false) })}
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <div className="flex items-center justify-between font-pixel text-sm">
                <span>{rank.emoji} {rank.name}</span>
                <span className="text-gold">Lv.{level.level}</span>
              </div>
              <ExpBar progress={level.progress} />
              <p className="font-pixel text-right text-[11px] text-white/60">
                {t("work.nextLevel", { n: formatYen(level.remaining) })}
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
            <DQCommand label={t("cmd.stopWork")} active accent="red" se="cancel" onClick={stopWork} />
          </DQWindow>
        </div>
      ) : editMode ? (
        /* ============ 編集モード（左プレビュー／右パネル） ============ */
        <div className="flex h-full">
          <div className="relative flex-1">
            <Overworld
              snap={snap}
              className="absolute inset-0"
              editMode
              onTileClick={handleTileClick}
              cameraCenter={editCam}
              showLandmarks={isTown}
              level={level.level}
            />
            <TouchControls onPress={panPress} onRelease={panRelease} />
            <div className="dq-window pointer-events-none absolute left-2 top-2 px-2 py-1 font-pixel text-[11px] text-white/80">
              十字キーで視点移動・タップで{brush.kind === "prop" ? "画像配置" : brush.kind === "erase" ? "消す" : "タイル"}
            </div>
          </div>
          <div className="dq-window no-scrollbar h-full w-[min(62%,360px)] shrink-0 overflow-y-auto rounded-none border-y-0 border-r-0">
            <MapEditor brush={brush} setBrush={setBrush} onClose={() => setEditMode(false)} />
          </div>
        </div>
      ) : scene === "home" ? (
        /* ============ わが家（室内） ============ */
        <div className="no-scrollbar mx-auto flex h-full max-w-md flex-col gap-3 overflow-y-auto px-4 py-4">
          {/* 室内シーン */}
          <div className="pixel-frame relative flex h-36 items-end justify-center overflow-hidden rounded-md">
            {/* 壁と床 */}
            <div className="absolute inset-0" style={{ background: "#6b4f3a" }} />
            <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: "repeating-linear-gradient(90deg,#caa869 0 16px,#bd9a57 16px 32px)" }} />
            {/* 窓 */}
            <div className="absolute left-4 top-4 h-10 w-12 rounded-sm bg-[#9ad0ff] ring-2 ring-[#3a2f24]" />
            <div className="absolute right-4 top-4 h-10 w-12 rounded-sm bg-[#9ad0ff] ring-2 ring-[#3a2f24]" />
            {/* キャラ */}
            <div className="anim-hero-bob relative z-10 mb-2">
              {!character ? (
                <PixelSprite sprite={HERO_DOWN_A} scale={4} />
              ) : getBuiltinCharacter(character) ? (
                <PixelSprite sprite={getBuiltinCharacter(character)!.frames[0]} scale={4} />
              ) : (
                <PixelImage src={character} style={{ height: 64, width: "auto" }} />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="font-pixel text-lg font-bold text-gold-gradient">{t("house.name")}</h1>
            <button
              type="button"
              onClick={() => {
                playSE("cancel");
                setScene("roam");
              }}
              className="font-pixel rounded bg-white/15 px-3 py-1 text-xs text-white"
            >
              {t("house.exit")}
            </button>
          </div>

          {/* ノルマ */}
          <DQWindow title={t("house.norma")}>
            {goal.monthlyTarget > 0 ? (
              <>
                <div className="flex items-center justify-between font-pixel text-sm">
                  <span>🎯 {t("house.goal")}</span>
                  <span className="tabular">{formatYen(monthEarned)} / {formatYen(goal.monthlyTarget)}</span>
                </div>
                <div className="mt-2"><ExpBar progress={Math.min(1, monthEarned / goal.monthlyTarget)} /></div>
                <p className="font-pixel mt-1 text-right text-[11px] text-white/60">
                  {monthEarned >= goal.monthlyTarget ? t("house.achieved") : t("house.remain", { n: formatYen(goal.monthlyTarget - monthEarned) })}
                </p>
              </>
            ) : (
              <p className="font-pixel text-sm text-white/70">{t("house.noGoal")}</p>
            )}
          </DQWindow>

          {/* ノルマ設定（逆算） */}
          <DQWindow title={t("house.setGoal")}>
            <GoalSettings />
          </DQWindow>

          {/* グラフ */}
          <DQWindow title={t("house.graph")}>
            <EarningsChart />
          </DQWindow>

          {/* カレンダー */}
          <DQWindow title={t("house.calendar")}>
            <CalendarBoard />
          </DQWindow>

          {/* リマインダー */}
          <DQWindow title={t("rem.title")}>
            <label className="flex cursor-pointer items-center justify-between font-pixel text-sm text-white">
              <span>{t("rem.enable")}</span>
              <button
                type="button"
                role="switch"
                aria-checked={reminder.enabled}
                onClick={async () => {
                  if (!reminder.enabled) {
                    const ok = await requestNotifyPermission();
                    if (!ok) {
                      alert(t("rem.denied"));
                      return;
                    }
                  }
                  setReminder({ enabled: !reminder.enabled });
                }}
                className={cn("relative h-6 w-11 rounded-full transition-colors", reminder.enabled ? "bg-gold" : "bg-white/20")}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", reminder.enabled ? "translate-x-[22px]" : "translate-x-0.5")} />
              </button>
            </label>
            <div className="mt-2 flex items-center justify-between font-pixel text-sm text-white">
              <span>{t("rem.time")}</span>
              <input
                type="time"
                value={reminder.time}
                onChange={(e) => setReminder({ time: e.target.value })}
                className="font-pixel rounded bg-white/10 px-2 py-1 text-white"
              />
            </div>
            <p className="font-pixel mt-1 text-[10px] text-white/40">{t("rem.note")}{notifyBlocked() ? ` / ${t("rem.denied")}` : ""}</p>
          </DQWindow>

          {/* データ書き出し */}
          <DQWindow title={t("house.data")}>
            <button
              type="button"
              onClick={() => {
                if (!downloadSessionsCsv()) alert(t("data.noRecord"));
              }}
              className="font-pixel w-full rounded bg-white/15 py-2 text-sm text-white hover:bg-white/25"
            >
              {t("data.csv")}
            </button>
            <div className="mt-3"><LanguageSelect /></div>
          </DQWindow>
        </div>
      ) : scene === "shop" ? (
        /* ============ どうぐ屋（店内） ============ */
        <div className="no-scrollbar mx-auto flex h-full max-w-md flex-col gap-3 overflow-y-auto px-4 py-4">
          {/* 店内シーン：店主とカウンター */}
          <div className="pixel-frame relative flex h-36 items-end justify-center overflow-hidden rounded-md">
            <div className="absolute inset-0" style={{ background: "#5a4636" }} />
            {/* 棚 */}
            <div className="absolute left-3 top-3 h-8 w-16 rounded-sm bg-[#7a5230] ring-2 ring-[#3a2f24]" />
            <div className="absolute right-3 top-3 h-8 w-16 rounded-sm bg-[#7a5230] ring-2 ring-[#3a2f24]" />
            {/* 店主 */}
            <div className="anim-hero-bob relative z-10 mb-7">
              <PixelSprite sprite={SHOPKEEPER} scale={4} />
            </div>
            {/* カウンター */}
            <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: "repeating-linear-gradient(90deg,#8a5a2b 0 14px,#754c22 14px 28px)", borderTop: "3px solid #3a2f24" }} />
          </div>

          {/* 店主のセリフ */}
          <DQWindow className="anim-dq-pop">
            <p className="font-pixel text-sm leading-relaxed text-white">{t("shop.keeper")}</p>
          </DQWindow>

          <div className="flex items-center justify-between">
            <h1 className="font-pixel text-lg font-bold text-gold-gradient">{t("shop.name")}</h1>
            <button
              type="button"
              onClick={() => {
                playSE("cancel");
                setScene("roam");
              }}
              className="font-pixel rounded bg-white/15 px-3 py-1 text-xs text-white"
            >
              {t("shop.exit")}
            </button>
          </div>

          <CostumePanel />
        </div>
      ) : (
        /* ============ 町（トップダウン） ============ */
        <>
          <Overworld snap={snap} className="absolute inset-0" showLandmarks={isTown} level={level.level} />

          {/* タッチ端末（iPhone/iPad/Android）用の画面上十字キー */}
          {isTouch && <TouchControls onPress={press} onRelease={release} />}

          {/* 上部HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
            <div className="dq-window pointer-events-auto px-3 py-1.5">
              <div className="flex items-center gap-3 font-pixel text-xs">
                <span className="text-gold">Lv.{level.level}</span>
                <span>💰 {wallet} G</span>
              </div>
              <div className="mt-1 w-28">
                <ExpBar progress={level.progress} thin />
              </div>
            </div>
            <div className="pointer-events-auto flex gap-1">
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="dq-window grid h-9 w-9 place-items-center text-sm"
                aria-label="編集モード"
                title="編集モード（公開時は外す）"
              >
                🛠
              </button>
            </div>
          </div>

          {/* バイト先に接近 → 選択肢（複数選択・追加・削除） */}
          {nearShop && (
            <div className="absolute left-1/2 top-16 w-full max-w-xs -translate-x-1/2 px-4">
              <WorkMenu
                workplaces={workplaces}
                onStart={startWork}
                onAdd={addWorkplace}
                onDelete={removeWorkplace}
              />
            </div>
          )}

          {/* どうぐ屋に接近 → 入店 */}
          {nearMarket && (
            <div className="absolute left-1/2 top-20 w-full max-w-xs -translate-x-1/2 px-4">
              <DQWindow title={t("shop.name")} className="anim-dq-pop">
                <p className="font-pixel mb-2 text-sm text-white">{t("shop.ask")}</p>
                <DQCommand label={t("shop.enter")} active accent="gold" onClick={() => setScene("shop")} />
              </DQWindow>
            </div>
          )}

          {/* わが家に接近 → 入る */}
          {nearHouse && (
            <div className="absolute left-1/2 top-20 w-full max-w-xs -translate-x-1/2 px-4">
              <DQWindow title={t("house.name")} className="anim-dq-pop">
                <p className="font-pixel mb-2 text-sm text-white">{t("house.enterAsk")}</p>
                <DQCommand label={t("house.enter")} active accent="gold" onClick={() => setScene("home")} />
              </DQWindow>
            </div>
          )}

          {/* 看板に接近 → 説明 */}
          {nearSign && (
            <div className="absolute left-1/2 top-20 w-full max-w-xs -translate-x-1/2 px-4">
              <DQWindow title={t("sign.title")} className="anim-dq-pop">
                <p className="font-pixel text-sm leading-relaxed text-white">{t("sign.text")}</p>
              </DQWindow>
            </div>
          )}

          {/* ヒント */}
          {!nearShop && !nearMarket && !nearHouse && !nearSign && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
              <p className="font-pixel rounded bg-black/55 px-3 py-1 text-[11px] text-white/80">
                {t(isTouch ? "hint.moveTouch" : "hint.move")}
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
              {t("levelup.head")}{" "}
              {t("levelup.toLevel", { n: levelUp.level })}
            </p>
            <p className="font-pixel mt-2 text-sm text-gold">{t("levelup.gotTitle", { rank: levelUp.rank })}</p>
            <p className="font-pixel mt-1 text-sm text-white">{t("levelup.gold", { n: levelUp.gold })}</p>
          </DQWindow>
        </div>
      )}

      {/* 画面上の音量コントロール（全シーン共通・右下） */}
      <AudioControl />
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
