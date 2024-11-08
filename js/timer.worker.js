let timer = null;

self.onmessage = function(e) {
  if (e.data.command === 'start') {
    if (timer) clearInterval(timer);
    const startTime = Date.now();
    const duration = e.data.duration * 1000; // Convert to milliseconds
    
    timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      
      if (remaining <= 0) {
        clearInterval(timer);
        self.postMessage({ type: 'complete' });
      } else {
        self.postMessage({ 
          type: 'tick', 
          remaining: Math.ceil(remaining / 1000)
        });
      }
    }, 100); // Check more frequently than once per second
  }
  
  if (e.data.command === 'stop') {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}; 