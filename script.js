(function ($) {
  $(function () {
    let flipClock;
    
    // Create audio element with a more reliable sound URL
    const audio = new Audio('https://www.soundjay.com/mechanical/sounds/timer-bell-01.mp3');
    // Backup sound
    const backupAudio = new Audio('https://www.soundjay.com/mechanical/sounds/alarm-clock-01.mp3');
    
    audio.preload = 'auto';
    backupAudio.preload = 'auto';
    audio.volume = 1.0;
    backupAudio.volume = 1.0;
    
    // Function to ensure sound plays
    function playSound() {
      audio.currentTime = 0;
      backupAudio.currentTime = 0;
      
      audio.play().catch(() => {
        backupAudio.play().catch(e => console.log("Sound playback failed"));
      });
    }

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
      }, 3000); // Show for 3 seconds
    }

    function startCountdown(timeInSeconds) {
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
              clearTimeout(this.factory.timer);
              this.factory.timer = setTimeout(() => {
                if (time <= 1) {
                  // Play sound at 1 second
                  playSound();
                  
                  // Set to zero and show it
                  this.factory.time.time = 0;
                  this.factory.flip();
                  
                  // Show completion message
                  showCompletionMessage();
                  
                  // Stop after showing zero and message
                  setTimeout(() => {
                    this.stop();
                    initEmptyClock();
                  }, 3500); // Wait for message to disappear
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
      
      // Remove active class from all buttons
      $('.preset-btn').removeClass('active');
      // Add active class to clicked button
      $(this).addClass('active');
      
      // Start the countdown
      startCountdown(seconds);
    });

    // Initialize empty clock
    initEmptyClock();
  });
})(jQuery);
