# Stellar Diary

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

## Tech Stack

- **Next.js** (App Router)
- **Prisma** + SQLite
- **Tailwind CSS v4**
- **OpenAI API**

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

`.env` ファイルをルートに作成します。

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your_openai_api_key"
```

### 4. データベースをセットアップ

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. 開発サーバーを起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。
