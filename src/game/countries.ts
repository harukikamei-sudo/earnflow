/**
 * 世界の国リスト（町＝国）。各国に地域カテゴリ(cat)を持たせ、
 * themes.ts で配色とランドマークを自動生成する。lm で名所を個別指定可。
 */

export type CountryCat =
  | "asia"
  | "desert"
  | "tropical"
  | "snow"
  | "europe"
  | "med"
  | "africa"
  | "latin"
  | "america"
  | "oceania"
  | "mideast";

export interface Country {
  name: string;
  emoji: string;
  cat: CountryCat;
  /** 個別ランドマーク（未指定はカテゴリ既定） */
  lm?: string;
}

export const COUNTRIES: Country[] = [
  // 東アジア
  { name: "日本", emoji: "🇯🇵", cat: "asia", lm: "pagoda" },
  { name: "韓国", emoji: "🇰🇷", cat: "asia" },
  { name: "北朝鮮", emoji: "🇰🇵", cat: "asia" },
  { name: "中国", emoji: "🇨🇳", cat: "asia", lm: "pagoda" },
  { name: "台湾", emoji: "🇹🇼", cat: "asia" },
  { name: "モンゴル", emoji: "🇲🇳", cat: "snow" },
  // 東南アジア
  { name: "ベトナム", emoji: "🇻🇳", cat: "tropical" },
  { name: "タイ", emoji: "🇹🇭", cat: "tropical", lm: "pagoda" },
  { name: "カンボジア", emoji: "🇰🇭", cat: "tropical" },
  { name: "ラオス", emoji: "🇱🇦", cat: "tropical" },
  { name: "ミャンマー", emoji: "🇲🇲", cat: "tropical" },
  { name: "マレーシア", emoji: "🇲🇾", cat: "tropical" },
  { name: "シンガポール", emoji: "🇸🇬", cat: "tropical", lm: "skyscraper" },
  { name: "インドネシア", emoji: "🇮🇩", cat: "tropical" },
  { name: "フィリピン", emoji: "🇵🇭", cat: "tropical" },
  { name: "ブルネイ", emoji: "🇧🇳", cat: "tropical", lm: "dome" },
  { name: "東ティモール", emoji: "🇹🇱", cat: "tropical" },
  // 南アジア
  { name: "インド", emoji: "🇮🇳", cat: "desert", lm: "taj" },
  { name: "パキスタン", emoji: "🇵🇰", cat: "desert" },
  { name: "バングラデシュ", emoji: "🇧🇩", cat: "tropical" },
  { name: "スリランカ", emoji: "🇱🇰", cat: "tropical" },
  { name: "ネパール", emoji: "🇳🇵", cat: "snow" },
  { name: "ブータン", emoji: "🇧🇹", cat: "snow" },
  { name: "モルディブ", emoji: "🇲🇻", cat: "oceania" },
  { name: "アフガニスタン", emoji: "🇦🇫", cat: "desert" },
  // 中央アジア
  { name: "カザフスタン", emoji: "🇰🇿", cat: "snow" },
  { name: "ウズベキスタン", emoji: "🇺🇿", cat: "desert", lm: "dome" },
  { name: "トルクメニスタン", emoji: "🇹🇲", cat: "desert" },
  { name: "キルギス", emoji: "🇰🇬", cat: "snow" },
  { name: "タジキスタン", emoji: "🇹🇯", cat: "snow" },
  // 中東
  { name: "トルコ", emoji: "🇹🇷", cat: "mideast", lm: "dome" },
  { name: "サウジアラビア", emoji: "🇸🇦", cat: "desert", lm: "dome" },
  { name: "アラブ首長国連邦", emoji: "🇦🇪", cat: "desert", lm: "skyscraper" },
  { name: "カタール", emoji: "🇶🇦", cat: "desert", lm: "skyscraper" },
  { name: "クウェート", emoji: "🇰🇼", cat: "desert" },
  { name: "バーレーン", emoji: "🇧🇭", cat: "desert" },
  { name: "オマーン", emoji: "🇴🇲", cat: "desert", lm: "dome" },
  { name: "イエメン", emoji: "🇾🇪", cat: "desert" },
  { name: "イラク", emoji: "🇮🇶", cat: "desert", lm: "dome" },
  { name: "イラン", emoji: "🇮🇷", cat: "desert", lm: "dome" },
  { name: "イスラエル", emoji: "🇮🇱", cat: "mideast", lm: "dome" },
  { name: "ヨルダン", emoji: "🇯🇴", cat: "desert" },
  { name: "レバノン", emoji: "🇱🇧", cat: "med" },
  { name: "シリア", emoji: "🇸🇾", cat: "desert" },
  // 北アフリカ
  { name: "エジプト", emoji: "🇪🇬", cat: "desert", lm: "pyramid" },
  { name: "モロッコ", emoji: "🇲🇦", cat: "desert" },
  { name: "アルジェリア", emoji: "🇩🇿", cat: "desert" },
  { name: "チュニジア", emoji: "🇹🇳", cat: "desert" },
  { name: "リビア", emoji: "🇱🇾", cat: "desert" },
  { name: "スーダン", emoji: "🇸🇩", cat: "desert" },
  // サブサハラ・アフリカ
  { name: "ナイジェリア", emoji: "🇳🇬", cat: "africa" },
  { name: "ガーナ", emoji: "🇬🇭", cat: "africa" },
  { name: "ケニア", emoji: "🇰🇪", cat: "africa" },
  { name: "エチオピア", emoji: "🇪🇹", cat: "africa" },
  { name: "タンザニア", emoji: "🇹🇿", cat: "africa" },
  { name: "ウガンダ", emoji: "🇺🇬", cat: "africa" },
  { name: "南アフリカ", emoji: "🇿🇦", cat: "africa" },
  { name: "ジンバブエ", emoji: "🇿🇼", cat: "africa" },
  { name: "ザンビア", emoji: "🇿🇲", cat: "africa" },
  { name: "セネガル", emoji: "🇸🇳", cat: "africa" },
  { name: "カメルーン", emoji: "🇨🇲", cat: "africa" },
  { name: "コートジボワール", emoji: "🇨🇮", cat: "africa" },
  { name: "マリ", emoji: "🇲🇱", cat: "desert" },
  { name: "アンゴラ", emoji: "🇦🇴", cat: "africa" },
  { name: "モザンビーク", emoji: "🇲🇿", cat: "africa" },
  { name: "マダガスカル", emoji: "🇲🇬", cat: "tropical" },
  { name: "ボツワナ", emoji: "🇧🇼", cat: "africa" },
  { name: "ナミビア", emoji: "🇳🇦", cat: "desert" },
  { name: "ルワンダ", emoji: "🇷🇼", cat: "africa" },
  { name: "コンゴ民主共和国", emoji: "🇨🇩", cat: "tropical" },
  // 西ヨーロッパ
  { name: "イギリス", emoji: "🇬🇧", cat: "europe", lm: "bigben" },
  { name: "アイルランド", emoji: "🇮🇪", cat: "europe" },
  { name: "フランス", emoji: "🇫🇷", cat: "europe", lm: "eiffel" },
  { name: "ドイツ", emoji: "🇩🇪", cat: "europe", lm: "cathedral" },
  { name: "オランダ", emoji: "🇳🇱", cat: "europe", lm: "windmill" },
  { name: "ベルギー", emoji: "🇧🇪", cat: "europe" },
  { name: "ルクセンブルク", emoji: "🇱🇺", cat: "europe" },
  { name: "スイス", emoji: "🇨🇭", cat: "snow" },
  { name: "オーストリア", emoji: "🇦🇹", cat: "snow" },
  // 南欧（地中海）
  { name: "イタリア", emoji: "🇮🇹", cat: "med", lm: "colosseum" },
  { name: "ギリシャ", emoji: "🇬🇷", cat: "med", lm: "parthenon" },
  { name: "スペイン", emoji: "🇪🇸", cat: "med", lm: "cathedral" },
  { name: "ポルトガル", emoji: "🇵🇹", cat: "med" },
  { name: "マルタ", emoji: "🇲🇹", cat: "med" },
  { name: "キプロス", emoji: "🇨🇾", cat: "med" },
  // 北欧
  { name: "アイスランド", emoji: "🇮🇸", cat: "snow" },
  { name: "ノルウェー", emoji: "🇳🇴", cat: "snow" },
  { name: "スウェーデン", emoji: "🇸🇪", cat: "snow" },
  { name: "フィンランド", emoji: "🇫🇮", cat: "snow" },
  { name: "デンマーク", emoji: "🇩🇰", cat: "europe" },
  // 中・東欧
  { name: "ポーランド", emoji: "🇵🇱", cat: "europe" },
  { name: "チェコ", emoji: "🇨🇿", cat: "europe", lm: "cathedral" },
  { name: "スロバキア", emoji: "🇸🇰", cat: "europe" },
  { name: "ハンガリー", emoji: "🇭🇺", cat: "europe" },
  { name: "ルーマニア", emoji: "🇷🇴", cat: "europe" },
  { name: "ブルガリア", emoji: "🇧🇬", cat: "europe" },
  { name: "ウクライナ", emoji: "🇺🇦", cat: "europe", lm: "onion" },
  { name: "ベラルーシ", emoji: "🇧🇾", cat: "snow" },
  { name: "ロシア", emoji: "🇷🇺", cat: "snow", lm: "onion" },
  { name: "エストニア", emoji: "🇪🇪", cat: "snow" },
  { name: "ラトビア", emoji: "🇱🇻", cat: "europe" },
  { name: "リトアニア", emoji: "🇱🇹", cat: "europe" },
  { name: "クロアチア", emoji: "🇭🇷", cat: "med" },
  { name: "セルビア", emoji: "🇷🇸", cat: "europe" },
  { name: "スロベニア", emoji: "🇸🇮", cat: "europe" },
  { name: "ボスニア", emoji: "🇧🇦", cat: "europe" },
  { name: "アルバニア", emoji: "🇦🇱", cat: "med" },
  { name: "北マケドニア", emoji: "🇲🇰", cat: "europe" },
  { name: "ジョージア", emoji: "🇬🇪", cat: "snow" },
  { name: "アルメニア", emoji: "🇦🇲", cat: "snow" },
  { name: "アゼルバイジャン", emoji: "🇦🇿", cat: "desert" },
  // 北米
  { name: "アメリカ", emoji: "🇺🇸", cat: "america", lm: "skyscraper" },
  { name: "カナダ", emoji: "🇨🇦", cat: "snow" },
  // 中米・カリブ
  { name: "メキシコ", emoji: "🇲🇽", cat: "latin", lm: "steppyramid" },
  { name: "グアテマラ", emoji: "🇬🇹", cat: "latin", lm: "steppyramid" },
  { name: "キューバ", emoji: "🇨🇺", cat: "oceania" },
  { name: "ジャマイカ", emoji: "🇯🇲", cat: "oceania" },
  { name: "ハイチ", emoji: "🇭🇹", cat: "oceania" },
  { name: "ドミニカ共和国", emoji: "🇩🇴", cat: "oceania" },
  { name: "ホンジュラス", emoji: "🇭🇳", cat: "latin" },
  { name: "エルサルバドル", emoji: "🇸🇻", cat: "latin" },
  { name: "ニカラグア", emoji: "🇳🇮", cat: "latin" },
  { name: "コスタリカ", emoji: "🇨🇷", cat: "tropical" },
  { name: "パナマ", emoji: "🇵🇦", cat: "tropical" },
  // 南米
  { name: "コロンビア", emoji: "🇨🇴", cat: "tropical" },
  { name: "ベネズエラ", emoji: "🇻🇪", cat: "tropical" },
  { name: "エクアドル", emoji: "🇪🇨", cat: "tropical" },
  { name: "ペルー", emoji: "🇵🇪", cat: "latin", lm: "steppyramid" },
  { name: "ボリビア", emoji: "🇧🇴", cat: "latin" },
  { name: "ブラジル", emoji: "🇧🇷", cat: "tropical", lm: "christ" },
  { name: "アルゼンチン", emoji: "🇦🇷", cat: "latin" },
  { name: "チリ", emoji: "🇨🇱", cat: "latin" },
  { name: "ウルグアイ", emoji: "🇺🇾", cat: "latin" },
  { name: "パラグアイ", emoji: "🇵🇾", cat: "latin" },
  // オセアニア
  { name: "オーストラリア", emoji: "🇦🇺", cat: "oceania" },
  { name: "ニュージーランド", emoji: "🇳🇿", cat: "oceania" },
  { name: "フィジー", emoji: "🇫🇯", cat: "oceania" },
  { name: "パプアニューギニア", emoji: "🇵🇬", cat: "tropical" },
  { name: "サモア", emoji: "🇼🇸", cat: "oceania" },
  { name: "トンガ", emoji: "🇹🇴", cat: "oceania" },
  { name: "バヌアツ", emoji: "🇻🇺", cat: "oceania" },
  { name: "パラオ", emoji: "🇵🇼", cat: "oceania" },
];
