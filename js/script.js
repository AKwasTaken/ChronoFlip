(function ($) {
  $(function () {
    // Initialize variables
    let flipClock;
    let activeTimer = null;
    let wakeLock = null;
    const MINIMUM_DIGITS = 6;

    // Initialize audio with preload
    const audio = new Audio('sounds/timer-bell.mp3');
    const backupAudio = new Audio('sounds/alarm-clock.mp3');
    [audio, backupAudio].forEach(sound => {
      sound.preload = 'auto';
      sound.volume = 1.0;
    });

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
      if (overlay && !overlay.classList.contains('show')) {
        overlay.classList.add('show');
        playSound().catch(console.log);
      }
    }

    function hideOverlay() {
      const overlay = document.querySelector('.timer-complete-overlay');
      if (overlay && overlay.classList.contains('show')) {
        overlay.classList.remove('show');
        [audio, backupAudio].forEach(sound => {
          sound.pause();
          sound.currentTime = 0;
        });
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
        flipClock.stop();
        $('.js-flipclock').html('');
      }
      
      flipClock = $('.js-flipclock').FlipClock(0, {
        clockFace: 'HourlyCounter',
        countdown: true,
        autoStart: false,
        minimumDigits: MINIMUM_DIGITS
      });
      
      activeTimer = null;
      releaseWakeLock();
    }

    function startCurrentTime() {
      if (activeTimer) {
        activeTimer.stop();
      }
      
      $('.js-flipclock').html('');
      hideOverlay();

      const currentSeconds = getCurrentTimeInSeconds();
      
      flipClock = $('.js-flipclock').FlipClock(currentSeconds, {
        clockFace: 'HourlyCounter',
        autoStart: true,
        countdown: false,
        minimumDigits: MINIMUM_DIGITS,
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
      hideOverlay();
      requestWakeLock();

      flipClock = $('.js-flipclock').FlipClock(timeInSeconds, {
        clockFace: 'HourlyCounter',
        countdown: true,
        autoStart: true,
        minimumDigits: MINIMUM_DIGITS,
        callbacks: {
          interval: function() {
            if (this.factory.getTime().time === 0) {
              this.stop();
              showOverlay();
            }
          }
        }
      });

      activeTimer = flipClock;
    }

    // Event Listeners
    document.querySelector('.timer-complete-overlay').addEventListener('click', hideOverlay);

    $('.preset-times').on('click', '.preset-btn', function() {
      const seconds = parseInt($(this).data('seconds'));
      $('.preset-btn').removeClass('active');
      $(this).addClass('active');
      
      if (isNaN(seconds)) {
        if (this.id === 'current-time-btn') {
          startCurrentTime();
        }
      } else {
        startCountdown(seconds);
      }
    });

    // Theme handling
    function toggleTheme(e) {
      const theme = e.target.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }

    const themeSwitch = document.getElementById('theme-switch');
    themeSwitch.addEventListener('change', toggleTheme);

    // Load saved theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'dark';

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (activeTimer && activeTimer.factory.countdown) {
          requestWakeLock();
        }
      } else {
        releaseWakeLock();
      }
    });

    // Initialize empty clock
    initEmptyClock();
  });
})(jQuery);
