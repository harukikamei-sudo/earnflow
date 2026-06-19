import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, type StageCoin } from "@/components/pixel/Stage";
import { DQCommand, DQWindow } from "@/components/pixel/DQWindow";
import { Overworld } from "@/components/game/Overworld";
import { FlickControls } from "@/components/game/FlickControls";
import { WorkMenu } from "@/components/game/WorkMenu";
import { GachaPanel } from "@/components/game/GachaPanel";
import { CalendarBoard } from "@/components/game/CalendarBoard";
import { EarningsChart } from "@/components/game/EarningsChart";
import { GoalSettings } from "@/components/game/GoalSettings";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { PixelImage } from "@/components/pixel/PixelImage";
import { getBuiltinCharacter, HERO_DOWN_A, SHOPKEEPER } from "@/components/pixel/sprites";
import { useOverworld } from "@/game/useOverworld";
import { DOOR, HOUSE_DOOR, MARKET_DOOR, SIGN_POS, TOWN_ID } from "@/game/map";
import { useActiveId, useCharacter } from "@/game/mapStore";
import { addGold, useEarningBoost, useWallet } from "@/game/playerStore";
import { sessionsInMonth, sumEarnings } from "@/lib/earnings";
import { addSession, getGoal, getSessions } from "@/lib/store";
import { downloadSessionsCsv } from "@/game/exportCsv";
import { resetProgress } from "@/game/resetProgress";
import { LanguageSelect } from "@/components/game/LanguageSelect";
import { notifyBlocked, requestNotifyPermission, setReminder, useReminder, useReminderScheduler } from "@/game/reminder";
import { useLocale, useT } from "@/i18n";
import { dailyLine } from "@/game/dailyLines";
import { createWorkplace, makeTimeRule } from "@/game/workplace";
import { useSalaryEngine } from "@/hooks/useSalaryEngine";
import { useIsTouch } from "@/hooks/useIsTouch";
import { usePageVisible } from "@/hooks/usePageVisible";
import { VolumeButton } from "@/components/game/VolumeButton";
import { useBgm } from "@/audio/useAudio";
import { playSE } from "@/audio/engine";
import { multiplierAt } from "@/lib/earnings";
import { isHoliday } from "@/lib/holiday";
import { deleteWorkplace, getWorkplaces, upsertWorkplace } from "@/lib/store";
import type { Workplace } from "@/lib/types";
import { levelInfo, rankForLevel } from "@/lib/rpg";
import { THEMES, townExit } from "@/game/themes";
import { useCurrentTown, setCurrentTown, useResidents, townDevLevel, collectIdleGold } from "@/game/townStore";
import { WorldMap } from "@/components/game/WorldMap";
import { cn, formatDuration, formatYen, formatYenPrecise, toDateKey, uid } from "@/lib/utils";

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
  const locale = useLocale();
  const reminder = useReminder();
  useReminderScheduler(t("notify.title"), t("notify.body"));

  // バイト先（無ければ既定を1件作って保存）
  const [workplaces, setWorkplaces] = useState<Workplace[]>(() => {
    const ws = getWorkplaces();
    if (ws.length > 0) return ws;
    const def = createWorkplace("マイバイト", 1100, [makeTimeRule("深夜割増", 22, 5, 1.25)]);
    upsertWorkplace(def);
    return [def];
  });
  const refresh = () => setWorkplaces(getWorkplaces());

  const overworld = useOverworld({ enabled: scene === "roam", resetKey: activeId });
  const { snap, press, release } = overworld;
  const isTouch = useIsTouch();

  // 時刻（時間帯・バフ用）。バックグラウンドでは更新を止めて電池を節約
  const [nowTs, setNowTs] = useState(() => Date.now());
  const pageVisible = usePageVisible();
  useEffect(() => {
    if (!pageVisible) return;
    setNowTs(Date.now());
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pageVisible]);

  const activeWp = working ? engine.runningWorkplace : null;
  const multiplier = activeWp ? multiplierAt(new Date(nowTs), activeWp.timeRules) : 1;
  const onHoliday = isHoliday(new Date(nowTs));
  const holidayBonus = onHoliday ? (activeWp?.holidayBonus ?? 0) : 0;
  const perSecond =
    activeWp && activeWp.payType === "hourly"
      ? ((activeWp.hourlyRate + holidayBonus) / 3600) * multiplier * boost
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

  // 現在滞在中の町（テーマ）。ワールドマップで移動すると切り替わる
  const currentTown = useCurrentTown();
  const townResidents = useResidents();
  const theme = THEMES[currentTown];
  const [showWorld, setShowWorld] = useState(false);
  const [traveling, setTraveling] = useState(false);
  const [themeBanner, setThemeBanner] = useState<{ name: string; emoji: string } | null>(null);
  const prevThemeRef = useRef(theme.id);
  useEffect(() => {
    if (theme.id === prevThemeRef.current) return;
    prevThemeRef.current = theme.id;
    setThemeBanner({ name: theme.name, emoji: theme.emoji });
    const id = window.setTimeout(() => setThemeBanner(null), 2800);
    return () => window.clearTimeout(id);
  }, [theme.id, theme.name, theme.emoji]);

  // 町の住民が稼いだ「仕送り」を起動時に回収（idle収入）
  const [idleGold, setIdleGold] = useState(0);
  useEffect(() => {
    const g = collectIdleGold();
    if (g > 0) {
      addGold(g);
      setIdleGold(g);
      const id = window.setTimeout(() => setIdleGold(0), 3500);
      return () => window.clearTimeout(id);
    }
  }, []);

  // ワールドマップで別の町へ移動（暗転フェード → 切替）
  function travelTo(townIndex: number) {
    playSE("door");
    setShowWorld(false);
    setTraveling(true);
    window.setTimeout(() => {
      setCurrentTown(townIndex);
      window.setTimeout(() => setTraveling(false), 350);
    }, 350);
  }

  // 主人公の「今日のひとこと」（1日1回・町に入った時に表示）
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    if (scene !== "roam") return;
    try {
      const today = toDateKey(new Date());
      if (localStorage.getItem("earnflow.lastGreetDate") !== today) {
        localStorage.setItem("earnflow.lastGreetDate", today);
        setGreeting(dailyLine(locale));
      }
    } catch {
      /* ignore */
    }
  }, [scene, locale]);

  // 接近判定（バイト先 / 看板）
  const hx = Math.round(snap.px);
  const hy = Math.round(snap.py);
  const settled = !snap.moving;
  const man = (ax: number, ay: number) => Math.abs(hx - ax) + Math.abs(hy - ay);
  const nearShop = isTown && !working && settled && man(DOOR.x, DOOR.y) <= 1;
  const nearMarket = isTown && !working && settled && !nearShop && man(MARKET_DOOR.x, MARKET_DOOR.y) <= 1;
  const nearHouse =
    isTown && !working && settled && !nearShop && !nearMarket && man(HOUSE_DOOR.x, HOUSE_DOOR.y) <= 1;
  const nearSign =
    isTown && !working && settled && !nearShop && !nearMarket && !nearHouse && man(SIGN_POS.x, SIGN_POS.y) <= 1;
  // 抜け道（となり街へ抜ける門）に接近
  const exitPos = townExit(currentTown);
  const nearExit = isTown && !working && settled && man(exitPos.x, exitPos.y) <= 1;

  // 抜け道に触れたらワールドマップを開く（退出直後の再オープンは離れるまで抑止）
  const exitGuard = useRef(false);
  useEffect(() => {
    if (scene !== "roam") return;
    if (!nearExit) {
      exitGuard.current = false;
      return;
    }
    if (exitGuard.current || showWorld) return;
    exitGuard.current = true;
    playSE("door");
    setShowWorld(true);
  }, [scene, nearExit, showWorld]);

  // 我が家・道具屋は触れたら自動で入る。退出直後の再入場を防ぐため、
  // 一度ドアから離れる（near がすべて false になる）まで再入場しないようガードする。
  const reenterGuard = useRef(false);
  useEffect(() => {
    if (scene !== "roam") return;
    if (!nearMarket && !nearHouse) {
      reenterGuard.current = false; // ドアから離れたら再武装
      return;
    }
    if (reenterGuard.current) return; // 退出直後は無視
    if (nearMarket) {
      playSE("door");
      setScene("shop");
    } else if (nearHouse) {
      playSE("door");
      setScene("home");
    }
  }, [scene, nearMarket, nearHouse]);

  // 手入力で収入を追加したら更新するためのバージョン
  const [dataVersion, setDataVersion] = useState(0);

  // わが家のページ切替（0:ノルマ / 1:カレンダー / 2:その他）。スワイプ＆タブ両対応
  const [homePage, setHomePage] = useState(0);
  const homePagesRef = useRef<HTMLDivElement>(null);
  function goHomePage(i: number) {
    setHomePage(i);
    const el = homePagesRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }
  function onHomeScroll() {
    const el = homePagesRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setHomePage((p) => (p === i ? p : i));
  }

  // 手入力で収入を追加（アプリ外で稼いだぶんの記録など）
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(() => toDateKey(new Date()));
  function addManualEarning() {
    const amt = Math.round(Number(manualAmount));
    if (!Number.isFinite(amt) || amt <= 0) return;
    const d = manualDate ? new Date(`${manualDate}T12:00:00`) : new Date();
    const ts = d.getTime();
    addSession({
      id: uid(),
      workplaceId: "manual",
      startTime: ts,
      endTime: ts,
      durationSec: 0,
      earnings: amt,
      dateKey: toDateKey(d),
    });
    playSE("confirm");
    setManualAmount("");
    setDataVersion((v) => v + 1);
    engine.refreshLifetime();
  }

  // 残業代を自己申告（残業時間 × 時給 × 割増率）
  const [otDate, setOtDate] = useState(() => toDateKey(new Date()));
  const [otHours, setOtHours] = useState("");
  const [otWage, setOtWage] = useState(() => String(getWorkplaces()[0]?.hourlyRate ?? 1100));
  const [otRate, setOtRate] = useState("1.25");
  const otAmount = Math.max(
    0,
    Math.round((Number(otHours) || 0) * (Number(otWage) || 0) * (Number(otRate) || 0)),
  );
  function addOvertime() {
    if (otAmount <= 0) return;
    const d = otDate ? new Date(`${otDate}T12:00:00`) : new Date();
    const ts = d.getTime();
    addSession({
      id: uid(),
      workplaceId: "overtime",
      startTime: ts,
      endTime: ts,
      durationSec: Math.round((Number(otHours) || 0) * 3600),
      earnings: otAmount,
      dateKey: toDateKey(d),
    });
    playSE("confirm");
    setOtHours("");
    setDataVersion((v) => v + 1);
    engine.refreshLifetime();
  }

  // 今月のノルマ進捗（家の中で確認）
  const monthEarned = useMemo(() => {
    const now = new Date();
    return sumEarnings(sessionsInMonth(getSessions(), now.getFullYear(), now.getMonth()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, dataVersion]);
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
          <div className="flex items-baseline justify-between pr-14">
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
              {holidayBonus > 0 && (
                <span className="rounded bg-gold/20 px-1.5 py-0.5 font-bold text-gold">🎌 +¥{holidayBonus}</span>
              )}
            </div>
          </DQWindow>

          <DQWindow title="コマンド">
            <DQCommand label={t("cmd.stopWork")} active accent="red" se="cancel" onClick={stopWork} />
          </DQWindow>
        </div>
      ) : scene === "home" ? (
        /* ============ わが家（室内・3ページ） ============ */
        <div className="mx-auto flex h-full max-w-md flex-col gap-3 px-4 py-4">
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

          <div className="flex items-center justify-between pr-14">
            <h1 className="font-pixel text-lg font-bold text-gold-gradient">{t("house.name")}</h1>
            <button
              type="button"
              onClick={() => {
                playSE("cancel");
                reenterGuard.current = true;
                setScene("roam");
              }}
              className="font-pixel rounded bg-white/15 px-3 py-1 text-xs text-white"
            >
              {t("house.exit")}
            </button>
          </div>

          {/* ページ切替タブ */}
          <div className="flex shrink-0 gap-1">
            {[t("home.tabGoal"), t("home.tabCalendar"), t("home.tabOther")].map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => goHomePage(i)}
                className={cn(
                  "font-pixel flex-1 rounded px-2 py-1.5 text-xs transition-colors",
                  homePage === i ? "bg-gold text-black" : "bg-white/10 text-white hover:bg-white/20",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ページ本体（横スワイプ／スナップ＆タブ） */}
          <div
            ref={homePagesRef}
            onScroll={onHomeScroll}
            className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
          >
            {/* ▼ページ1：ノルマ */}
            <section className="no-scrollbar flex w-full shrink-0 snap-start flex-col gap-3 overflow-y-auto px-0.5 pb-2">
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

          {/* 収入を手入力 */}
          <DQWindow title={t("manual.title")}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-pixel text-sm text-white">
                <span>{t("manual.date")}</span>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="font-pixel rounded bg-white/10 px-2 py-1 text-white"
                />
              </div>
              <div className="flex items-center gap-2 font-pixel text-sm text-white">
                <span>{t("manual.amount")}</span>
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/50">¥</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    placeholder="0"
                    className="tabular h-10 w-full rounded bg-white/10 pl-7 pr-2 text-right font-bold text-white"
                  />
                </div>
              </div>
              <DQCommand label={t("manual.add")} active accent="gold" onClick={addManualEarning} />
              <p className="font-pixel text-[10px] text-white/40">{t("manual.hint")}</p>
            </div>
          </DQWindow>

          {/* 残業代を自己申告 */}
          <DQWindow title={t("ot.title")}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between font-pixel text-sm text-white">
                <span>{t("manual.date")}</span>
                <input
                  type="date"
                  value={otDate}
                  onChange={(e) => setOtDate(e.target.value)}
                  className="font-pixel rounded bg-white/10 px-2 py-1 text-white"
                />
              </div>
              <div className="flex items-center justify-between gap-2 font-pixel text-sm text-white">
                <span className="whitespace-nowrap">{t("ot.hours")}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    value={otHours}
                    onChange={(e) => setOtHours(e.target.value)}
                    placeholder="0"
                    className="tabular h-9 w-20 rounded bg-white/10 px-2 text-right font-bold text-white"
                  />
                  <span>{t("ot.unitHours")}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 font-pixel text-sm text-white">
                <span className="whitespace-nowrap">{t("ot.wage")}</span>
                <div className="flex items-center gap-1">
                  <span className="text-white/50">¥</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={otWage}
                    onChange={(e) => setOtWage(e.target.value)}
                    className="tabular h-9 w-20 rounded bg-white/10 px-2 text-right font-bold text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 font-pixel text-sm text-white">
                <span className="whitespace-nowrap">{t("ot.rate")}</span>
                <div className="flex items-center gap-1">
                  <span className="text-white/50">×</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step={0.05}
                    value={otRate}
                    onChange={(e) => setOtRate(e.target.value)}
                    className="tabular h-9 w-20 rounded bg-white/10 px-2 text-right font-bold text-white"
                  />
                </div>
              </div>
              <p className="font-pixel text-right text-sm text-gold">≒ {formatYen(otAmount)}</p>
              <DQCommand label={t("ot.add")} active accent="gold" onClick={addOvertime} />
              <p className="font-pixel text-[10px] text-white/40">{t("ot.hint")}</p>
            </div>
          </DQWindow>

          {/* ノルマ設定（逆算） */}
          <DQWindow title={t("house.setGoal")}>
            <GoalSettings />
          </DQWindow>
            </section>

            {/* ▼ページ2：カレンダー */}
            <section className="no-scrollbar flex w-full shrink-0 snap-start flex-col gap-3 overflow-y-auto px-0.5 pb-2">
          {/* カレンダー */}
          <DQWindow title={t("house.calendar")}>
            <CalendarBoard key={dataVersion} />
          </DQWindow>
            </section>

            {/* ▼ページ3：その他 */}
            <section className="no-scrollbar flex w-full shrink-0 snap-start flex-col gap-3 overflow-y-auto px-0.5 pb-2">
          {/* グラフ */}
          <DQWindow title={t("house.graph")}>
            <EarningsChart key={dataVersion} />
          </DQWindow>

          {/* リマインダー */}
          <DQWindow title={t("rem.title")}>
            <div className="flex items-center justify-between gap-2 font-pixel text-sm text-white">
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
                className={cn(
                  "font-pixel shrink-0 rounded px-4 py-1.5 text-sm font-bold transition-colors",
                  reminder.enabled ? "bg-gold text-black" : "bg-white/15 text-white/80",
                )}
              >
                {reminder.enabled ? "ON" : "OFF"}
              </button>
            </div>
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
            </section>
          </div>
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

          <div className="flex items-center justify-between pr-14">
            <h1 className="font-pixel text-lg font-bold text-gold-gradient">{t("shop.name")}</h1>
            <button
              type="button"
              onClick={() => {
                playSE("cancel");
                reenterGuard.current = true;
                setScene("roam");
              }}
              className="font-pixel rounded bg-white/15 px-3 py-1 text-xs text-white"
            >
              {t("shop.exit")}
            </button>
          </div>

          <GachaPanel />
        </div>
      ) : (
        /* ============ 町（トップダウン） ============ */
        <>
          <Overworld snap={snap} className="absolute inset-0" showLandmarks={isTown} level={level.level} themeIndex={currentTown} residents={townResidents[currentTown] ?? []} devLevel={townDevLevel(currentTown)} />

          {/* フリック / スワイプ / ドラッグで移動（十字キーの代わり） */}
          <FlickControls onPress={press} onRelease={release} />

          {/* 上部HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
            <div className="dq-window pointer-events-auto px-3 py-1.5">
              <div className="flex items-center gap-3 font-pixel text-xs">
                <span className="text-gold">Lv.{level.level}</span>
                <span>💰 {wallet} G</span>
                <span className="text-white/80">{theme.emoji} {theme.name}</span>
              </div>
              <div className="mt-1 w-28">
                <ExpBar progress={level.progress} thin />
              </div>
            </div>
            {/* 町を出る → ワールドマップ */}
            <button
              type="button"
              onClick={() => {
                playSE("confirm");
                setShowWorld(true);
              }}
              className="dq-window pointer-events-auto mr-14 flex items-center gap-1 px-3 py-1.5 font-pixel text-xs text-white"
            >
              🗺 {t("world.exit")}
            </button>
          </div>

          {/* バイト先に接近 → 選択肢（複数選択・追加・削除） */}
          {nearShop && (
            <div className="absolute left-1/2 top-16 w-full max-w-xs -translate-x-1/2 px-4">
              <WorkMenu
                workplaces={workplaces}
                onStart={startWork}
                onAdd={addWorkplace}
                onUpdate={addWorkplace}
                onDelete={removeWorkplace}
              />
            </div>
          )}

          {/* どうぐ屋・わが家は接近で自動入場（確認なし） */}

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

      {/* ステージ（国）が変わった時のバナー */}
      {themeBanner && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-50 grid place-items-center px-6">
          <DQWindow className="anim-dq-pop text-center">
            <p className="font-pixel text-3xl">{themeBanner.emoji}</p>
            <p className="font-pixel mt-1 text-sm leading-relaxed text-gold">
              {t("stage.arrived", { name: themeBanner.name })}
            </p>
          </DQWindow>
        </div>
      )}

      {/* 主人公の「今日のひとこと」（毎日1回） */}
      {greeting && (
        <div
          onClick={() => {
            playSE("confirm");
            setGreeting(null);
          }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-8"
        >
          <DQWindow title={t("daily.title")} className="anim-dq-pop w-full max-w-sm">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <PixelSprite
                  sprite={
                    character && getBuiltinCharacter(character)
                      ? getBuiltinCharacter(character)!.frames[0]
                      : HERO_DOWN_A
                  }
                  scale={3}
                />
              </div>
              <p className="font-pixel flex-1 text-sm leading-relaxed text-white">{greeting}</p>
            </div>
            <p className="font-pixel mt-2 text-right text-[11px] text-white/50">{t("daily.close")}</p>
          </DQWindow>
        </div>
      )}

      {/* 町からの仕送り（idle収入）トースト */}
      {idleGold > 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-50 grid place-items-center px-6">
          <div className="dq-window anim-dq-pop font-pixel px-4 py-2 text-sm text-gold">
            🏘 {t("town.idle", { n: idleGold })}
          </div>
        </div>
      )}

      {/* ワールドマップ（町移動・町おこし） */}
      {showWorld && (
        <WorldMap level={level.level} onTravel={travelTo} onClose={() => setShowWorld(false)} />
      )}

      {/* 移動中の暗転フェード */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[60] bg-black transition-opacity duration-300",
          traveling ? "opacity-100" : "opacity-0",
        )}
      />

      {/* 音量ボタン（右上・全シーン共通） */}
      <VolumeButton />
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
