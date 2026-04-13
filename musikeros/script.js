document.addEventListener("DOMContentLoaded", () => {
  const WA_PHONE = "51987690625";
  const YT_CHANNEL_URL = "https://www.youtube.com/";
  const FB_PAGE_URL = "https://www.facebook.com/";
  const ALERT_STORAGE_KEY = "musikeros_notice_closed_signature";
  const LIVE_POLL_MS = 10000;

  const hamburger = document.getElementById("hamburgerBtn") || document.querySelector(".hamburger");
  const navLinks = document.getElementById("navLinks") || document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      const expanded = navLinks.classList.contains("active");
      hamburger.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetSelector = this.getAttribute("href");
      const target = document.querySelector(targetSelector);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });

      if (navLinks && navLinks.classList.contains("active")) {
        navLinks.classList.remove("active");
        if (hamburger) hamburger.setAttribute("aria-expanded", "false");
      }
    });
  });

  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (!navbar) return;
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  });

  const modal = document.getElementById("videoModal");
  const closeBtn = document.getElementById("closeModal") || document.querySelector(".close-modal");
  const iframe = document.getElementById("youtubePlayer");

  function openModal(videoId) {
    if (!modal || !iframe || !videoId) return;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!modal || !iframe) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    iframe.src = "";
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  async function fetchYouTubeTitle(videoId) {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo obtener título");
      const data = await res.json();
      return data.title || null;
    } catch {
      return null;
    }
  }

  const genericVideoCards = document.querySelectorAll(".video-card[data-youtube]");

  genericVideoCards.forEach(async (card, index) => {
    const videoId = card.getAttribute("data-youtube");
    const thumb = card.querySelector(".video-thumbnail");
    const titleEl = card.querySelector("h3");

    if (!videoId) return;

    if (thumb) {
      const maxThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const hqThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const testImg = new Image();
      testImg.onload = function () {
        if (this.naturalWidth <= 120) {
          thumb.style.backgroundImage = `url('${hqThumb}')`;
        } else {
          thumb.style.backgroundImage = `url('${maxThumb}')`;
        }
      };
      testImg.onerror = () => {
        thumb.style.backgroundImage = `url('${hqThumb}')`;
      };
      testImg.src = maxThumb;
    }

    if (titleEl) {
      const fallbackTitle = titleEl.textContent?.trim() || `Video ${index + 1}`;
      const realTitle = await fetchYouTubeTitle(videoId);
      titleEl.textContent = realTitle || fallbackTitle;
      card.setAttribute("aria-label", `Reproducir ${titleEl.textContent}`);
    }

    card.addEventListener("click", () => openModal(videoId));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(videoId);
      }
    });
  });

  const waBtn = document.getElementById("whatsappBtn");
  const sections = document.querySelectorAll("header[id], section[id]");

  const sectionMessageMap = {
    hero: "Hola Los Musikeros, vi su página y quiero información para un evento.",
    about: "Hola Los Musikeros, me gustó su historia. ¿Tienen fechas disponibles?",
    gallery: "Hola Los Musikeros, vi sus videos y quiero cotizar una presentación.",
    contact: "Hola Los Musikeros, deseo coordinar una presentación presencial.",
    contacto: "Hola Los Musikeros, quiero reservar una fecha para un evento.",
    "live-player": "Hola Los Musikeros, vi su sección en vivo y quiero cotizar un show."
  };

  function getCurrentSectionId() {
    let current = "hero";
    const scrollPos = window.scrollY + 150;

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = sec.id;
      }
    });

    return current;
  }

  function buildWaUrl(message) {
    return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
  }

  function refreshFloatingWaLink() {
    if (!waBtn) return;
    const id = getCurrentSectionId();
    const msg = sectionMessageMap[id] || "Hola Los Musikeros, quisiera información para un evento.";
    waBtn.href = buildWaUrl(msg);
  }

  if (waBtn) {
    refreshFloatingWaLink();
    window.addEventListener("scroll", refreshFloatingWaLink);
  }

  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    const status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("aria-live", "polite");
    contactForm.appendChild(status);

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const nombre = (document.getElementById("nombre")?.value || "").trim();
      const email = (document.getElementById("email")?.value || "").trim();
      const mensaje = (document.getElementById("mensaje")?.value || "").trim();

      if (!nombre || !email || !mensaje) {
        status.textContent = "Por favor completa todos los campos.";
        return;
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        status.textContent = "Ingresa un correo válido.";
        return;
      }

      const texto = `Hola Los Musikeros, quiero información para un evento.\nNombre: ${nombre}\nEmail: ${email}\nMensaje: ${mensaje}`;

      window.open(buildWaUrl(texto), "_blank");

      status.textContent = "Te estamos redirigiendo a WhatsApp...";
      contactForm.reset();

      setTimeout(() => {
        status.textContent = "";
      }, 3000);
    });
  }

  async function getLiveConfigFromServer() {
    try {
      const res = await fetch("/.netlify/functions/get-live", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache"
        }
      });

      if (!res.ok) {
        return { ok: false, platform: "youtube", live_url: "", event_title: "", special_message: "" };
      }

      const data = await res.json();
      return {
        ok: !!data?.ok,
        platform: (data?.platform || "youtube").trim().toLowerCase(),
        live_url: (data?.live_url || "").trim(),
        event_title: (data?.event_title || "").trim(),
        special_message: (data?.special_message || "").trim()
      };
    } catch {
      return { ok: false, platform: "youtube", live_url: "", event_title: "", special_message: "" };
    }
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

        if (url.pathname.startsWith("/live/")) {
          const id = url.pathname.split("/").filter(Boolean)[1] || "";
          return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
        }

        if (url.pathname.startsWith("/embed/")) {
          const id = url.pathname.split("/").filter(Boolean)[1] || "";
          return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
        }

        if (url.pathname.startsWith("/shorts/")) {
          const id = url.pathname.split("/").filter(Boolean)[1] || "";
          return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
        }
      }
    } catch {
      return "";
    }

    return "";
  }

  function extractFacebookVideoUrl(input) {
    if (!input) return "";
    const value = String(input).trim();

    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      if (host.includes("facebook.com") || host === "fb.watch" || host.includes("fb.com")) {
        return url.toString();
      }
    } catch {
      return "";
    }

    return "";
  }

  function buildYouTubeEmbedUrl(input) {
    const videoId = extractYouTubeVideoId(input);
    if (!videoId) return "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
  }

  function buildFacebookEmbedUrl(input) {
    const rawUrl = extractFacebookVideoUrl(input);
    if (!rawUrl) return "";
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(rawUrl)}&show_text=false&width=1280`;
  }

  function normalizeLiveConfig(config) {
    const platform = config?.platform === "facebook" ? "facebook" : "youtube";
    const liveUrl = (config?.live_url || "").trim();
    const eventTitle = (config?.event_title || "").trim();
    const specialMessage = (config?.special_message || "").trim();

    const embedUrl = platform === "facebook"
      ? buildFacebookEmbedUrl(liveUrl)
      : buildYouTubeEmbedUrl(liveUrl);

    return {
      platform,
      live_url: liveUrl,
      event_title: eventTitle,
      special_message: specialMessage,
      embed_url: embedUrl,
      hasLive: !!(liveUrl && embedUrl),
      primaryLabel: platform === "facebook" ? "Facebook" : "YouTube",
      platformUrl: platform === "facebook" ? FB_PAGE_URL : YT_CHANNEL_URL
    };
  }

  function getNoticeSignature(config) {
    return JSON.stringify({
      hasLive: !!config?.hasLive,
      platform: config?.platform || "youtube",
      live_url: config?.live_url || "",
      event_title: config?.event_title || "",
      special_message: config?.special_message || ""
    });
  }

  function setTopbar(visible, message = "") {
    const topbar = document.getElementById("liveTopBar");
    const text = document.getElementById("liveTopBarText");
    if (!topbar) return;

    if (!visible) {
      document.body.classList.remove("has-live-topbar");
      topbar.hidden = true;
      topbar.onclick = null;
      topbar.style.cursor = "";
      return;
    }

    document.body.classList.add("has-live-topbar");
    topbar.hidden = false;
    topbar.style.cursor = "pointer";

    if (text) {
      text.textContent = message || "🔴 Estamos EN VIVO ahora — toca aquí para ver la transmisión.";
    }

    topbar.onclick = (e) => {
      if (e.target.closest("a")) return;
      window.location.href = "en-vivo.html";
    };
  }

  function removeSiteAlert() {
    const oldNotice = document.getElementById("siteLiveNotice");
    if (oldNotice) oldNotice.remove();
  }

  function injectSiteAlert(config) {
    const shouldShow = !!(config.hasLive || config.special_message || config.event_title);
    const signature = getNoticeSignature(config);
    const savedClosedSignature = localStorage.getItem(ALERT_STORAGE_KEY);

    removeSiteAlert();

    if (!shouldShow) {
      localStorage.removeItem(ALERT_STORAGE_KEY);
      return;
    }

    if (savedClosedSignature === signature) {
      return;
    }

    const notice = document.createElement("div");
    notice.id = "siteLiveNotice";
    notice.className = "site-live-notice";

    const mainText = config.special_message || (
      config.hasLive
        ? `Estamos transmitiendo ahora mismo por ${config.primaryLabel}.`
        : "Tenemos un anuncio especial para este evento."
    );

    const title = config.event_title || (config.hasLive ? "Estamos en vivo" : "Mensaje especial");
    const ctaHref = config.hasLive ? "en-vivo.html" : "#contacto";
    const ctaLabel = config.hasLive ? "Ver transmisión" : "Ver detalles";

    notice.innerHTML = `
      <button type="button" class="site-live-notice-close" aria-label="Cerrar aviso">×</button>
      <div class="site-live-notice-pill">${config.hasLive ? "EN VIVO" : "AVISO"}</div>
      <h3>${title}</h3>
      <p>${mainText}</p>
      <div class="site-live-notice-actions">
        <a href="${ctaHref}" class="cta-button">${ctaLabel}</a>
      </div>
    `;

    document.body.appendChild(notice);

    const close = notice.querySelector(".site-live-notice-close");
    if (close) {
      close.addEventListener("click", () => {
        localStorage.setItem(ALERT_STORAGE_KEY, signature);
        notice.classList.add("is-hiding");
        setTimeout(() => notice.remove(), 220);
      });
    }
  }

  async function refreshIndexLiveUI() {
    const liveBtn = document.getElementById("liveCtaBtn");
    const textEl = liveBtn?.querySelector(".live-cta-text");

    const rawConfig = await getLiveConfigFromServer();
    const config = normalizeLiveConfig(rawConfig);

    injectSiteAlert(config);
    setTopbar(false);

    if (liveBtn) {
      liveBtn.classList.remove("live-on");
      liveBtn.classList.add("live-off");
      liveBtn.href = config.platformUrl;
      liveBtn.target = "_blank";
      liveBtn.rel = "noopener noreferrer";

      if (textEl) {
        textEl.textContent = config.platform === "facebook" ? "VER FACEBOOK" : "VER YOUTUBE";
      }
    }

    if (config.hasLive) {
      const topbarMessage = config.event_title
        ? `🔴 ${config.event_title} — estamos EN VIVO ahora.`
        : `🔴 Estamos EN VIVO ahora por ${config.primaryLabel}.`;

      setTopbar(true, topbarMessage);

      if (liveBtn) {
        liveBtn.classList.remove("live-off");
        liveBtn.classList.add("live-on");
        liveBtn.href = "en-vivo.html";
        liveBtn.target = "_self";
        liveBtn.rel = "";

        if (textEl) {
          textEl.textContent = "VER EN VIVO";
        }
      }
    }
  }

  async function loadLivePage() {
    const ytIframe = document.getElementById("ytLiveIframe");
    const ytWrap = document.getElementById("ytLiveWrap");
    const fbIframe = document.getElementById("fbLiveIframe");
    const fbWrap = document.getElementById("fbLiveWrap");
    const fallback = document.getElementById("ytFallback");

    const title = document.getElementById("livePlayerTitle");
    const subtitle = document.getElementById("livePlayerSubtitle");
    const badge = document.getElementById("liveBadge");
    const statusText = document.getElementById("liveStatusText");
    const fallbackText = document.getElementById("liveFallbackText");
    const eventTitleEl = document.getElementById("liveEventTitle");
    const specialBox = document.getElementById("liveSpecialBox");
    const specialTitle = document.getElementById("liveSpecialTitle");
    const specialText = document.getElementById("liveSpecialText");

    if (!title) return;

    const rawConfig = await getLiveConfigFromServer();
    const config = normalizeLiveConfig(rawConfig);

    injectSiteAlert(config);

    if (eventTitleEl) {
      eventTitleEl.textContent = config.event_title || "Transmisión especial";
      eventTitleEl.hidden = !config.event_title;
    }

    if (specialBox) {
      const hasSpecial = !!config.special_message;
      specialBox.hidden = !hasSpecial;

      if (hasSpecial) {
        if (specialTitle) specialTitle.textContent = config.event_title || "Mensaje especial";
        if (specialText) specialText.textContent = config.special_message;
      }
    }

    if (!config.hasLive) {
      if (ytIframe) ytIframe.src = "";
      if (fbIframe) fbIframe.src = "";
      if (ytWrap) ytWrap.hidden = true;
      if (fbWrap) fbWrap.hidden = true;
      if (fallback) fallback.hidden = false;

      title.textContent = "Transmisión en vivo";

      if (badge) {
        badge.textContent = "OFFLINE";
        badge.classList.remove("is-live");
      }

      if (statusText) {
        statusText.textContent = "No hay transmisión configurada ahora mismo.";
      }

      if (fallbackText) {
        fallbackText.textContent = config.special_message || "No hay transmisión configurada ahora mismo.";
      }

      if (subtitle) {
        subtitle.textContent = "Cuando activen el live, aparecerá aquí dentro de la página en formato completo.";
      }

      return;
    }

    if (fallback) fallback.hidden = true;

    if (badge) {
      badge.textContent = "EN VIVO";
      badge.classList.add("is-live");
    }

    if (statusText) {
      statusText.textContent = `Transmitiendo ahora por ${config.primaryLabel}.`;
    }

    if (title) {
      title.textContent = config.event_title || "Transmisión en vivo";
    }

    if (subtitle) {
      subtitle.textContent = "Mira la transmisión directamente aquí dentro de la página.";
    }

    if (config.platform === "facebook") {
      if (ytWrap) ytWrap.hidden = true;
      if (ytIframe) ytIframe.src = "";

      if (fbWrap) fbWrap.hidden = false;
      if (fbIframe) fbIframe.src = config.embed_url;
    } else {
      if (fbWrap) fbWrap.hidden = true;
      if (fbIframe) fbIframe.src = "";

      if (ytWrap) ytWrap.hidden = false;
      if (ytIframe) ytIframe.src = config.embed_url;
    }
  }

  if (document.getElementById("liveCtaBtn")) {
    refreshIndexLiveUI();
    setInterval(refreshIndexLiveUI, LIVE_POLL_MS);
  }

  if (document.getElementById("livePlayerTitle")) {
    loadLivePage();
    setInterval(loadLivePage, LIVE_POLL_MS);
  }
});