import OpenAI from "openai";

export async function analyzeEmotion(content: string) {
  if (!process.env.OPENAI_API_KEY) {
    return { isOk: false } as const;
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
以下の文章の感情を分析して、ポジティブ度・エネルギー・感情の強さの3つを0〜100の数字で表してください。
文章:
${content}

出力はJSON文字列のみとする。
例：{"emotion": 50, "energy": 0, "intensity": 80}

emotion: ポジティブ度
energy: エネルギー
intensity: 強さ
`,
    });

    // TODO: 戻り値の型定義
    const emotions = JSON.parse(extractJson(response.output_text));

    return {
      emotion: toScore(emotions.emotion),
      energy: toScore(emotions.energy),
      intensity: toScore(emotions.intensity),
      isOk: true,
    } as const;
  } catch {
    return {
      isOk: false,
    } as const;
  }
}

/** コードブロックで囲まれて返ってきても JSON 部分だけを取り出す */
const extractJson = (text: string) => text.match(/\{[\s\S]*\}/)?.[0] ?? text;

/** 数値以外が返ってきたら中央の 50 にする */
const toScore = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 50;
