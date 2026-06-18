import { useEffect, useSyncExternalStore } from "react";
import {
  getVolume,
  installAudioUnlock,
  isMuted,
  playBgm,
  subscribe,
} from "./engine";
import type { TrackName } from "./tracks";

/** 音量・ミュート状態をUIに購読させるフック。 */
export function useAudioPrefs(): { volume: number; muted: boolean } {
  const volume = useSyncExternalStore(subscribe, getVolume, getVolume);
  const muted = useSyncExternalStore(subscribe, isMuted, isMuted);
  return { volume, muted };
}

/**
 * 現在のシーンに応じた BGM を再生する。track が変わったときだけ切り替わる。
 * null を渡すと停止。マウント時にオーディオのアンロック（初回操作で resume）を仕込む。
 */
export function useBgm(track: TrackName | null): void {
  useEffect(() => {
    installAudioUnlock();
  }, []);
  useEffect(() => {
    playBgm(track);
  }, [track]);
  // アンマウント時（ホーム画面離脱時）に停止
  useEffect(() => {
    return () => playBgm(null);
  }, []);
}
