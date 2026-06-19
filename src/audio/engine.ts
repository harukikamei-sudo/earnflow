/**
 * オーディオエンジン（Web Audio API 経由）。
 *
 * public/audio/*.mp3 を BGM / 効果音として再生する。
 * - 音量・ミュートは localStorage に永続化し、useSyncExternalStore でUIに反映。
 * - 音量は必ず Web Audio の GainNode で制御する。
 *   （iOS Safari は HTMLMediaElement.volume を無視するため、要素の volume では音量調整できない。
 *     GainNode 経由なら iOS でも音量・ミュートが効く。）
 * - BGM は <audio> を MediaElementSource 経由で2チャンネルにつなぎ、ゲインでクロスフェード＆ループ。
 * - 効果音は mp3 をデコードして AudioBuffer で再生（重ね再生OK）。
 * - 自動再生制限に対応：最初のユーザー操作で AudioContext を resume し、待機BGMを鳴らす。
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
      return { volume: v > 0 ? v : 0.6, muted: !!p.muted };
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
  applyMasterVolume();
  emit();
}

export function setMuted(m: boolean): void {
  prefs = { ...prefs, muted: m };
  savePrefs();
  applyMasterVolume();
  emit();
}

export function toggleMuted(): void {
  setMuted(!prefs.muted);
}

/* ───────────── AudioContext / マスター ───────────── */

const canPlay = typeof window !== "undefined" && typeof Audio !== "undefined";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function ensureCtx(): AudioContext | null {
  if (!canPlay) return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = effectiveVolume();
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

/** マスター音量（＝ユーザー音量・ミュート）を反映 */
function applyMasterVolume() {
  if (ctx && masterGain) {
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(effectiveVolume(), now, 0.02);
  }
}

/* ───────────── 効果音（SE）— デコードして再生 ───────────── */

const seBuffers: Record<string, AudioBuffer> = {};
const seLoading: Record<string, Promise<AudioBuffer | null>> = {};

function loadSE(src: string): Promise<AudioBuffer | null> {
  const c = ensureCtx();
  if (!c) return Promise.resolve(null);
  if (seBuffers[src]) return Promise.resolve(seBuffers[src]);
  if (!seLoading[src]) {
    seLoading[src] = fetch(src)
      .then((r) => r.arrayBuffer())
      .then((b) => c.decodeAudioData(b))
      .then((buf) => {
        seBuffers[src] = buf;
        return buf;
      })
      .catch(() => null);
  }
  return seLoading[src];
}

function preloadSE() {
  for (const key of Object.keys(SE)) void loadSE(SE[key].src);
}

export function playSE(name: SeName): void {
  const def = SE[name];
  if (!def) return;
  const c = ensureCtx();
  if (!c || !masterGain) return;
  if (c.state !== "running") void c.resume();
  const fire = (buf: AudioBuffer) => {
    const node = c.createBufferSource();
    node.buffer = buf;
    const g = c.createGain();
    g.gain.value = def.gain ?? 1;
    node.connect(g).connect(masterGain!);
    node.start();
  };
  if (seBuffers[def.src]) fire(seBuffers[def.src]);
  else void loadSE(def.src).then((buf) => buf && fire(buf));
}

/* ───────────── BGM（2チャンネル・ゲインでクロスフェード） ───────────── */

const FADE_MS = 600;

interface BgmChannel {
  el: HTMLAudioElement;
  gain: GainNode;
}

let bgm: BgmChannel[] = [];
let activeIdx = 0;
let curTrack: TrackName | null = null;
let curSrc: string | null = null;
let firstPlay = true; // 初回はフェードせず瞬時に鳴らす

function initBgm() {
  const c = ensureCtx();
  if (!c || !masterGain || bgm.length) return;
  bgm = [0, 1].map(() => {
    const el = new Audio();
    el.loop = true;
    el.preload = "auto";
    el.volume = 1; // 音量は GainNode 側で制御（iOS対策）
    const srcNode = c.createMediaElementSource(el);
    const gain = c.createGain();
    gain.gain.value = 0;
    srcNode.connect(gain).connect(masterGain!);
    return { el, gain };
  });
}

function fadeGain(g: GainNode, to: number, done?: () => void) {
  if (!ctx) return;
  const now = ctx.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(g.gain.value, now);
  g.gain.linearRampToValueAtTime(to, now + FADE_MS / 1000);
  if (done) window.setTimeout(done, FADE_MS + 40);
}

/**
 * BGM を指定トラックへ切り替える。null で停止。
 * 同じ音源（shop↔home など）なら鳴らし直さず継続する。
 */
export function playBgm(name: TrackName | null): void {
  const c = ensureCtx();
  if (!c) return;
  initBgm();
  curTrack = name;

  if (name === null) {
    const ch = bgm[activeIdx];
    if (ch && !ch.el.paused) fadeGain(ch.gain, 0, () => ch.el.pause());
    curSrc = null;
    return;
  }

  const src = BGM[name].src;
  // 同じ音源が既に流れているなら継続（室内BGMの使い回し等）
  if (src === curSrc && bgm[activeIdx] && !bgm[activeIdx].el.paused) return;
  curSrc = src;

  const next = 1 - activeIdx;
  const prev = bgm[activeIdx];
  const nx = bgm[next];

  const absSrc = new URL(src, window.location.href).href;
  if (nx.el.src !== absSrc) nx.el.src = src;
  nx.el.currentTime = 0;
  nx.gain.gain.value = 0;

  void nx.el
    .play()
    .then(() => {
      // 初回（オープニング）はフェードせず即フル音量で鳴らす＝瞬時に流れる
      if (firstPlay) {
        firstPlay = false;
        nx.gain.gain.cancelScheduledValues(ctx ? ctx.currentTime : 0);
        nx.gain.gain.value = 1;
      } else {
        fadeGain(nx.gain, 1); // チャンネルは全開。音量はマスターで制御
      }
      if (prev && !prev.el.paused) fadeGain(prev.gain, 0, () => prev.el.pause());
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
 * 最初のユーザー操作で AudioContext を resume し、待機中のBGMを鳴らす。
 * （iOS/Chrome の自動再生制限対策。ジェスチャー中に同期的に呼ぶ）
 */
export function installAudioUnlock(): void {
  if (gestureBound || !canPlay) return;
  gestureBound = true;
  const unlock = () => {
    const c = ensureCtx();
    if (!c) return;
    if (c.state !== "running") void c.resume();
    preloadSE();
    const want = pendingTrack ?? curTrack;
    pendingTrack = null;
    if (want && (!bgm[activeIdx] || bgm[activeIdx].el.paused)) {
      curSrc = null; // 強制再生
      playBgm(want);
    }
  };
  ["pointerdown", "touchstart", "keydown"].forEach((ev) =>
    window.addEventListener(ev, unlock, { passive: true }),
  );
}
