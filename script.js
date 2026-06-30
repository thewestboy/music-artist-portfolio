/* ============================================================
   THC ARIA — script.js
   ============================================================ */

/* ============================================================
   UTILS
   ============================================================ */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function fmtTime(s) {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

let toastTimer;
function showToast(msg, duration = 2800) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), duration);
}

/* ============================================================
   LOADER
   ============================================================ */
(function initLoader() {
  const fill = $("loaderFill");
  const loader = $("loader");
  if (!fill || !loader) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 18 + 6;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      fill.style.width = "100%";
      setTimeout(() => loader.classList.add("hidden"), 320);
    } else {
      fill.style.width = progress + "%";
    }
  }, 80);
})();

/* ============================================================
   AUDIO PLAYER
   ============================================================ */
const playlist = [
  { title: "RUN EVERY HEAT I DROPPED", sub: "Latest Drop · Single", src: "./images/va.mpeg" },
];

let currentTrack = 0;
let isDragging = false;

const audio        = $("audio");
const playBtn      = $("playBtn");
const iconPlay     = playBtn.querySelector(".icon-play");
const iconPause    = playBtn.querySelector(".icon-pause");
const progressFill = $("progressFill");
const progressBar  = $("progressBar");
const progressThumb = $("progressThumb");
const timeDisplay  = $("timeDisplay");
const trackTitle   = $("trackTitle");
const trackSub     = $("trackSub");
const muteBtn      = $("muteBtn");
const iconVol      = muteBtn.querySelector(".icon-vol");
const iconMute     = muteBtn.querySelector(".icon-mute");
const volSlider    = $("volSlider");

function setPlayState(playing) {
  iconPlay.style.display  = playing ? "none" : "";
  iconPause.style.display = playing ? "" : "none";
  playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
}

playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().catch(() => {});
    setPlayState(true);
  } else {
    audio.pause();
    setPlayState(false);
  }
});

$("prevBtn").addEventListener("click", () => {
  currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrack);
});

$("nextBtn").addEventListener("click", () => {
  currentTrack = (currentTrack + 1) % playlist.length;
  loadTrack(currentTrack);
});

function loadTrack(index) {
  const t = playlist[index];
  audio.src = t.src;
  trackTitle.textContent = t.title;
  trackSub.textContent = t.sub;
  audio.load();
  audio.play().catch(() => {});
  setPlayState(true);
  updateProgress(0);
}

function updateProgress(pct) {
  progressFill.style.width = pct + "%";
  progressThumb.style.left = pct + "%";
  progressBar.setAttribute("aria-valuenow", Math.round(pct));
}

audio.addEventListener("timeupdate", () => {
  if (!audio.duration || isDragging) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  updateProgress(pct);
  timeDisplay.textContent = `${fmtTime(audio.currentTime)} / ${fmtTime(audio.duration)}`;
});

audio.addEventListener("ended", () => {
  setPlayState(false);
  updateProgress(0);
  timeDisplay.textContent = `0:00 / ${fmtTime(audio.duration)}`;
});

audio.addEventListener("loadedmetadata", () => {
  timeDisplay.textContent = `0:00 / ${fmtTime(audio.duration)}`;
});

// Progress bar seek
function seekFromEvent(e) {
  if (!audio.duration) return;
  const rect = progressBar.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  audio.currentTime = ratio * audio.duration;
  updateProgress(ratio * 100);
}

progressBar.addEventListener("click", seekFromEvent);
progressBar.addEventListener("mousedown", (e) => { isDragging = true; seekFromEvent(e); });
document.addEventListener("mousemove", (e) => { if (isDragging) seekFromEvent(e); });
document.addEventListener("mouseup", () => { isDragging = false; });

// Touch support so the progress bar is draggable on mobile (not just click/hover)
progressBar.addEventListener("touchstart", (e) => { isDragging = true; seekFromEvent(e); }, { passive: true });
document.addEventListener("touchmove", (e) => { if (isDragging) seekFromEvent(e); }, { passive: true });
document.addEventListener("touchend", () => { isDragging = false; });

// Keyboard: seek via arrow keys on progress bar
progressBar.addEventListener("keydown", (e) => {
  if (!audio.duration) return;
  if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
  if (e.key === "ArrowLeft")  audio.currentTime = Math.max(0, audio.currentTime - 5);
});

// Volume
volSlider.addEventListener("input", () => {
  const v = volSlider.value / 100;
  audio.volume = v;
  updateMuteIcon(v === 0);
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  updateMuteIcon(audio.muted);
  if (!audio.muted && audio.volume === 0) {
    audio.volume = 0.5;
    volSlider.value = 50;
  }
});

function updateMuteIcon(muted) {
  iconVol.style.display  = muted ? "none" : "";
  iconMute.style.display = muted ? "" : "none";
  muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
}

// Set initial volume
audio.volume = volSlider.value / 100;

// Global keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.key === " ") {
    e.preventDefault();
    playBtn.click();
  }
  if (e.key === "m" || e.key === "M") muteBtn.click();
  if (e.key === "ArrowRight" && !e.target.closest(".player-bar")) {
    if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  }
  if (e.key === "ArrowLeft" && !e.target.closest(".player-bar")) {
    if (audio.duration) audio.currentTime = Math.max(0, audio.currentTime - 10);
  }
});

/* ============================================================
   ALBUM COVER 3D TILT
   ============================================================ */
const cover = $("albumCover");
if (cover) {
  cover.addEventListener("mousemove", (e) => {
    const r = cover.getBoundingClientRect();
    const rx = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * -12;
    const ry = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * 12;
    cover.style.transform = `perspective(380px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.04)`;
    cover.style.boxShadow = `${-ry * 0.5}px ${rx * 0.5}px 24px rgba(0,0,0,0.25)`;
  });

  cover.addEventListener("mouseleave", () => {
    cover.style.transform = "";
    cover.style.boxShadow = "";
  });
}

/* ============================================================
   STICKY HEADER
   ============================================================ */
const header = $("siteHeader");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 20);
}, { passive: true });

/* ============================================================
   MODAL SYSTEM
   ============================================================ */
let activeModal = null;
let previousFocus = null;

function openModal(backdropId) {
  if (activeModal) closeModal();
  previousFocus = document.activeElement;
  const bd = $(backdropId);
  bd.classList.add("open");
  bd.removeAttribute("aria-hidden");
  document.body.style.overflow = "hidden";
  activeModal = bd;

  // Focus trap: focus first focusable element
  requestAnimationFrame(() => {
    const focusable = bd.querySelectorAll(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  });
}

function closeModal() {
  if (!activeModal) return;
  activeModal.classList.remove("open");
  activeModal.setAttribute("aria-hidden", "true");
  activeModal = null;
  document.body.style.overflow = "";
  if (previousFocus) previousFocus.focus();
}

// Focus trap within open modal
document.addEventListener("keydown", (e) => {
  if (!activeModal) return;
  if (e.key === "Escape") { closeModal(); return; }

  if (e.key === "Tab") {
    const focusable = [...activeModal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )];
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }
});

// Nav triggers
$("navDownload").addEventListener("click", () => openModal("downloadBackdrop"));
$("navContact").addEventListener("click",  () => openModal("contactBackdrop"));
$("navHome").addEventListener("click", () => {
  $$(".nav-link").forEach(l => l.classList.remove("active"));
  $("navHome").classList.add("active");
  closeModal();
});

// Close buttons
$("downloadClose").addEventListener("click", closeModal);
$("contactClose").addEventListener("click",  closeModal);

// Backdrop click
$$(".modal-backdrop").forEach(bd => {
  bd.addEventListener("click", (e) => { if (e.target === bd) closeModal(); });
});

/* ============================================================
   DOWNLOAD — TRACK LIST
   ============================================================ */
const discography = [
  { title: "Run Every Heat I Dropped", date: "Mar 2026", duration: "3:48", type: "Single",  file: "./audio/run-every-heat.mp3" },
  { title: "Street Heat Vol. 1",        date: "Nov 2025", duration: "38:12", type: "Mixtape", file: "./audio/street-heat-vol1.zip" },
  { title: "Midnight Run",              date: "Aug 2025", duration: "4:22", type: "Single",  file: "./audio/midnight-run.mp3" },
  { title: "ARIA EP",                   date: "May 2025", duration: "18:04", type: "EP",      file: "./audio/aria-ep.zip" },
  { title: "West Side Story",           date: "Jan 2025", duration: "5:11", type: "Single",  file: "./audio/west-side-story.mp3" },
];

const trackList = $("trackList");

discography.forEach((t, i) => {
  const item = document.createElement("div");
  item.className = "track-item";
  const ext = (t.type === "Mixtape" || t.type === "EP") ? "ZIP" : "MP3";
  item.innerHTML = `
    <span class="track-num">${String(i + 1).padStart(2, "0")}</span>
    <div class="track-meta">
      <div class="track-name">${t.title}</div>
      <div class="track-details">${t.type} · ${t.date} · ${t.duration}</div>
    </div>
    <button class="dl-btn" data-index="${i}" data-file="${t.file}" data-title="${t.title}" data-ext="${ext}" aria-label="Download ${t.title}">${ext}</button>
  `;
  trackList.appendChild(item);
});

trackList.addEventListener("click", (e) => {
  const btn = e.target.closest(".dl-btn");
  if (!btn || btn.classList.contains("loading")) return;

  const { file, title, ext } = btn.dataset;

  // Attempt real download via <a> tag
  btn.textContent = "…";
  btn.classList.add("loading");

  // Create a hidden anchor and trigger download
  const a = document.createElement("a");
  a.href = file;
  a.download = `${title}.${ext.toLowerCase()}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    btn.textContent = "✓";
    btn.classList.remove("loading");
    btn.classList.add("done");
    showToast(`Downloading "${title}"`);
    setTimeout(() => {
      btn.textContent = ext;
      btn.classList.remove("done");
    }, 2600);
  }, 800);
});

/* ============================================================
   CONTACT FORM
   ============================================================ */
const contactForm = $("contactForm");
const sendBtn     = $("sendBtn");

function validateEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function setFieldError(inputId, errId, isError) {
  const input = $(inputId);
  const err   = $(errId);
  input.classList.toggle("error", isError);
  err.classList.toggle("visible", isError);
  input.setAttribute("aria-invalid", isError ? "true" : "false");
  return !isError;
}

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name  = $("cf-name").value.trim();
  const email = $("cf-email").value.trim();
  const msg   = $("cf-msg").value.trim();

  const v1 = setFieldError("cf-name",  "err-name",  name.length === 0);
  const v2 = setFieldError("cf-email", "err-email", !validateEmail(email));
  const v3 = setFieldError("cf-msg",   "err-msg",   msg.length === 0);

  if (!v1 || !v2 || !v3) return;

  sendBtn.textContent = "Sending…";
  sendBtn.disabled = true;

  // Simulate send (replace with EmailJS / backend)
  await new Promise(r => setTimeout(r, 1000));

  contactForm.reset();
  sendBtn.textContent = "Send It ✦";
  sendBtn.disabled = false;
  $("successMsg").classList.add("visible");
  setTimeout(() => $("successMsg").classList.remove("visible"), 5000);
});

// Clear field errors on input
["cf-name", "cf-email", "cf-msg"].forEach(id => {
  $(id).addEventListener("input", () => {
    $(id).classList.remove("error");
    $(id).removeAttribute("aria-invalid");
  });
});
