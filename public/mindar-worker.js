// MindAR uses DOM APIs — polyfill for Worker context
self.window = self;
self.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      // Return a real OffscreenCanvas so drawImage works
      return new OffscreenCanvas(1, 1);
    }
    return { style: {}, appendChild: () => {}, removeChild: () => {} };
  },
  createElementNS: (_ns, tag) => self.document.createElement(tag),
  body: { appendChild: () => {}, removeChild: () => {} },
};

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
