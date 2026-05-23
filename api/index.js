import { createServer } from "node:http";

let handler = null;
async function getHandler() {
  if (!handler) {
    const mod = await import("../dist/server/server.js");
    handler = mod.default;
  }
  return handler;
}

export default async function (req, res) {
  const h = await getHandler();
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = `${protocol}://${host}${req.url}`;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
  const webReq = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
  });
  const webRes = await h.fetch(webReq, {}, {});
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await webRes.arrayBuffer()));
}
