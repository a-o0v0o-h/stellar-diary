// E2E 用の OpenAI API のモック。Responses API の形だけ真似して、決まった答えを返す
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_OPENAI_PORT ?? 4010);

const respond = (res, text) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      id: "resp_mock",
      object: "response",
      status: "completed",
      output: [
        {
          type: "message",
          id: "msg_mock",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text, annotations: [] }],
        },
      ],
    }),
  );
};

createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/v1/responses") {
    res.writeHead(200).end("ok");
    return;
  }

  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    const body = JSON.parse(raw);
    const format = body.text?.format;

    if (format?.name === "reflection") {
      // 名言は渡された候補の中から選ぶ
      const [quoteId] = format.schema.properties.quoteId.enum;
      respond(res, JSON.stringify({ comment: "テスト用のふりかえりです。", quoteId }));
      return;
    }

    respond(res, JSON.stringify({ emotion: 80, energy: 70, intensity: 60 }));
  });
}).listen(PORT);
