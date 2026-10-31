import { getStore } from "@netlify/blobs";
import { createHash, timingSafeEqual } from "node:crypto";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const sha = (s) => createHash("sha256").update(String(s)).digest();

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = process.env.RESULTS_PASSWORD;
  if (!expected) return json({ error: "A RESULTS_PASSWORD környezeti változó nincs beállítva a Netlifyon." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Hibás kérés." }, 400); }
  if (!timingSafeEqual(sha(body.password ?? ""), sha(expected))) return json({ error: "unauthorized" }, 401);

  const store = getStore({ name: "votes", consistency: "strong" });
  const { blobs } = await store.list();

  if (body.action === "reset") {
    await Promise.all(blobs.map((b) => store.delete(b.key)));
    return json({ votes: [] });
  }

  const votes = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
  return json({ votes });
};

export const config = { path: "/api/results" };
