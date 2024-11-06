(function ($) {
  $(function () {
    let flipClock;
    let clockTimer;
    
    // Preload audio with reduced size files
    const audio = new Audio('sounds/timer-bell.mp3');
    const backupAudio = new Audio('sounds/alarm-clock.mp3');
    
    // Better audio handling
    [audio, backupAudio].forEach(sound => {
      sound.preload = 'auto';
      sound.volume = 1.0;
    });

    function showCompletionMessage() {
      const overlay = document.querySelector('.timer-complete-overlay');
      overlay.classList.add('show');
      
      // Play sound and handle click in one listener
      const handleOverlayClick = function() {
        overlay.classList.remove('show');
        document.removeEventListener('click', handleOverlayClick);
        [audio, backupAudio].forEach(sound => {
          sound.pause();
          sound.currentTime = 0;
        });
        initEmptyClock();
      };
      
      playSound().catch(console.log);
      document.addEventListener('click', handleOverlayClick);
    }

    async function playSound() {
      try {
        audio.currentTime = 0;
        audio.loop = true;
        await audio.play();
      } catch {
        try {
          backupAudio.currentTime = 0;
          backupAudio.loop = true;
          await backupAudio.play();
        } catch (error) {
          console.log('Sound playback failed:', error);
        }
      }
    }

    function initEmptyClock() {
      if (clockTimer) {
        clearTimeout(clockTimer);
      }
      
      if (flipClock) {
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

    function startCountdown(timeInSeconds) {
      if (clockTimer) {
        clearTimeout(clockTimer);
      }
      
      $('.js-flipclock').html('');

      flipClock = $('.js-flipclock').FlipClock(timeInSeconds, {
        clockFace: 'HourlyCounter',
        countdown: true,
        autoStart: true,
        minimumDigits: 6,
        callbacks: {
          interval: function() {
            const time = this.factory.getTime().time;
            
            if (this.factory.running) {
              if (time <= 0) {
                this.stop();
                showCompletionMessage();
              }
            }
          }
        }
      });
    }

    // Event delegation for preset buttons
    $('.preset-times').on('click', '.preset-btn', function() {
      const seconds = parseInt($(this).data('seconds'));
      $('.preset-btn').removeClass('active');
      $(this).addClass('active');
      startCountdown(seconds);
    });

    // Theme handling
    const themeSwitch = document.getElementById('theme-switch');
    const html = document.documentElement;
    
    // Load theme immediately to prevent flash
    const currentTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'dark';

    themeSwitch.addEventListener('change', function(e) {
      const theme = e.target.checked ? 'dark' : 'light';
      html.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });

    // Initialize
    initEmptyClock();
  });
})(jQuery);
