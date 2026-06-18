/**
 * BGM / 効果音(SE) のファイルマニフェスト。
 * 実体は public/audio/*.mp3（MusMus 様の素材）。Vite が /audio/ で配信する。
 */

/** BGM トラック → 音源パスと音量倍率 */
export const BGM: Record<string, { src: string; gain?: number }> = {
  /** タイトルコール */
  title: { src: "/audio/bgm_title.mp3" },
  /** 街並み（朝・昼） */
  townDay: { src: "/audio/bgm_town_day.mp3" },
  /** 夜の街 */
  townNight: { src: "/audio/bgm_town_night.mp3" },
  /** バイト中（労働シーン） */
  work: { src: "/audio/bgm_work.mp3" },
  /** どうぐ屋（室内・我が家と共通） */
  shop: { src: "/audio/bgm_indoor.mp3" },
  /** わが家（室内・どうぐ屋と共通） */
  home: { src: "/audio/bgm_indoor.mp3" },
};

export type TrackName = keyof typeof BGM;

/** 効果音 → 音源パスと音量倍率 */
export const SE: Record<string, { src: string; gain?: number }> = {
  /** 決定 */
  confirm: { src: "/audio/se_button.mp3" },
  /** キャンセル（決定と同じ音） */
  cancel: { src: "/audio/se_button.mp3" },
  /** レベルアップ（成功音） */
  levelup: { src: "/audio/se_levelup.mp3", gain: 0.9 },
  /** ドアを開ける（我が家・道具屋に入る時） */
  door: { src: "/audio/se_door.mp3" },
};

export type SeName = keyof typeof SE;
