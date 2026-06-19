import { useState } from "react";
import { PixelImage } from "@/components/pixel/PixelImage";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { getBuiltinCharacter } from "@/components/pixel/sprites";
import { DQWindow } from "@/components/pixel/DQWindow";
import { THEMES, themeIndexForLevel } from "@/game/themes";
import {
  assignResident,
  removeResident,
  townOfResident,
  townDevLevel,
  useGoldPerHour,
  isTownGoalMet,
  isTownGoalClaimed,
  claimTownGoal,
  townGoalReward,
  TOWN_GOAL_RESIDENTS,
  useCurrentTown,
  useResidents,
} from "@/game/townStore";
import { addGold, useOwned } from "@/game/playerStore";
import { playSE } from "@/audio/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

function basename(src: string): string {
  return src.split("/").pop() ?? src;
}
function charName(id: string): string {
  return getBuiltinCharacter(id)?.name ?? basename(id);
}
function Thumb({ id, scale = 2 }: { id: string; scale?: number }) {
  const builtin = getBuiltinCharacter(id);
  if (builtin) return <PixelSprite sprite={builtin.frames[0]} scale={scale} />;
  return <PixelImage src={id} style={{ width: 18 * scale, height: 18 * scale, objectFit: "contain" }} />;
}

interface WorldMapProps {
  level: number;
  onTravel: (townIndex: number) => void;
  onClose: () => void;
}

/**
 * ワールドマップ。町の行き来（移動）と、ガチャで当てたキャラの派遣（町おこし）を行う。
 */
export function WorldMap({ level, onTravel, onClose }: WorldMapProps) {
  const t = useT();
  const current = useCurrentTown();
  const residents = useResidents();
  const owned = useOwned();
  const maxUnlocked = themeIndexForLevel(level);
  const goldPerHr = useGoldPerHour();
  const [managing, setManaging] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 px-3 py-4">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className="mb-2 flex items-center justify-between pr-14">
          <div>
            <h2 className="font-pixel text-lg font-bold text-gold-gradient">{t("world.title")}</h2>
            {goldPerHr > 0 && (
              <p className="font-pixel text-[10px] text-gold">🏘 {t("town.income", { n: goldPerHr })}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              playSE("cancel");
              onClose();
            }}
            className="font-pixel rounded bg-white/15 px-3 py-1 text-xs text-white"
          >
            {t("world.close")}
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto">
          {managing === null ? (
            /* ===== 町一覧 ===== */
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((th, i) => {
                const locked = i > maxUnlocked;
                const here = i === current;
                const count = (residents[i] ?? []).length;
                return (
                  <DQWindow key={th.id} className={cn("!px-3 !py-2", locked && "opacity-60")}>
                    <div className="flex items-center gap-1 font-pixel text-sm font-bold text-white">
                      <span>{locked ? "🔒" : th.emoji}</span>
                      <span className="truncate">{locked ? "？？？" : th.name}</span>
                    </div>
                    {!locked && (
                      <>
                        <p className="font-pixel mt-1 text-[10px] text-white/60">
                          👥 {t("world.residents")} {count} ・ 🏠Lv{townDevLevel(i)}
                        </p>
                        {/* 町ごとの目標 */}
                        {isTownGoalClaimed(i) ? (
                          <p className="font-pixel mt-1 text-[10px] text-gold">🏆 {t("world.goalDone")}</p>
                        ) : isTownGoalMet(i) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const r = claimTownGoal(i);
                              if (r > 0) {
                                playSE("levelup");
                                addGold(r);
                              }
                            }}
                            className="font-pixel mt-1 w-full rounded bg-gold px-2 py-1 text-[10px] font-bold text-black"
                          >
                            🎁 {t("world.goalClaim", { n: townGoalReward(i) })}
                          </button>
                        ) : (
                          <p className="font-pixel mt-1 text-[10px] text-white/50">
                            🎯 {t("world.goal", { n: TOWN_GOAL_RESIDENTS })}（{count}/{TOWN_GOAL_RESIDENTS}）
                          </p>
                        )}
                        <div className="mt-2 flex gap-1">
                          {here ? (
                            <span className="font-pixel flex-1 rounded bg-gold/20 px-2 py-1 text-center text-[11px] font-bold text-gold">
                              {t("world.here")}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onTravel(i)}
                              className="font-pixel flex-1 rounded bg-gold px-2 py-1 text-[11px] font-bold text-black"
                            >
                              {t("world.go")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              playSE("confirm");
                              setManaging(i);
                            }}
                            className="font-pixel rounded bg-white/15 px-2 py-1 text-[11px] text-white hover:bg-white/25"
                          >
                            {t("world.develop")}
                          </button>
                        </div>
                      </>
                    )}
                    {locked && (
                      <p className="font-pixel mt-1 text-[10px] text-white/50">
                        Lv.{(i) * 8 + 1} {t("world.unlockAt")}
                      </p>
                    )}
                  </DQWindow>
                );
              })}
            </div>
          ) : (
            /* ===== 町おこし（派遣管理） ===== */
            <ManageTown
              townIndex={managing}
              residents={residents[managing] ?? []}
              owned={owned}
              onBack={() => setManaging(null)}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ManageTown({
  townIndex,
  residents,
  owned,
  onBack,
  t,
}: {
  townIndex: number;
  residents: string[];
  owned: string[];
  onBack: () => void;
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const th = THEMES[townIndex];
  const available = owned.filter((id) => !residents.includes(id));

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="font-pixel self-start rounded bg-white/15 px-3 py-1 text-xs text-white"
      >
        ◀ {t("world.back")}
      </button>

      <DQWindow title={`${th.emoji} ${th.name}`}>
        <p className="font-pixel mb-2 text-[11px] text-white/70">{t("world.developHint")}</p>

        <p className="font-pixel mb-1 text-xs text-gold">👥 {t("world.residents")}</p>
        {residents.length === 0 ? (
          <p className="font-pixel mb-2 text-[11px] text-white/50">{t("world.none")}</p>
        ) : (
          <div className="mb-3 grid grid-cols-3 gap-2">
            {residents.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  playSE("cancel");
                  removeResident(townIndex, id);
                }}
                className="flex flex-col items-center gap-1 rounded bg-gold/15 p-1.5 ring-1 ring-gold/40"
              >
                <div className="grid h-10 w-10 place-items-center">
                  <Thumb id={id} />
                </div>
                <span className="font-pixel w-full truncate text-center text-[9px] text-white">{charName(id)}</span>
                <span className="font-pixel text-[9px] text-red-300">✕ {t("world.dismiss")}</span>
              </button>
            ))}
          </div>
        )}
      </DQWindow>

      <DQWindow title={t("world.dispatch")}>
        {available.length === 0 ? (
          <p className="font-pixel text-[11px] text-white/50">{t("world.ownNone")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {available.map((id) => {
              const at = townOfResident(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    playSE("confirm");
                    assignResident(townIndex, id);
                  }}
                  className="flex flex-col items-center gap-1 rounded bg-white/10 p-1.5 hover:bg-white/20"
                >
                  <div className="grid h-10 w-10 place-items-center">
                    <Thumb id={id} />
                  </div>
                  <span className="font-pixel w-full truncate text-center text-[9px] text-white">{charName(id)}</span>
                  {at >= 0 ? (
                    <span className="font-pixel text-[9px] text-white/50">{THEMES[at].emoji}{t("world.movedFrom")}</span>
                  ) : (
                    <span className="font-pixel text-[9px] text-gold">＋{t("world.dispatch")}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DQWindow>
    </div>
  );
}
