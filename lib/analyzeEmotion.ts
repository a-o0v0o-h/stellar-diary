import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeEmotion(content: string) {
  try {
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
    const emotions = JSON.parse(response.output_text);

    return {
      emotion: emotions.emotion ?? 50,
      energy: emotions.energy ?? 50,
      intensity: emotions.intensity ?? 50,
      isOk: true,
    };
  } catch (e) {
    return {
      isOk: false,
    };
  }
}
