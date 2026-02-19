const grid = document.getElementById("grid");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalPrimary = document.getElementById("modalPrimary");
const modalRefs = document.getElementById("modalRefs");
const modalDesc = document.getElementById("modalDesc");
const searchInput = document.getElementById("search");

// --- Music ---
const bgm = document.getElementById("bgm");
bgm.volume = 0.15; // 0.0 to 1.0

const musicBtn = document.getElementById("musicBtn");

let musicOn = false;

function updateMusicUI() {
  musicBtn.textContent = musicOn ? "⏸ Pause" : "▶ Play";
  musicBtn.setAttribute("aria-pressed", String(musicOn));
}

const teemo = document.getElementById("teemo");

async function toggleMusic() {
  try {
    if (!musicOn) {
      await bgm.play();
      musicOn = true;
      bgm.volume = 0.12;
      localStorage.setItem("musicOn", "true");
      teemo.classList.add("active");
    } else {
      bgm.pause();
      musicOn = false;
      localStorage.setItem("musicOn", "false");
      teemo.classList.remove("active");
    }
    updateMusicUI();
  } catch (err) {
    console.log(err);
  }
}


if (musicBtn && bgm) {
  // Restore previous preference
  musicOn = localStorage.getItem("musicOn") === "true";
  updateMusicUI();

  // Do NOT autoplay immediately (often blocked).
  // If they previously had it on, we can try once after a click anywhere.
  if (musicOn) {
	teemo.classList.add("active");
    const oneTime = async () => {
      try { await bgm.play(); } catch {}
      document.removeEventListener("click", oneTime);
    };
    document.addEventListener("click", oneTime, { once: true });
  }

  musicBtn.addEventListener("click", toggleMusic);
}

let ALL = [];
let activeCategory = "all";
let searchTerm = "";

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function prettyCategory(cat) {
  return ({
    "clothing": "Clothing",
    "tote-bags": "Tote Bags",
    "non-glass": "Non-Glass",
    "glass": "Glass"
  })[cat] || cat;
}

function matches(piece) {
  const inCat = activeCategory === "all" || piece.category === activeCategory;
  if (!inCat) return false;

  const hay = [
    piece.title,
    piece.year,
    piece.medium,
    piece.size,
    ...(piece.tags || [])
  ].join(" ").toLowerCase();

  return hay.includes(searchTerm);
}

function renderGrid() {
  const pieces = ALL.filter(matches);

  if (pieces.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; color: rgba(15,26,16,.7); padding: 16px 2px; font-weight:800;">
      No matches. Try a different search or category.
    </div>`;
    return;
  }

  grid.innerHTML = pieces.map(p => {
    const badge = prettyCategory(p.category);
    return `
      <article class="card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="Open ${escapeHtml(p.title)}">
        <div class="thumb">
          <img src="${escapeHtml(p.thumbnail)}" alt="${escapeHtml(p.title)}" loading="lazy" />
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(p.title)}</h3>
          <div class="badge">${escapeHtml(badge)}</div>
        </div>
      </article>
    `;
  }).join("");
}

function primaryCard(item) {
  return `
    <div class="piece-card">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label || "image")}" loading="lazy" />
      <div class="piece-label">${escapeHtml(item.label || "")}</div>
    </div>
  `;
}

function refCard(item) {
  return `
    <div class="ref-card">
      <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label || "reference")}" loading="lazy" />
    </div>
  `;
}

function openModal(piece) {
  modalTitle.textContent = piece.title || "";

  // Match your reference: centered multiline details
  const metaLines = [
    piece.title ? `${piece.title}${piece.year ? `, ${piece.year}` : ""}` : "",
    piece.size || "",
    piece.medium || ""
  ].filter(Boolean);

  modalMeta.innerHTML = metaLines.map(escapeHtml).join("<br>");
  modalDesc.textContent = piece.description || "";

  modalPrimary.innerHTML = (piece.primary || []).map(primaryCard).join("");

  modalRefs.innerHTML = (piece.references || []).length
    ? (piece.references || []).map(refCard).join("")
    : `<div style="grid-column:1/-1;color:rgba(15,26,16,.65);padding:10px 2px;font-weight:800;">No references added.</div>`;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function wireEvents() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeCategory = btn.dataset.category;
      renderGrid();
    });
  });

  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderGrid();
  });

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const piece = ALL.find(p => p.id === card.dataset.id);
    if (piece) openModal(piece);
  });

  grid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".card");
    if (!card) return;
    e.preventDefault();
    const piece = ALL.find(p => p.id === card.dataset.id);
    if (piece) openModal(piece);
  });

  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close === "true") closeModal();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
}

async function init() {
  const res = await fetch("gallery.json", { cache: "no-store" });
  const data = await res.json();
  ALL = data.pieces || [];
  wireEvents();
  renderGrid();
}

init();
