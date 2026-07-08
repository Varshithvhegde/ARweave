// Module worker — use import() not importScripts()
self.onmessage = async function(e) {
  const { imageData, width, height } = e.data;

  try {
    self.postMessage({ type: 'progress', progress: 0 });

    // Dynamic import works in module workers
    const { Compiler } = await import(
      'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js'
    );

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(imageData), width, height), 0, 0);

    const compiler = new Compiler();
    await compiler.compileImageTargets([canvas], function(progress) {
      self.postMessage({ type: 'progress', progress: Math.round(progress * 100) });
    });

    const buffer = await compiler.exportData();
    self.postMessage({ type: 'done', buffer }, [buffer]);
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};
