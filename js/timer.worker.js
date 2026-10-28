let timer = null;

self.onmessage = function (e) {
  const data = e.data || {};

  if (data.command === 'start') {
    if (timer) clearInterval(timer);
    const end = Date.now() + data.duration * 1000;
    timer = setInterval(() => {
      if (Date.now() >= end) {
        clearInterval(timer);
        timer = null;
        self.postMessage({ type: 'complete' });
      }
    }, 250);
  }

  if (data.command === 'stop') {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
};