/**
 * オーディオエンジン（HTMLAudioElement ベース）。
 *
 * public/audio/*.mp3 を BGM / 効果音として再生する。
 * - 音量・ミュートは localStorage に永続化し、useSyncExternalStore でUIに反映。
 * - BGM は2要素クロスフェードでシーンに応じて滑らかに切り替える。ループ再生。
 * - ブラウザの自動再生制限に対応：最初のユーザー操作で再生をアンロックする。
 */

import { BGM, SE, type SeName, type TrackName } from "./tracks";

/* ───────────── 音量ストア（永続化＋リアクティブ） ───────────── */

const STORE_KEY = "earnflow.audio";

interface AudioPrefs {
  volume: number; // 0..1
  muted: boolean;
}

function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AudioPrefs>;
      const v = typeof p.volume === "number" ? Math.min(1, Math.max(0, p.volume)) : 0.6;
      // 音量UIを廃止したため、過去のミュート/音量0で無音にならないよう補正する
      return { volume: v > 0 ? v : 0.6, muted: false };
    }
  } catch {
    /* ignore */
  }
  return { volume: 0.6, muted: false };
}

let prefs = loadPrefs();
const listeners = new Set<() => void>();

function savePrefs() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getVolume(): number {
  return prefs.volume;
}

export function isMuted(): boolean {
  return prefs.muted;
}

/** 実効音量（ミュート時は0） */
function effectiveVolume(): number {
  return prefs.muted ? 0 : prefs.volume;
}

export function setVolume(v: number): void {
  prefs = { ...prefs, volume: Math.min(1, Math.max(0, v)), muted: v <= 0 ? prefs.muted : false };
  savePrefs();
  applyBgmVolume();
  emit();
}

export function setMuted(m: boolean): void {
  prefs = { ...prefs, muted: m };
  savePrefs();
  applyBgmVolume();
  emit();
}

export function toggleMuted(): void {
  setMuted(!prefs.muted);
}

/* ───────────── 共通ヘルパ ───────────── */

const canPlay = typeof window !== "undefined" && typeof Audio !== "undefined";

/* ───────────── 効果音（SE） ───────────── */

// 事前読み込みでキャッシュを温めておく（初回再生の遅延を防ぐ）
const sePreload: Record<string, HTMLAudioElement> = {};
function preloadSE() {
  if (!canPlay) return;
  for (const key of Object.keys(SE)) {
    const { src } = SE[key];
    if (!sePreload[src]) {
      const el = new Audio(src);
      el.preload = "auto";
      sePreload[src] = el;
    }
  }
}

export function playSE(name: SeName): void {
  if (!canPlay) return;
  const def = SE[name];
  if (!def) return;
  // 連打・重複再生に対応するため複製して鳴らす
  const base = sePreload[def.src] ?? new Audio(def.src);
  const el = base.cloneNode(true) as HTMLAudioElement;
  el.volume = Math.min(1, effectiveVolume() * (def.gain ?? 1));
  void el.play().catch(() => {
    /* 未アンロック等は無視 */
  });
}

/* ───────────── BGM（2要素クロスフェード） ───────────── */

const FADE_MS = 600;

let bgmEls: HTMLAudioElement[] = [];
let activeIdx = 0;
let curTrack: TrackName | null = null;
let curSrc: string | null = null;

function initBgm() {
  if (!canPlay || bgmEls.length) return;
  bgmEls = [new Audio(), new Audio()];
  for (const el of bgmEls) {
    el.loop = true;
    el.preload = "auto";
    el.volume = 0;
  }
}

/** 再生中のBGM要素に現在の音量を反映 */
function applyBgmVolume() {
  const el = bgmEls[activeIdx];
  if (el && !el.paused) el.volume = effectiveVolume();
}

function fade(el: HTMLAudioElement, to: number, done?: () => void) {
  const from = el.volume;
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min(1, (now - start) / FADE_MS);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * p));
    if (p < 1) {
      requestAnimationFrame(step);
    } else if (done) {
      done();
    }
  };
  requestAnimationFrame(step);
}

/**
 * BGM を指定トラックへ切り替える。null で停止。
 * 同じ音源（shop↔home など）なら鳴らし直さず継続する。
 */
export function playBgm(name: TrackName | null): void {
  if (!canPlay) return;
  initBgm();
  curTrack = name;

  if (name === null) {
    const el = bgmEls[activeIdx];
    if (el && !el.paused) fade(el, 0, () => el.pause());
    curSrc = null;
    return;
  }

  const src = BGM[name].src;
  // 同じ音源が既に流れているなら継続（室内BGMの使い回し等）
  if (src === curSrc && bgmEls[activeIdx] && !bgmEls[activeIdx].paused) return;
  curSrc = src;

  const next = 1 - activeIdx;
  const prevEl = bgmEls[activeIdx];
  const nextEl = bgmEls[next];

  const absSrc = new URL(src, window.location.href).href;
  if (nextEl.src !== absSrc) nextEl.src = src;
  nextEl.currentTime = 0;
  nextEl.volume = 0;

  const target = effectiveVolume();
  void nextEl
    .play()
    .then(() => {
      fade(nextEl, target);
      if (prevEl && !prevEl.paused) fade(prevEl, 0, () => prevEl.pause());
      activeIdx = next;
    })
    .catch(() => {
      // 自動再生がブロックされた：アンロック時に再試行するため待機トラックを保持
      pendingTrack = name;
    });
}

/* ───────────── 自動再生アンロック ───────────── */

let gestureBound = false;
let pendingTrack: TrackName | null = null;

/**
 * 最初のユーザー操作で BGM 再生をアンロックする（iOS/Chrome の自動再生制限対策）。
 */
export function installAudioUnlock(): void {
  if (gestureBound || !canPlay) return;
  gestureBound = true;
  preloadSE();
  const unlock = () => {
    const want = pendingTrack ?? curTrack;
    pendingTrack = null;
    // 再生中でなければ（＝まだ鳴っていなければ）改めて鳴らす
    if (want && (!bgmEls[activeIdx] || bgmEls[activeIdx].paused)) {
      curSrc = null; // 強制再生
      playBgm(want);
    }
  };
  ["pointerdown", "touchstart", "keydown"].forEach((ev) =>
    window.addEventListener(ev, unlock, { passive: true }),
  );
}
