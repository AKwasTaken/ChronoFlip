(function ($) {
  $(function () {
    // Initialize variables
    let flipClock;
    let clockTimer;
    let wakeLock = null;
    let activeTimer = null;
    let timerWorker = null;

    // Initialize audio with preload
    const audio = new Audio('sounds/timer-bell.mp3');
    const backupAudio = new Audio('sounds/alarm-clock.mp3');
    [audio, backupAudio].forEach(sound => {
      sound.preload = 'auto';
      sound.volume = 1.0;
    });

    // Initialize Web Worker
    function initWorker() {
      if (typeof Worker !== 'undefined') {
        try {
          timerWorker = new Worker('js/timer.worker.js');
          
          timerWorker.onmessage = function(e) {
            if (e.data.type === 'tick') {
              if (flipClock && activeTimer === flipClock) {
                flipClock.setTime(e.data.remaining);
              }
            }
            if (e.data.type === 'complete') {
              if (flipClock && activeTimer === flipClock) {
                flipClock.setTime(0);
                setTimeout(() => {
                  showOverlay();
                }, 600);
              }
            }
          };
        } catch (error) {
          console.log('Worker initialization failed:', error);
        }
      }
    }

    // Wake Lock functions
    async function requestWakeLock() {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.log(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    }

    async function releaseWakeLock() {
      if (wakeLock) {
        try {
          await wakeLock.release();
          wakeLock = null;
        } catch (err) {
          console.log(`Wake Lock release error: ${err.name}, ${err.message}`);
        }
      }
    }

    // Sound functions
    async function playSound() {
      try {
        audio.currentTime = 0;
        audio.loop = true;
        await audio.play();
      } catch (error) {
        try {
          backupAudio.currentTime = 0;
          backupAudio.loop = true;
          await backupAudio.play();
        } catch (backupError) {
          console.log('Sound playback failed:', backupError);
        }
      }
    }

    // Overlay functions
    function showOverlay() {
      const overlay = document.querySelector('.timer-complete-overlay');
      if (overlay) {
        overlay.classList.add('show');
        playSound().catch(console.log);
      }
    }

    function hideOverlay() {
      const overlay = document.querySelector('.timer-complete-overlay');
      if (overlay) {
        overlay.classList.remove('show');
        [audio, backupAudio].forEach(sound => {
          sound.pause();
          sound.currentTime = 0;
        });
        if (timerWorker) {
          timerWorker.postMessage({ command: 'stop' });
        }
        if (activeTimer) {
          activeTimer.stop();
        }
        if (clockTimer) {
          clearTimeout(clockTimer);
        }
        initEmptyClock();
      }
    }

    // Clock functions
    function getCurrentTimeInSeconds() {
      const now = new Date();
      return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    }

    function initEmptyClock() {
      if (flipClock) {
        if (clockTimer) {
          clearTimeout(clockTimer);
        }
        flipClock.stop();
        $('.js-flipclock').html('');
      }
      
      flipClock = $('.js-flipclock').FlipClock(0, {
        clockFace: 'HourlyCounter',
        countdown: true,
        autoStart: false,
        minimumDigits: 6
      });
    }

    function startCurrentTime() {
      if (activeTimer) {
        activeTimer.stop();
      }
      
      $('.js-flipclock').html('');

      const currentSeconds = getCurrentTimeInSeconds();
      
      flipClock = $('.js-flipclock').FlipClock(currentSeconds, {
        clockFace: 'HourlyCounter',
        autoStart: true,
        countdown: false,
        minimumDigits: 6,
        callbacks: {
          interval: function() {
            const newTime = getCurrentTimeInSeconds();
            this.factory.setTime(newTime);
          }
        }
      });

      activeTimer = flipClock;
    }

    function startCountdown(timeInSeconds) {
      if (activeTimer) {
        activeTimer.stop();
      }
      
      $('.js-flipclock').html('');

      requestWakeLock();

      flipClock = $('.js-flipclock').FlipClock(timeInSeconds, {
        clockFace: 'HourlyCounter',
        countdown: true,
        autoStart: false,
        minimumDigits: 6
      });

      activeTimer = flipClock;
      
      // Start the worker
      if (timerWorker) {
        timerWorker.postMessage({
          command: 'start',
          duration: timeInSeconds
        });
      }
    }

    // Event Listeners
    document.addEventListener('click', function() {
      if (document.querySelector('.timer-complete-overlay').classList.contains('show')) {
        hideOverlay();
      }
    });

    $('.preset-times').on('click', '.preset-btn', function() {
      const seconds = parseInt($(this).data('seconds'));
      if (isNaN(seconds)) {
        if (this.id === 'current-time-btn') {
          $('.preset-btn').removeClass('active');
          $(this).addClass('active');
          startCurrentTime();
        }
        return;
      }
      $('.preset-btn').removeClass('active');
      $(this).addClass('active');
      startCountdown(seconds);
    });

    // Theme handling
    const themeSwitch = document.getElementById('theme-switch');
    const html = document.documentElement;
    
    function toggleTheme(e) {
      const theme = e.target.checked ? 'dark' : 'light';
      html.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }

    themeSwitch.addEventListener('change', toggleTheme);

    // Load saved theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'dark';

    // Handle visibility changes
    document.addEventListener('visibilitychange', async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });

    // Initialize everything
    initWorker();
    initEmptyClock();
  });
})(jQuery);
