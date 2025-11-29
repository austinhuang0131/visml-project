// TileMetricsVisualization loader
// Loads `tilemetrics.html` and injects its head/body into the document.

(async function loadTileMetrics() {
  try {
    const resp = await fetch('tilemetrics.html');
    if (!resp.ok) throw new Error('Failed to load tilemetrics.html: ' + resp.status);
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Copy head children (avoid duplicates by id)
    Array.from(doc.head.children).forEach((node) => {
      try {
        if (node.id && document.getElementById(node.id)) return;
        document.head.appendChild(document.importNode(node, true));
      } catch (e) { /* ignore */ }
    });

    // Replace body content
    document.body.innerHTML = doc.body.innerHTML;

    // Re-run inline scripts from injected content
    Array.from(document.body.querySelectorAll('script')).forEach((s) => {
      const ns = document.createElement('script');
      if (s.src) ns.src = s.src;
      ns.textContent = s.textContent;
      document.body.appendChild(ns);
      s.remove();
    });
  } catch (err) {
    console.error('TileMetrics loader error:', err);
    const errEl = document.createElement('div');
    errEl.style.padding = '12px'; errEl.style.background = '#fee2e2'; errEl.style.color = '#7f1d1d';
    errEl.textContent = 'Error loading tilemetrics.html: ' + (err && err.message ? err.message : String(err));
    document.body.appendChild(errEl);
  }
})();
