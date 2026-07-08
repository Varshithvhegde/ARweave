// Web Worker — runs MindAR compilation off the main thread
// Loaded via new Worker('/mindar-worker.js')

importScripts('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js');

self.onmessage = async function(e) {
  const { imageData, width, height } = e.data;

  try {
    // Reconstruct ImageData in the worker
    const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);

    // Create an OffscreenCanvas so MindAR can drawImage from it
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imgData, 0, 0);

    const Compiler = self.MINDAR.IMAGE.Compiler;
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
