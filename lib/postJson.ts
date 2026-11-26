/**
 * JSON を POST して、レスポンスの JSON を返す。
 * API はエラーのときも理由を JSON で返すので、ステータスにかかわらず本文を読む。
 * 本文が JSON でなければ null。通信できなかったときは例外を投げる。
 */
export async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => null);
}
