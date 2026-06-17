# 今いくら稼いでる？ / EarnFlow

> 時給・日給で働く人のための、**リアルタイム収入トラッカー**。
> 「スタート」を押すと、いま稼いでいる金額が毎秒増えていきます。

[https://spirited-earn-flow-live.base44.app](https://spirited-earn-flow-live.base44.app) のクローンを、
Base44 に依存しない **Vite + React + TypeScript** の自前プロジェクトとして再構築するためのリポジトリです。
現状は **開発を始めやすい雛形（dev-ready scaffold）** で、デザインテーマ・データモデル・ルーティング・各ページの土台が揃っています。
各ページの中身（UIロジック）はこれから実装していきます。

## 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| ビルド | Vite |
| UI | React 19 + TypeScript |
| スタイル | Tailwind CSS v3（ダークネイビー × ゴールドのテーマ） |
| ルーティング | React Router |
| アイコン | lucide-react |
| グラフ | recharts（カレンダーの月別収入グラフ用） |
| 日付処理 | date-fns |
| 永続化 | localStorage（`src/lib/store.ts`） |

## セットアップ

```bash
npm install      # 依存をインストール
npm run dev      # 開発サーバー起動（http://localhost:5173）
npm run build    # 型チェック + 本番ビルド（dist/ に出力）
npm run preview  # 本番ビルドのプレビュー
npm run lint     # ESLint
```

## ディレクトリ構成

```
src/
├─ main.tsx               エントリポイント
├─ App.tsx                ルーティング定義（全ページの配線）
├─ index.css              テーマ（CSS変数）と Tailwind
├─ lib/
│  ├─ types.ts            データモデル（Workplace / Session / Goal / User）
│  ├─ store.ts            localStorage 永続化（CRUD）※後でバックエンドに差し替え可
│  ├─ earnings.ts         収入計算ロジック（時給/日給・時間帯別倍率）
│  └─ utils.ts            cn() / 円フォーマット / 時間フォーマット 等
├─ components/
│  ├─ ui/                 shadcn 風プリミティブ（button / card / input）
│  ├─ Logo.tsx            砂時計ロゴ
│  ├─ Layout.tsx          アプリ共通レイアウト + ボトムナビ
│  ├─ AuthShell.tsx       認証画面の共通レイアウト
│  └─ PageStub.tsx        開発用のページ雛形（TODO 表示）
└─ pages/
   ├─ Home.tsx            給料カウンター（ホーム）
   ├─ Calendar.tsx        稼ぎカレンダー
   ├─ Presets.tsx         バイト先管理 & 目標設定
   └─ auth/               Login / Register / ForgotPassword / ResetPassword
```

`@/` は `src/` のエイリアスです（例: `import { cn } from "@/lib/utils"`）。

## 画面と機能仕様

### 🏠 ホーム（給料カウンター） `/`
- バイト先を選択して「スタート / ストップ / リセット」
- 稼働中は **毎秒** 収入を加算表示（時給・時間帯別倍率を反映）
- ストップでセッションを確定し履歴へ保存
- 月目標トラッカー（今月の合計・進捗バー・「あと ¥◯」）

### 📅 稼ぎカレンダー `/calendar`
- 月間カレンダーグリッドに日別収入を表示
- 今月 / 今年 / 累計合計の切り替え
- 月別収入グラフ（recharts）
- セッション履歴一覧（日付・勤務時間・収入）

### ⚙️ バイト先管理 & 目標設定 `/presets`
- バイト先の追加・編集・削除
- 給与タイプ：**時給制 / 日給制**
- 時給（円/時）または 日給（円/日）の入力
- 時間帯別倍率ルール（例：深夜 22 時〜 を 1.25 倍）
- 月目標額の設定

### 🔑 認証 `/login` `/register` `/forgot-password` `/reset-password`
- 現在はフォームのみ（送信すると画面遷移するだけのモック）
- TODO：本物の認証（Supabase / Firebase 等）に接続

## データモデル

`src/lib/types.ts` に定義。永続化は `src/lib/store.ts` が localStorage で担当します。
**バックエンドへ移行する場合は `store.ts` の関数だけを差し替えれば UI 側は無修正**で動きます。

- `Workplace` … バイト先（名前 / 給与タイプ / 時給・日給 / 時間帯別倍率ルール）
- `Session` … 1 回の稼働記録（開始・終了・秒数・確定収入・日付）
- `Goal` … 月目標額
- `User` … クライアント側モックユーザー

## 収入計算ロジック（`src/lib/earnings.ts`）

- **時給制**：1 秒あたり `時給 / 3600 × その時刻の倍率`。時間帯別倍率（深夜割増など）に対応するため、1 分刻みで積分します。
- **日給制**：稼働を開始した時点で日給を満額計上（按分なしのシンプル版）。
- `currentEarnings()` を毎秒呼び出すことでホームのリアルタイム表示を実現します。

## デプロイ

静的サイトとしてビルドできます（`npm run build` → `dist/`）。
SPA のためサーバー側で全パスを `index.html` にフォールバックさせる必要があります。
Vercel 向けの `vercel.json`（リライト設定）を同梱済みです。

## ライセンス

Private project.
