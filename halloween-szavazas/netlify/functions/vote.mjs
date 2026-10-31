import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Hibás kérés." }, 400); }

  const nev = typeof body.nev === "string" ? body.nev.trim().replace(/\s+/g, " ") : "";
  const szam = Number(body.szam);
  if (!nev || nev.length > 60) return json({ error: "Adj meg egy nevet (legfeljebb 60 karakter)." }, 400);
  if (!Number.isInteger(szam) || szam < 1 || szam > 999) return json({ error: "Érvénytelen sorszám." }, 400);

  const store = getStore({ name: "votes", consistency: "strong" });
  const key = encodeURIComponent(nev.toLocaleLowerCase("hu"));

  if (await store.get(key)) return json({ error: "duplicate" }, 409);
  await store.setJSON(key, { nev, szam, ido: new Date().toISOString() });
  return json({ ok: true });
};

export const config = { path: "/api/vote" };
