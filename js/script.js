(function ($) {
  $(function () {
    let flipClock;
    let clockTimer;
    
    // Create audio elements with relative paths
    const audio = new Audio('../sounds/timer-bell.mp3');
    const backupAudio = new Audio('../sounds/alarm-clock.mp3');
    
    // Preload sounds
    audio.preload = 'auto';
    backupAudio.preload = 'auto';
    audio.volume = 1.0;
    backupAudio.volume = 1.0;

    // Test sound loading
    audio.addEventListener('error', () => {
      console.log('Main sound failed to load');
    });
    
    backupAudio.addEventListener('error', () => {
      console.log('Backup sound failed to load');
    });
    
    // Improved sound playing function
    async function playSound() {
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        console.log('Main sound failed, trying backup:', error);
        try {
          backupAudio.currentTime = 0;
          await backupAudio.play();
        } catch (backupError) {
          console.log('Backup sound also failed:', backupError);
        }
      }
    }

    // Function to initialize sounds with user interaction
    function initSounds() {
      audio.load();
      backupAudio.load();
      audio.play().then(() => audio.pause()).catch(e => console.log('Sound init failed'));
      backupAudio.play().then(() => backupAudio.pause()).catch(e => console.log('Backup init failed'));
    }

    document.addEventListener('click', initSounds, { once: true });

    // Theme toggle functionality
    const themeSwitch = document.getElementById('theme-switch');
    const html = document.documentElement;
    
    // Theme toggle handler
    function toggleTheme(e) {
      if (e.target.checked) {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }

    themeSwitch.addEventListener('change', toggleTheme);

    const currentTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'dark';

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
        minimumDigits: 6,
        showLabels: false
      });
    }

    function showCompletionMessage() {
      const overlay = document.querySelector('.timer-complete-overlay');
      overlay.classList.add('show');
      
      setTimeout(() => {
        overlay.classList.remove('show');
      }, 3000);
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
        showLabels: false,
        callbacks: {
          interval: function() {
            const time = this.factory.getTime().time;
            
            if (this.factory.running) {
              if (clockTimer) {
                clearTimeout(clockTimer);
              }
              
              clockTimer = setTimeout(() => {
                if (time <= 1) {
                  playSound().catch(() => {
                    console.log('All sound attempts failed');
                  });
                  
                  this.factory.time.time = 0;
                  this.factory.flip();
                  showCompletionMessage();
                  
                  setTimeout(() => {
                    this.stop();
                    initEmptyClock();
                  }, 3500);
                } else {
                  this.factory.increment();
                }
              }, 1000 - (Date.now() % 1000));
            }
          }
        }
      });

      flipClock.start();
    }

    // Handle preset button clicks
    $('.preset-btn').click(function() {
      const seconds = parseInt($(this).data('seconds'));
      $('.preset-btn').removeClass('active');
      $(this).addClass('active');
      startCountdown(seconds);
    });

    // Initialize empty clock
    initEmptyClock();
  });
})(jQuery);
