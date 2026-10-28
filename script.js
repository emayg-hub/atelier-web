(() => {
  "use strict";
  const config = window.ATELIER_CONFIG || {};
  const project = config.project || {};
  const company = config.company || {};
  const name = project.name || "ALTIORA";
  document.querySelectorAll("[data-project-name]").forEach(el => { el.textContent = name; });
  document.getElementById("year").textContent = new Date().getFullYear();

  // Solo se permiten archivos locales y enlaces web para los recursos visuales.
  function imageSource(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:", "file:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }
  function phoneLink(value) {
    return "tel:" + String(value || "").replace(/[^+\d]/g, "");
  }
  function emailLink(value) {
    return "mailto:" + encodeURIComponent(String(value || "")).replace(/%40/g, "@");
  }
  function fillContact(selector, value, kind) {
    document.querySelectorAll(selector).forEach(el => {
      if (!value) { el.hidden = true; return; }
      el.replaceChildren(document.createTextNode(value + " "));
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true"); arrow.textContent = "↗"; el.append(arrow);
      el.href = kind === "email" ? emailLink(value) : phoneLink(value);
    });
  }
  fillContact("[data-school-email]", project.email, "email");
  fillContact("[data-school-phone]", project.phone, "phone");
  if (!project.email && !project.phone) document.querySelector(".school-contact").hidden = true;
  if (company.email || company.phone) {
    document.querySelectorAll("[data-company-contact]").forEach(el => { el.hidden = false; });
    const companyEmail = document.querySelector("[data-company-email]");
    if (company.email) {
      companyEmail.href = emailLink(company.email) + "?subject=" + encodeURIComponent("Consulta de proyecto — ATELIER");
    } else { companyEmail.hidden = true; }
    fillContact("[data-company-phone]", company.phone, "phone");
  }
  if (imageSource(config.logo)) {
    document.querySelectorAll("[data-logo]").forEach(logo => {
      logo.addEventListener("load", () => {
        const brand = logo.closest(".brand");
        brand.querySelector("[data-logo-container]").hidden = false;
        brand.querySelector("[data-wordmark]").hidden = true;
        brand.classList.add("has-logo");
      }, { once: true });
      logo.src = imageSource(config.logo);
    });
  }


  // Las redes del estudio son independientes de los datos de contacto del colegio.
  document.querySelectorAll("[data-social]").forEach(link => {
    const address = config.socials?.[link.dataset.social];
    if (typeof address !== "string") return;
    try {
      const url = new URL(address);
      if (!["https:", "http:"].includes(url.protocol)) { link.hidden = true; return; }
      link.href = url.href;
    } catch { link.hidden = true; }
  });

  // Navegación móvil y por teclado.
  const menu = document.querySelector(".menu-toggle");
  const nav = document.getElementById("main-nav");
  function closeMenu() {
    menu.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open");
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open)); nav.classList.toggle("is-open", open);
  });
  nav.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("click", event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      closeMenu(); menu.focus();
    }
  });
  const desktop = window.matchMedia("(min-width: 821px)");
  desktop.addEventListener("change", () => { if (desktop.matches) closeMenu(); });

  if ("IntersectionObserver" in window) {
    const sections = [...document.querySelectorAll("main section[id]")];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        nav.querySelectorAll("a").forEach(link => {
          if (link.hash === "#" + entry.target.id) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    }, { rootMargin: "-20% 0px -50% 0px", threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }

  // Galería por categorías. Cada filtro tiene su propio recorrido y miniaturas.
  const allImages = (Array.isArray(project.images) ? project.images : [])
    .filter(item => item && imageSource(item.src))
    .map(item => ({
      src: imageSource(item.src),
      alt: item.alt || "Render del colegio " + name,
      caption: item.caption || "Colegio " + name,
      category: item.category || (item.src.includes("/interiores/") ? "interiores" : "exteriores")
    }));
  if (!allImages.length) return;

  const categoryNames = { exteriores: "Exteriores", interiores: "Interiores" };
  const groups = new Map(Object.keys(categoryNames)
    .map(category => [category, allImages.filter(item => item.category === category)])
    .filter(([, items]) => items.length));
  if (!groups.size) return;

  const placeholder = document.getElementById("project-placeholder");
  const gallery = document.getElementById("project-gallery");
  const galleryView = document.getElementById("gallery-view");
  const mainImage = document.getElementById("gallery-image");
  const caption = document.getElementById("gallery-caption");
  const count = document.getElementById("gallery-count");
  const thumbnailContainer = document.getElementById("gallery-thumbnails");
  const categorySummary = document.getElementById("gallery-category-summary");
  const categoryButtons = [...document.querySelectorAll("[data-gallery-category]")];
  const lightbox = document.getElementById("lightbox");
  const largeImage = document.getElementById("lightbox-image");
  const galleryButton = document.querySelector(".gallery-main");
  const navigationButtons = [...document.querySelectorAll(".gallery-controls .icon-button,.lightbox-prev,.lightbox-next")];
  let activeCategory = groups.has(project.defaultCategory) ? project.defaultCategory : groups.keys().next().value;
  let images = groups.get(activeCategory);
  let current = 0;
  let thumbnails = [];

  const autoplayButton = document.getElementById("gallery-autoplay");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const seconds = Number(project.autoplaySeconds ?? 6);
  const autoplayDelay = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
  let autoplayEnabled = autoplayDelay > 0 && !motionPreference.matches;
  let autoplayTimer = null;
  let galleryInView = !("IntersectionObserver" in window);
  let restoringGalleryFocus = false;

  function syncAutoplayButton() {
    autoplayButton.hidden = images.length < 2 || autoplayDelay === 0;
    autoplayButton.textContent = autoplayEnabled ? "Pausar" : "Reproducir";
    autoplayButton.setAttribute("aria-label", autoplayEnabled
      ? "Pausar el cambio automático de imágenes"
      : "Reproducir el cambio automático de imágenes");
    caption.setAttribute("aria-live", autoplayEnabled ? "off" : "polite");
  }
  function scheduleAutoplay() {
    window.clearTimeout(autoplayTimer);
    autoplayTimer = null;
    if (!autoplayEnabled || images.length < 2 || !galleryInView || document.hidden || lightbox.open) return;
    autoplayTimer = window.setTimeout(() => {
      autoplayTimer = null;
      advance(1);
    }, autoplayDelay);
  }
  function buildThumbnails() {
    const fragment = document.createDocumentFragment();
    thumbnails = images.map((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-thumbnail";
      button.setAttribute("aria-label", categoryNames[activeCategory] + ", imagen " + (index + 1) + ": " + item.caption);
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 140;
      img.height = 90;
      button.append(img);
      button.addEventListener("click", () => { current = index; render(); });
      fragment.append(button);
      return button;
    });
    thumbnailContainer.replaceChildren(fragment);
    thumbnailContainer.hidden = images.length < 2;
    thumbnailContainer.scrollTo({ left: 0, behavior: "instant" });
  }
  function render() {
    const item = images[current];
    mainImage.hidden = false;
    galleryButton.disabled = false;
    mainImage.src = item.src;
    mainImage.alt = item.alt;
    galleryButton.setAttribute("aria-label", "Ampliar: " + item.caption);
    caption.textContent = item.caption;
    count.textContent = (current + 1) + " / " + images.length;
    thumbnails.forEach((button, index) => button.setAttribute("aria-pressed", String(index === current)));
    const activeThumbnail = thumbnails[current];
    thumbnailContainer.scrollTo({
      left: Math.max(0, activeThumbnail.offsetLeft - thumbnailContainer.offsetLeft - (thumbnailContainer.clientWidth - activeThumbnail.offsetWidth) / 2),
      behavior: motionPreference.matches ? "auto" : "smooth"
    });
    if (lightbox.open) {
      largeImage.src = item.src;
      largeImage.alt = item.alt;
      document.getElementById("lightbox-caption").textContent =
        categoryNames[activeCategory] + " · " + item.caption + " · " + (current + 1) + " / " + images.length;
    }
    scheduleAutoplay();
  }
  function selectCategory(category) {
    if (!groups.has(category)) return;
    window.clearTimeout(autoplayTimer);
    activeCategory = category;
    images = groups.get(category);
    current = 0;
    categoryButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.galleryCategory === category));
    });
    galleryView.setAttribute("aria-label", categoryNames[category] + " del colegio " + name);
    categorySummary.textContent = categoryNames[category] + " · " + images.length + (images.length === 1 ? " vista del proyecto" : " vistas del proyecto");
    navigationButtons.forEach(button => { button.disabled = images.length < 2; });
    buildThumbnails();
    syncAutoplayButton();
    render();
  }
  function advance(direction) {
    current = (current + direction + images.length) % images.length;
    render();
  }

  categoryButtons.forEach(button => {
    const category = button.dataset.galleryCategory;
    const items = groups.get(category);
    button.hidden = !items;
    button.querySelector(".category-count").textContent = items ? String(items.length).padStart(2, "0") : "00";
    button.addEventListener("click", () => {
      if (category !== activeCategory) selectCategory(category);
    });
  });
  autoplayButton.addEventListener("click", () => {
    autoplayEnabled = !autoplayEnabled;
    syncAutoplayButton();
    scheduleAutoplay();
  });
  document.addEventListener("visibilitychange", scheduleAutoplay);
  gallery.addEventListener("focusin", event => {
    if (restoringGalleryFocus || event.target === autoplayButton || !event.target.matches(":focus-visible")) return;
    autoplayEnabled = false;
    syncAutoplayButton();
    scheduleAutoplay();
  });
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) autoplayEnabled = false;
    syncAutoplayButton();
    scheduleAutoplay();
  });
  if ("IntersectionObserver" in window) {
    const galleryObserver = new IntersectionObserver(entries => {
      galleryInView = entries[0].intersectionRatio >= 0.15;
      scheduleAutoplay();
    }, { threshold: [0, 0.15] });
    galleryObserver.observe(gallery);
  }
  mainImage.addEventListener("error", () => {
    mainImage.hidden = true;
    galleryButton.disabled = true;
    caption.textContent = "Esta imagen no está disponible. Selecciona otra vista del proyecto.";
  });
  document.getElementById("gallery-prev").addEventListener("click", () => advance(-1));
  document.getElementById("gallery-next").addEventListener("click", () => advance(1));
  document.querySelector(".lightbox-prev").addEventListener("click", () => advance(-1));
  document.querySelector(".lightbox-next").addEventListener("click", () => advance(1));
  galleryButton.addEventListener("click", () => {
    if (typeof lightbox.showModal !== "function") return;
    lightbox.showModal();
    document.body.classList.add("modal-open");
    render();
    document.querySelector(".lightbox-close").focus();
  });
  document.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    restoringGalleryFocus = true;
    galleryButton.focus();
    restoringGalleryFocus = false;
    largeImage.removeAttribute("src");
    scheduleAutoplay();
  });
  lightbox.addEventListener("click", event => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") { event.preventDefault(); advance(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); advance(1); }
  });
  let touchX = null;
  galleryButton.addEventListener("touchstart", event => { touchX = event.changedTouches[0].clientX; }, { passive: true });
  galleryButton.addEventListener("touchend", event => {
    if (touchX === null) return;
    const distance = event.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(distance) > 55) advance(distance < 0 ? 1 : -1);
  }, { passive: true });

  document.querySelector(".project-description>p:last-child").textContent =
    name + " forma parte de nuestro trabajo en arquitectura educativa. Explora sus exteriores e interiores a través de los renders del proyecto.";
  placeholder.hidden = true;
  gallery.hidden = false;
  selectCategory(activeCategory);
})();
