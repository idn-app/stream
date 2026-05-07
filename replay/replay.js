const state = {
    allReplays: [],
    filteredReplays: [],
    currentReplay: null,
    isSeeking: false,
    guardLocked: false,
};

const elements = {
    replayPlayer: document.getElementById("replayPlayer"),
    replayList: document.getElementById("replayList"),
    searchInput: document.getElementById("searchInput"),
    replayTitle: document.getElementById("replayTitle"),
    replayDate: document.getElementById("replayDate"),
    playerStatus: document.getElementById("playerStatus"),
    playPauseButton: document.getElementById("playPauseButton"),
    muteButton: document.getElementById("muteButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    overlayPlayButton: document.getElementById("overlayPlayButton"),
    playerOverlay: document.getElementById("playerOverlay"),
    currentTime: document.getElementById("currentTime"),
    duration: document.getElementById("duration"),
    progressBar: document.getElementById("progressBar"),
    pageGuard: document.getElementById("pageGuard"),
    pageGuardTitle: document.getElementById("pageGuardTitle"),
    pageGuardMessage: document.getElementById("pageGuardMessage"),
};

function slugify(value) {
    return String(value || "replay")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "replay";
}

function buildReplayId(replay, index) {
    if (replay.id) {
        return slugify(replay.id);
    }

    return `${slugify(replay.judul)}-${slugify(replay.tanggal)}-${index + 1}`;
}

function normalizeReplayLink(rawUrl) {
    if (!rawUrl) {
        return rawUrl;
    }

    try {
        const parsed = new URL(rawUrl);
        const host = parsed.hostname.replace(/^www\./, "");

        if (host === "youtu.be") {
            const videoId = parsed.pathname.replace("/", "").trim();
            return videoId ? `youtube/${videoId}` : rawUrl;
        }

        if (host === "youtube.com" || host === "m.youtube.com") {
            const watchId = parsed.searchParams.get("v");
            if (watchId) {
                return `youtube/${watchId}`;
            }

            const liveMatch = parsed.pathname.match(/^\/live\/([^/?]+)/);
            if (liveMatch) {
                return `youtube/${liveMatch[1]}`;
            }

            const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/);
            if (embedMatch) {
                return `youtube/${embedMatch[1]}`;
            }

            const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
            if (shortsMatch) {
                return `youtube/${shortsMatch[1]}`;
            }
        }

        return parsed.toString();
    } catch (error) {
        return rawUrl;
    }
}

function lockPage(title, message) {
    if (state.guardLocked) {
        return;
    }

    state.guardLocked = true;
    elements.pageGuardTitle.textContent = title;
    elements.pageGuardMessage.textContent = message;
    elements.pageGuard.classList.remove("hidden");
    elements.playerStatus.textContent = title;

    try {
        elements.replayPlayer.pause();
    } catch (error) {
    }
}

function isEditableTarget(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
}

function setupPageProtection() {
    const blockedKeys = new Set(["F12", "F3"]);
    const blockedCombos = new Set(["A", "C", "I", "J", "K", "P", "S", "U"]);

    const blockInteraction = (event, shouldLock = false, title = "Akses dibatasi", message = "Interaksi ini tidak diizinkan pada halaman replay.") => {
        if (isEditableTarget(event.target) && !["P", "S", "U"].includes(String(event.key || "").toUpperCase())) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();

        if (shouldLock) {
            lockPage(title, message);
        }
    };

    window.addEventListener("contextmenu", (event) => blockInteraction(event), true);
    window.addEventListener("auxclick", (event) => blockInteraction(event), true);
    window.addEventListener("dragstart", (event) => blockInteraction(event), true);
    window.addEventListener("copy", (event) => blockInteraction(event), true);
    window.addEventListener("cut", (event) => blockInteraction(event), true);
    window.addEventListener("paste", (event) => blockInteraction(event), true);
    window.addEventListener("selectstart", (event) => blockInteraction(event), true);
    window.addEventListener("mousedown", (event) => {
        if (event.button === 1 || event.button === 2) {
            blockInteraction(event);
        }
    }, true);

    const keyHandler = (event) => {
        const key = String(event.key || "").toUpperCase();
        const ctrlOrMeta = event.ctrlKey || event.metaKey;
        const blocked = blockedKeys.has(key) || (ctrlOrMeta && blockedCombos.has(key));

        if (!blocked) {
            return;
        }

        blockInteraction(
            event,
            true,
            "Proteksi aktif",
            "Shortcut developer tools atau source view terdeteksi. Muat ulang halaman untuk membuka kembali replay."
        );
    };

    window.addEventListener("keydown", keyHandler, true);
    window.addEventListener("keypress", keyHandler, true);
    window.addEventListener("keyup", keyHandler, true);

    window.addEventListener("beforeprint", () => {
        lockPage("Print diblokir", "Fitur print tidak tersedia pada halaman replay.");
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && !elements.replayPlayer.paused) {
            elements.replayPlayer.pause().catch?.(() => {});
        }
    });

    let devtoolsTriggered = false;
    const detectDevtools = () => {
        if (devtoolsTriggered || state.guardLocked) {
            return;
        }

        const widthGap = window.outerWidth - window.innerWidth;
        const heightGap = window.outerHeight - window.innerHeight;
        const debuggerStart = performance.now();
        debugger;
        const debuggerDelay = performance.now() - debuggerStart;

        if (widthGap > 160 || heightGap > 160 || debuggerDelay > 150) {
            devtoolsTriggered = true;
            lockPage(
                "Developer tools terdeteksi",
                "Pemutaran dihentikan karena developer tools atau panel inspeksi terdeteksi terbuka."
            );
        }
    };

    window.setInterval(detectDevtools, 1000);
}

function parseReplayDate(dateString) {
    if (!dateString) {
        return 0;
    }

    const normalized = String(dateString)
        .toLowerCase()
        .replace(/,/g, " ")
        .replace(/\|/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const monthMap = {
        jan: 0,
        januari: 0,
        feb: 1,
        februari: 1,
        mar: 2,
        maret: 2,
        apr: 3,
        april: 3,
        mei: 4,
        may: 4,
        jun: 5,
        juni: 5,
        jul: 6,
        juli: 6,
        ags: 7,
        agu: 7,
        agustus: 7,
        aug: 7,
        sep: 8,
        sept: 8,
        september: 8,
        okt: 9,
        oktober: 9,
        oct: 9,
        nov: 10,
        november: 10,
        des: 11,
        desember: 11,
        dec: 11,
    };

    const monthPattern = Object.keys(monthMap).join("|");
    const match = normalized.match(new RegExp(`(\\d{1,2})\\s+(${monthPattern})\\s+(\\d{4})`));
    if (!match) {
        const nativeParsed = Date.parse(dateString);
        return Number.isNaN(nativeParsed) ? 0 : nativeParsed;
    }

    const day = Number(match[1]);
    const month = monthMap[match[2]];
    const year = Number(match[3]);
    return new Date(year, month, day).getTime();
}
function formatDuration(totalSeconds) {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
        return "00:00";
    }

    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor((totalSeconds / 60) % 60);
    const hours = Math.floor(totalSeconds / 3600);

    if (hours > 0) {
        return [hours, minutes, seconds].map((value, index) => String(value).padStart(index === 0 ? 1 : 2, "0")).join(":");
    }

    return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatDate(dateString) {
    if (!dateString) {
        return "Tanggal belum diisi";
    }

    const parsedDate = new Date(dateString);
    if (Number.isNaN(parsedDate.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(parsedDate);
}

function updateProgressUI(current, duration) {
    elements.currentTime.textContent = formatDuration(current);
    elements.duration.textContent = formatDuration(duration);

    const progress = duration > 0 ? (current / duration) * 100 : 0;
    if (!state.isSeeking) {
        elements.progressBar.value = progress;
    }
    elements.progressBar.style.setProperty("--progress", `${progress}%`);
}

function setPlayButtonState(isPlaying) {
    elements.playPauseButton.innerHTML = `<i class="fa-solid fa-${isPlaying ? "pause" : "play"}"></i>`;
    elements.overlayPlayButton.innerHTML = `<i class="fa-solid fa-${isPlaying ? "pause" : "play"}"></i>`;
    elements.playerOverlay.classList.toggle("hidden", isPlaying);
    if (!state.guardLocked) {
        elements.playerStatus.textContent = isPlaying ? "Now Playing" : "Replay Paused";
    }
}

function setMuteButtonState(isMuted) {
    elements.muteButton.innerHTML = `<i class="fa-solid fa-volume-${isMuted ? "xmark" : "high"}"></i>`;
}

function renderList() {
    if (!state.filteredReplays.length) {
        elements.replayList.innerHTML = `
            <div class="empty-state rounded-2xl p-5 text-center text-gray-400">
                Tidak ada replay yang cocok.
            </div>
        `;
        return;
    }

    elements.replayList.innerHTML = state.filteredReplays.map((replay, index) => `
        <article class="replay-card ${state.currentReplay && state.currentReplay.id === replay.id ? "active" : ""} rounded-2xl p-4">
            <button type="button" data-index="${index}" class="space-y-2">
                <div class="flex items-center justify-between gap-3">
                    <span class="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-red-400 font-bold">
                        Archive
                    </span>
                    <span class="text-xs text-gray-500">${formatDate(replay.tanggal)}</span>
                </div>
                <h3 class="text-white font-bold leading-snug">${replay.judul || "Tanpa judul"}</h3>
            </button>
        </article>
    `).join("");

    elements.replayList.querySelectorAll("button[data-index]").forEach((button) => {
        button.addEventListener("click", () => {
            if (state.guardLocked) {
                return;
            }
            const replay = state.filteredReplays[Number(button.dataset.index)];
            if (replay) {
                window.location.hash = encodeURIComponent(replay.id);
            }
        });
    });
}

function applySearch() {
    const keyword = elements.searchInput.value.trim().toLowerCase();
    state.filteredReplays = !keyword
        ? [...state.allReplays]
        : state.allReplays.filter((replay) => {
            return [replay.judul, replay.tanggal, replay.id]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(keyword));
        });

    renderList();
}

function updateReplayMeta(replay) {
    state.currentReplay = replay;
    elements.replayTitle.textContent = replay.judul || "Tanpa judul";
    elements.replayDate.textContent = formatDate(replay.tanggal);
    renderList();
}

async function loadReplayIntoPlayer(replay) {
    if (state.guardLocked) {
        return;
    }

    updateReplayMeta(replay);
    elements.playerStatus.textContent = "Memuat replay...";

    elements.replayPlayer.src = normalizeReplayLink(replay.link);
    elements.replayPlayer.title = replay.judul || "Replay";
    elements.replayPlayer.poster = "";
    updateProgressUI(0, 0);
    setPlayButtonState(false);

    try {
        await elements.replayPlayer.pause();
    } catch (error) {
    }
}

function syncFromHash() {
    if (!state.allReplays.length || state.guardLocked) {
        return;
    }

    const hashValue = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : "";
    const nextReplay = state.allReplays.find((item) => item.id === hashValue) || state.allReplays[0];
    if (!state.currentReplay || state.currentReplay.id !== nextReplay.id) {
        loadReplayIntoPlayer(nextReplay);
        if (!hashValue) {
            window.location.hash = encodeURIComponent(nextReplay.id);
        }
    }
}

async function togglePlayback() {
    if (state.guardLocked) {
        return;
    }

    try {
        if (elements.replayPlayer.paused) {
            await elements.replayPlayer.play();
            setPlayButtonState(true);
        } else {
            await elements.replayPlayer.pause();
            setPlayButtonState(false);
        }
    } catch (error) {
        elements.playerStatus.textContent = "Replay belum siap diputar";
    }
}

function toggleMute() {
    if (state.guardLocked) {
        return;
    }

    elements.replayPlayer.muted = !elements.replayPlayer.muted;
    setMuteButtonState(elements.replayPlayer.muted);
}

async function loadReplays() {
    const response = await fetch("./replays.json", { cache: "no-store" });
    const data = await response.json();
    state.allReplays = Array.isArray(data)
        ? data.filter((item) => item && item.link).map((item, index) => ({
            ...item,
            id: buildReplayId(item, index),
        })).sort((a, b) => parseReplayDate(b.tanggal) - parseReplayDate(a.tanggal))
        : [];

    if (!state.allReplays.length) {
        state.filteredReplays = [];
        renderList();
        elements.playerStatus.textContent = "Belum ada replay";
        return;
    }

    applySearch();
    syncFromHash();
}

function bindPlayerEvents() {
    elements.replayPlayer.addEventListener("can-play", () => {
        if (state.guardLocked) {
            return;
        }
        elements.playerStatus.textContent = "Replay Ready";
        updateProgressUI(elements.replayPlayer.currentTime || 0, elements.replayPlayer.duration || 0);
    });

    elements.replayPlayer.addEventListener("play", () => {
        setPlayButtonState(true);
    });

    elements.replayPlayer.addEventListener("pause", () => {
        setPlayButtonState(false);
    });

    elements.replayPlayer.addEventListener("ended", () => {
        setPlayButtonState(false);
        updateProgressUI(0, elements.replayPlayer.duration || 0);
    });

    elements.replayPlayer.addEventListener("volume-change", () => {
        setMuteButtonState(Boolean(elements.replayPlayer.muted));
    });
}

function bindUiEvents() {
    elements.searchInput.addEventListener("input", applySearch);
    elements.playPauseButton.addEventListener("click", togglePlayback);
    elements.overlayPlayButton.addEventListener("click", togglePlayback);
    elements.muteButton.addEventListener("click", toggleMute);
    elements.fullscreenButton.addEventListener("click", async () => {
        if (state.guardLocked) {
            return;
        }
        const container = document.querySelector(".player-shell");
        if (!document.fullscreenElement) {
            await container.requestFullscreen?.();
            return;
        }
        await document.exitFullscreen?.();
    });

    elements.progressBar.addEventListener("input", () => {
        if (state.guardLocked) {
            return;
        }
        state.isSeeking = true;
        const duration = Number(elements.replayPlayer.duration) || 0;
        const nextTime = (Number(elements.progressBar.value) / 100) * duration;
        updateProgressUI(nextTime, duration);
    });

    elements.progressBar.addEventListener("change", () => {
        if (state.guardLocked) {
            return;
        }
        const duration = Number(elements.replayPlayer.duration) || 0;
        const nextTime = (Number(elements.progressBar.value) / 100) * duration;
        elements.replayPlayer.currentTime = nextTime;
        state.isSeeking = false;
    });

    window.addEventListener("hashchange", syncFromHash);
}

function startTicker() {
    window.setInterval(() => {
        const currentTime = Number(elements.replayPlayer.currentTime) || 0;
        const duration = Number(elements.replayPlayer.duration) || 0;
        updateProgressUI(currentTime, duration);
    }, 500);
}

async function init() {
    setupPageProtection();
    bindPlayerEvents();
    bindUiEvents();
    setMuteButtonState(false);
    updateProgressUI(0, 0);
    await loadReplays();
    startTicker();
}

init().catch(() => {
    elements.playerStatus.textContent = "Gagal memuat replay";
    elements.replayList.innerHTML = `
        <div class="empty-state rounded-2xl p-5 text-center text-gray-400">
            File JSON replay gagal dimuat.
        </div>
    `;
});

