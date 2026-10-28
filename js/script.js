(function ($) {
  $(function () {
    const MINIMUM_DIGITS = 6;
    const ORIGINAL_TITLE = document.title;
    const $clock = $(".js-flipclock");
    const overlay = document.querySelector(".timer-complete-overlay");
    const presetBar = document.querySelector(".preset-times");
    const themeSwitch = document.getElementById("theme-switch");

    let flipClock = null;
    let mode = "idle"; // 'idle' | 'countdown' | 'clock'
    let endTime = 0;
    let wakeLock = null;
    let worker = null;
    let fallbackTimeout = null;
    let beepTimer = null;
    let audioCtx = null;
    let audioUnlocked = false;

    /* ---------- Responsive fit (continuous, never clips) ---------- */
    const MAX_SCALE = 3.5; // raise for bigger digits on large screens
    const MIN_SCALE = 0.3;
    const TOP_RESERVE = 72; // space for the theme toggle
    const SIDE_MARGIN = 0.04; // fraction of viewport width kept free each side
    const GAP_ABOVE_BAR = 16;
    const supportsZoom = !!(
      window.CSS &&
      CSS.supports &&
      CSS.supports("zoom", "1")
    );
    let fitQueued = false;

    function fitClock() {
      const wrap =
        document.querySelector(".js-flipclock .flip-clock-wrapper") ||
        document.querySelector(".js-flipclock");
      if (!wrap) return;

      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const barTop = presetBar.getBoundingClientRect().top;

      // Tell CSS how much bottom room to keep
      document.documentElement.style.setProperty(
        "--bottom-reserve",
        Math.ceil(vh - barTop + GAP_ABOVE_BAR) + "px",
      );

      // Measure natural (unscaled) size
      wrap.style.zoom = "1";
      wrap.style.transform = "none";
      const rect = wrap.getBoundingClientRect();
      const natW = rect.width;
      const natH = rect.height;
      if (!natW || !natH) return;

      const availW = vw * (1 - SIDE_MARGIN * 2);
      const availH = barTop - GAP_ABOVE_BAR - TOP_RESERVE;

      let scale = Math.min(MAX_SCALE, availW / natW, availH / natH);
      scale = Math.max(MIN_SCALE, Math.round(scale * 1000) / 1000);

      if (supportsZoom) {
        wrap.style.zoom = String(scale); // re-lays out at full resolution: stays sharp
      } else {
        wrap.style.transform = "scale(" + scale + ")"; // fallback for old browsers
        wrap.style.transformOrigin = "center center";
      }
    }

    function queueFit() {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(() => {
        fitQueued = false;
        fitClock();
      });
    }

    window.addEventListener("resize", queueFit);
    window.addEventListener("orientationchange", queueFit);
    window.addEventListener("load", queueFit);
    if (window.visualViewport)
      window.visualViewport.addEventListener("resize", queueFit);
    if (window.ResizeObserver) new ResizeObserver(queueFit).observe(presetBar);

    /* ---------- Audio ---------- */
    const sounds = ["sounds/timer-bell.mp3", "sounds/alarm-clock.mp3"].map(
      (src) => {
        const a = new Audio(src);
        a.preload = "auto";
        a.loop = true;
        a.addEventListener("error", () =>
          console.warn("Audio failed to load:", src, a.error),
        );
        return a;
      },
    );

    // Must run inside a user gesture so iOS/Safari allow playback later
    function unlockAudio() {
      if (audioUnlocked) return;
      audioUnlocked = true;
      sounds.forEach((a) => {
        a.muted = true;
        const p = a.play();
        if (p && p.then) {
          p.then(() => {
            a.pause();
            a.currentTime = 0;
            a.muted = false;
          }).catch(() => {
            a.muted = false;
            audioUnlocked = false;
          });
        }
      });
      try {
        audioCtx =
          audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
      } catch (e) {
        /* ignore */
      }
    }

    function beepFallback() {
      try {
        audioCtx =
          audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const beep = () => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.frequency.value = 880;
          g.gain.value = 0.2;
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start();
          o.stop(audioCtx.currentTime + 0.25);
        };
        beep();
        beepTimer = setInterval(beep, 700);
      } catch (e) {
        console.warn("No audio available:", e);
      }
    }

    async function playSound() {
      for (const a of sounds) {
        try {
          a.currentTime = 0;
          a.muted = false;
          await a.play();
          return;
        } catch (err) {
          console.warn("Playback failed for", a.src, err);
        }
      }
      beepFallback();
    }

    function stopSound() {
      sounds.forEach((a) => {
        a.pause();
        a.currentTime = 0;
      });
      clearInterval(beepTimer);
      beepTimer = null;
    }

    /* ---------- Wake Lock ---------- */
    async function requestWakeLock() {
      if (!("wakeLock" in navigator) || wakeLock) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        wakeLock = lock;
        lock.addEventListener("release", () => {
          if (wakeLock === lock) wakeLock = null;
        });
      } catch (err) {
        console.log("Wake Lock error: " + err.name + ", " + err.message);
      }
    }

    async function releaseWakeLock() {
      const lock = wakeLock;
      wakeLock = null;
      if (lock) {
        try {
          await lock.release();
        } catch (err) {
          /* already released */
        }
      }
    }

    /* ---------- Background-safe completion (worker + deadline) ---------- */
    function stopWatchdogs() {
      if (worker) {
        try {
          worker.postMessage({ command: "stop" });
          worker.terminate();
        } catch (e) {}
        worker = null;
      }
      clearTimeout(fallbackTimeout);
      fallbackTimeout = null;
    }

    function startWatchdogs(seconds) {
      stopWatchdogs();
      const useTimeout = () => {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = setTimeout(
          finishCountdown,
          Math.max(0, endTime - Date.now()),
        );
      };
      try {
        worker = new Worker("js/timer.worker.js");
        worker.onmessage = (e) => {
          if (e.data && e.data.type === "complete") finishCountdown();
        };
        worker.onerror = () => {
          worker = null;
          useTimeout();
        };
        worker.postMessage({ command: "start", duration: seconds });
      } catch (err) {
        worker = null;
        useTimeout();
      }
    }

    /* ---------- Overlay ---------- */
    function showOverlay() {
      if (overlay.classList.contains("show")) return;
      overlay.classList.add("show");
      document.title = "Time's Up! \u2022 " + ORIGINAL_TITLE;
      playSound();
    }

    function hideOverlay(resetClock) {
      stopSound();
      document.title = ORIGINAL_TITLE;
      if (overlay.classList.contains("show")) {
        overlay.classList.remove("show");
        if (resetClock) initEmptyClock();
      }
    }

    /* ---------- Clock ---------- */
    function getCurrentTimeInSeconds() {
      const now = new Date();
      return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    }

    function buildClock(startSeconds, opts) {
      if (flipClock) {
        try {
          flipClock.stop();
        } catch (e) {}
      }
      $clock.empty();
      flipClock = $clock.FlipClock(
        startSeconds,
        Object.assign(
          {
            clockFace: "HourlyCounter",
            minimumDigits: MINIMUM_DIGITS,
          },
          opts,
        ),
      );
      fitClock();
    }

    function initEmptyClock() {
      stopWatchdogs();
      mode = "idle";
      buildClock(0, { countdown: true, autoStart: false });
      releaseWakeLock();
      $(".preset-btn").removeClass("active");
    }

    function finishCountdown() {
      if (mode !== "countdown") return; // idempotent
      mode = "idle";
      stopWatchdogs();
      if (flipClock) {
        try {
          flipClock.stop();
        } catch (e) {}
      }
      releaseWakeLock();
      showOverlay();
    }

    function startCountdown(seconds) {
      hideOverlay(false);
      endTime = Date.now() + seconds * 1000;
      mode = "countdown";
      buildClock(seconds, {
        countdown: true,
        autoStart: true,
        callbacks: {
          interval: function () {
            try {
              if (this.factory.getTime().time <= 0) finishCountdown();
            } catch (e) {}
          },
        },
      });
      startWatchdogs(seconds);
      requestWakeLock();
    }

    function startCurrentTime() {
      hideOverlay(false);
      stopWatchdogs();
      releaseWakeLock();
      mode = "clock";
      buildClock(getCurrentTimeInSeconds(), {
        countdown: false,
        autoStart: true,
        callbacks: {
          interval: function () {
            try {
              this.factory.setTime(getCurrentTimeInSeconds());
            } catch (e) {}
          },
        },
      });
    }

    /* ---------- Events ---------- */
    overlay.addEventListener("click", () => hideOverlay(true));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("show"))
        hideOverlay(true);
    });

    $(".preset-times").on("click", ".preset-btn", function () {
      unlockAudio();
      const seconds = parseInt($(this).data("seconds"), 10);
      if (!isNaN(seconds) && seconds > 0) startCountdown(seconds);
      else if (this.id === "current-time-btn") startCurrentTime();
      else return;
      $(".preset-btn").removeClass("active");
      $(this).addClass("active");
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        if (mode === "countdown") {
          const remaining = Math.ceil((endTime - Date.now()) / 1000);
          if (remaining <= 0) finishCountdown();
          else {
            try {
              flipClock.setTime(remaining);
            } catch (e) {}
            requestWakeLock();
          }
        }
      } else {
        releaseWakeLock();
      }
    });

    /* ---------- Theme ---------- */
    function safeGet(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    }
    function safeSet(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      themeSwitch.checked = theme === "dark";
    }

    themeSwitch.addEventListener("change", (e) => {
      const theme = e.target.checked ? "dark" : "light";
      applyTheme(theme);
      safeSet("theme", theme);
    });

    applyTheme(
      safeGet("theme") ||
        (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"),
    );

    initEmptyClock();
  });
})(jQuery);
