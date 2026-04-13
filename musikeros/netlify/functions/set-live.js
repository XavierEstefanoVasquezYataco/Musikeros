import { getStore } from "@netlify/blobs";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function extractYouTubeVideoId(input) {
  if (!input) return "";

  const value = String(input).trim();

  if (/^[A-Za-z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v") || "";
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
      }

      if (
        url.pathname.startsWith("/live/") ||
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/shorts/")
      ) {
        const id = url.pathname.split("/").filter(Boolean)[1] || "";
        return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function isValidYouTubeUrl(url) {
  if (!url) return true;
  return !!extractYouTubeVideoId(url);
}

function isValidFacebookUrl(url) {
  if (!url) return true;
  try {
    const parsed = new URL(String(url).trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    return host.includes("facebook.com") || host === "fb.watch" || host.includes("fb.com");
  } catch {
    return false;
  }
}

export default async (req) => {
  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "Use POST" }, 405);
    }

    const data = await req.json().catch(() => null);
    const platform =
      (data?.platform || "youtube").trim().toLowerCase() === "facebook"
        ? "facebook"
        : "youtube";

    const rawUrl = (data?.live_url || "").trim();
    const eventTitle = (data?.event_title || "").trim().slice(0, 120);
    const specialMessage = (data?.special_message || "").trim().slice(0, 350);

    const isValid =
      platform === "facebook" ? isValidFacebookUrl(rawUrl) : isValidYouTubeUrl(rawUrl);

    if (!isValid) {
      return json(
        {
          ok: false,
          error:
            platform === "facebook"
              ? "URL inválida. Usa un enlace público de Facebook Live o video."
              : "URL inválida. Usa un enlace válido de YouTube o el ID del video."
        },
        400
      );
    }

    const store = getStore("live-config");

    const payload = {
      platform,
      live_url: rawUrl,
      event_title: eventTitle,
      special_message: specialMessage
    };

    await store.set("live_config", JSON.stringify(payload));
    await store.set("live_url", rawUrl);

    return json({ ok: true, ...payload });
  } catch (err) {
    return json({ ok: false, error: String(err?.message || err) }, 500);
  }
};