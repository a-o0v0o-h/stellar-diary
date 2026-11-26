# Stellar Diary

[![CI](https://github.com/a-o0v0o-h/stellar-diary/actions/workflows/ci.yml/badge.svg)](https://github.com/a-o0v0o-h/stellar-diary/actions/workflows/ci.yml)
[![CodeQL](https://github.com/a-o0v0o-h/stellar-diary/actions/workflows/codeql.yml/badge.svg)](https://github.com/a-o0v0o-h/stellar-diary/actions/workflows/codeql.yml)

つぶやきを星空で可視化する日記アプリ
日々の記録が夜空の星として広がり、感情・エネルギー・強度によって星の位置・サイズ・明るさが変わります。新しい記録ほど明るく輝き、時間とともに静かに薄れていきます。
<img width="1177" height="776" alt="スクリーンショット 2026-04-21 23 56 09" src="https://github.com/user-attachments/assets/db4c0221-2fe0-4be7-a251-a9d90a1aabdb" />

## 星への変換ルール

テキストを投稿すると OpenAI API が3つのパラメータを 0〜100 で解析し、星の見た目に反映されます。

| パラメータ                  | 星の表示                                         |
| --------------------------- | ------------------------------------------------ |
| **ポジティブ度**（emotion） | 星の位置（左右）。ポジティブなほど右へ           |
| **エネルギー**（energy）    | 星の位置（上下）。エネルギーが高いほど上へ       |
| **感情の強さ**（intensity） | 星のサイズ。強いほど大きく                       |
| **投稿日時**                | 星の明るさ。新しいほど明るく、30日で最も暗くなる |

## データの保存先について

日記はサーバーには保存せず、**ブラウザの localStorage にだけ保存**しています。

- URL を開くだけで誰でも試せるように、DB を用意しなくても動く構成にしました
- 日記という個人的な内容をサーバーに残さないためでもあります
- 感情の解析のため、投稿した文章だけは OpenAI API に送信します

DB（Prisma + SQLite）に保存していた以前の版は [`prisma` ブランチ](https://github.com/a-o0v0o-h/stellar-diary/tree/prisma) に残しています。

## API の利用料金への対策

公開環境で OpenAI API を使うため、意図しない大量利用への対策を入れています。

- 1 回の投稿は 280 文字まで（画面とサーバーの両方でチェック）
- 解析は IP ごとに 1 日 10 回まで（`DAILY_ANALYZE_LIMIT` で変更可能）
- OpenAI 側はクレジットの前払い + 自動チャージなしで運用し、上限を超えて請求されないようにする

※ 回数制限はサーバーのメモリで数えているため、サーバーレス環境ではインスタンスごとのカウントになります。料金の上限は OpenAI 側の設定で担保しています。

## Tech Stack

- **Next.js** (App Router)
- **localStorage**（`useSyncExternalStore` で購読）
- **Tailwind CSS v4**
- **OpenAI API**
- **Vitest**（テスト）

## Setup

### 1. リポジトリをクローン

```bash
git clone https://github.com/a-o0v0o-h/stellar-diary.git
cd stellar-diary
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

`.env.local` ファイルをルートに作成します。

```env
OPENAI_API_KEY="your_openai_api_key"
# 任意: IP ごとの 1 日あたりの解析回数（デフォルト 10）
DAILY_ANALYZE_LIMIT=10
```

### 4. 開発サーバーを起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。初めて開いたときは、サンプルの星が表示されます。

## 開発

```bash
npm run lint       # ESLint
npm run typecheck  # 型チェック
npm test           # テスト（Vitest）
npm run build      # 本番ビルド
```

### テスト

API キーがなくても動くように、OpenAI API はモックにしています。

- `app/api/analyze/route.test.ts`：入力チェック（空文字・281 文字など）、回数制限、解析失敗時のレスポンス
- `lib/analyzeEmotion.test.ts`：AI の返答が崩れていたとき（コードブロック付き・数値以外・JSON でない）の扱い
- `lib/rateLimit.test.ts`：IP ごとのカウントと 24 時間でのリセット
- `lib/diaryStore.test.ts`：localStorage の読み書き、壊れたデータ、書き込めない環境、サンプルの星

### CI・脆弱性チェック

- **CI**（GitHub Actions）：PR と `main` への push で lint・型チェック・テスト・ビルドを実行
- **npm audit**：本番で使うパッケージに high 以上の脆弱性があれば CI を失敗させる
- **CodeQL**：コードの脆弱性を静的解析（PR・`main` への push・毎週月曜）
- **Dependabot**：依存パッケージと GitHub Actions の更新 PR を毎週作成
