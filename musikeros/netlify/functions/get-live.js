import { getStore } from "@netlify/blobs";

function json(body, status = 200, cacheControl = "no-store, no-cache, must-revalidate") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      "Pragma": "no-cache",
      "Expires": "0"
    },
  });
}

export default async () => {
  try {
    const store = getStore("live-config");
    const rawConfig = await store.get("live_config", { type: "text" });

    if (rawConfig) {
      const parsed = JSON.parse(rawConfig);
      return json({
        ok: true,
        platform: (parsed?.platform || "youtube").trim(),
        event_title: (parsed?.event_title || "").trim(),
        live_url: (parsed?.live_url || "").trim(),
        special_message: (parsed?.special_message || "").trim(),
      });
    }

    const legacyUrl = await store.get("live_url", { type: "text" });

    return json({
      ok: true,
      platform: "youtube",
      event_title: "",
      live_url: (legacyUrl || "").trim(),
      special_message: "",
    });
  } catch (err) {
    return json({ ok: false, error: String(err?.message || err) }, 500);
  }
};