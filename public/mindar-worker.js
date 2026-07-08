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
    // progress is already 0-100
    await compiler.compileImageTargets([canvas], function(progress) {
      self.postMessage({ type: 'progress', progress: Math.min(99, Math.round(progress)) });
    });

    const data = await compiler.exportData();

    // exportData returns a Uint8Array view — extract exactly the right bytes
    // Using .buffer directly gives the full backing ArrayBuffer (may have extra bytes)
    let finalBuffer;
    if (data instanceof Uint8Array) {
      // Slice to get only the view's bytes, not the whole backing buffer
      finalBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    } else if (data instanceof ArrayBuffer) {
      finalBuffer = data;
    } else {
      // Fallback: copy via Blob
      finalBuffer = await new Blob([data]).arrayBuffer();
    }

    self.postMessage({ type: 'done', buffer: finalBuffer });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};
