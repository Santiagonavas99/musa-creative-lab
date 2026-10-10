import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FlexCarousel from './components/FlexCarousel/FlexCarousel.jsx';

const SOURCE_LABELS = {
  unsplash: 'Unsplash',
  met: 'The Met',
  artic: 'Art Institute of Chicago',
  wikimedia: 'Wikimedia Commons'
};

let root = null;

function sourceLink(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function setActiveReference(item) {
  const current = document.getElementById('musa-carousel-current');
  const original = document.getElementById('musa-carousel-original');
  if (!current || !original || !item) return;
  current.textContent = (SOURCE_LABELS[item.source] || 'Referencia') + ' · ' + item.title;
  const link = sourceLink(item.link);
  original.href = link || '#';
  original.hidden = !link;
}

function FallbackGallery({ items }) {
  return (
    <div className="musa-carousel-simple" aria-label="Explorar referencias visuales">
      {items.map(item => (
        <a
          key={item.source + ':' + item.id}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={'Ver ' + (item.title || 'obra') + ' en ' + (SOURCE_LABELS[item.source] || 'su fuente')}
        >
          <div className="musa-simple-cover">
            <img src={item.image} alt={item.title || 'Referencia creativa'} loading="eager" />
          </div>
          <span className="musa-simple-title">{item.title || 'Sin título'}</span>
          <small>{SOURCE_LABELS[item.source] || 'Referencia'} ↗</small>
        </a>
      ))}
    </div>
  );
}

// A normal <img> can display cross-origin imagery, whereas WebGL textures
// require valid CORS response headers. Probe URLs before passing them to OGL.
function canLoadInWebGL(url) {
  return new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    let settled = false;
    const complete = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve(ok);
    };
    const timeout = setTimeout(() => complete(false), 4000);
    image.onload = () => complete(image.naturalWidth > 0 && image.naturalHeight > 0);
    image.onerror = () => complete(false);
    image.src = url;
  });
}

class GPUErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.warn('MUSA: WebGL no disponible; mostrando galería HTML.', error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function CarouselIsland({ items, supportsWebGL }) {
  const [gpuItems, setGpuItems] = useState([]);
  const [visualReady, setVisualReady] = useState(false);

  useEffect(() => {
    if (!supportsWebGL || items.length < 2) return undefined;
    let cancelled = false;
    Promise.all(items.map(item => canLoadInWebGL(item.image))).then(states => {
      if (cancelled) return;
      const compatible = items.filter((item, index) => states[index]);
      // Don't show inaccessible or broken remote images in the WebGL carousel.
      if (compatible.length >= 2) setGpuItems(compatible);
    });
    return () => { cancelled = true; };
  }, [items, supportsWebGL]);

  const slides = gpuItems.map(item => ({
    src: item.image,
    alt: item.title || 'Referencia creativa',
    title: item.title || 'Sin título',
    subtitle: SOURCE_LABELS[item.source] || 'MUSA'
  }));
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      <div className="musa-carousel-html" data-hidden={visualReady ? 'true' : 'false'}>
        <FallbackGallery items={items} />
      </div>
      {slides.length >= 2 && (
        <div
          className="musa-carousel-webgl"
          style={{ opacity: visualReady ? 1 : 0.001, pointerEvents: visualReady ? 'auto' : 'none' }}
        >
          <GPUErrorBoundary>
            <FlexCarousel
              items={slides}
              preset="liquid"
              intro={reducedMotion ? 'none' : 'rise'}
              cardHeight={0.5}
              gap={12}
              squeeze={0.2}
              focusOnClick
              captions
              captureWheel={false}
              onVisualReady={() => setVisualReady(true)}
              onChange={index => setActiveReference(gpuItems[index])}
              onSelect={index => setActiveReference(gpuItems[index])}
            />
          </GPUErrorBoundary>
        </div>
      )}
    </>
  );
}

function unmount() {
  if (root) root.unmount();
  root = null;
}

function mount(items) {
  const container = document.getElementById('musa-flex-carousel-root');
  if (!container || !Array.isArray(items) || !items.length) return;
  unmount();

  const references = items.filter(item => sourceLink(item.image) && sourceLink(item.link));
  if (!references.length) return;
  setActiveReference(references[0]);

  let supportsWebGL = false;
  try {
    supportsWebGL = Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    // The HTML gallery works without GPU acceleration.
  }

  root = createRoot(container);
  root.render(<CarouselIsland items={references} supportsWebGL={supportsWebGL} />);
}

window.musaFlexCarousel = { mount, unmount };
window.dispatchEvent(new Event('musa-carousel-ready'));
