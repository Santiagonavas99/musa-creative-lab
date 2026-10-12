import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import CircularCarousel from './components/CircularCarousel/CircularCarousel.jsx';

const SOURCE_LABELS = {
  unsplash: 'Unsplash',
  met: 'The Met',
  artic: 'Art Institute of Chicago',
  wikimedia: 'Wikimedia Commons'
};

const validHttps = raw => {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.href : '';
  } catch { return ''; }
};

function updateSelected(item) {
  const label = document.getElementById('musa-carousel-current');
  const original = document.getElementById('musa-carousel-original');
  if (!item || !label || !original) return;
  label.textContent = (SOURCE_LABELS[item.source] || 'Referencia') + ' · ' + item.title;
  const link = validHttps(item.link);
  original.href = link || '#';
  original.hidden = !link;
}

function HtmlGallery({ items }) {
  return (
    <div className="musa-carousel-simple" aria-label="Referencias de arte e inspiración">
      {items.map(item => (
        <a key={item.source + ':' + item.id} href={item.link} target="_blank" rel="noopener noreferrer">
          <div className="musa-simple-cover">
            <img
              src={item.image}
              alt={item.title || 'Referencia creativa'}
              loading="eager"
              onError={event => { event.currentTarget.hidden = true; }}
            />
          </div>
          <span className="musa-simple-title">{item.title || 'Sin título'}</span>
          <small>{SOURCE_LABELS[item.source] || 'Referencia'} ↗</small>
        </a>
      ))}
    </div>
  );
}

// CSS-3D uses regular HTML <img> tags (no WebGL or CORS requirements).
// Exclude URLs that cannot render, avoiding empty or broken 3D panels.
function testImage(url) {
  return new Promise(resolve => {
    const image = new Image();
    let finished = false;
    const settle = loaded => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      resolve(loaded);
    };
    const timeout = setTimeout(() => settle(false), 4200);
    image.onload = () => settle(image.naturalWidth > 0);
    image.onerror = () => settle(false);
    image.src = url;
  });
}

function CarouselStage({ items }) {
  const [ready, setReady] = useState(false);
  const container = useRef(null);

  // The component exposes data-ready after loading the photographs.
  // Continue showing the HTML gallery until the animated stage is prepared.
  useEffect(() => {
    setReady(false);
    const node = container.current?.querySelector('.circular-carousel');
    if (!node) return undefined;
    const verify = () => { if (node.hasAttribute('data-ready')) setReady(true); };
    const observer = new MutationObserver(verify);
    observer.observe(node, { attributes: true, attributeFilter: ['data-ready'] });
    verify();
    return () => observer.disconnect();
  }, [items]);

  const carouselItems = items.map(item => ({
    src: item.image,
    alt: item.title || 'Referencia creativa',
    title: item.title || 'Sin título',
    subtitle: SOURCE_LABELS[item.source] || 'MUSA'
  }));
  return (
    <>
      <div className="musa-carousel-html" data-hidden={ready ? 'true' : 'false'}>
        <HtmlGallery items={items} />
      </div>
      <div ref={container} className="musa-carousel-css3d" data-visible={ready ? 'true' : 'false'}>
        <CircularCarousel
          items={carouselItems}
          preset="cylinder"
          intro="rise"
          cardWidth={220}
          aspectRatio={1}
          speed={14}
          autoplay="drift"
          fadeColor="#211b36"
          captions
          draggable
          focusOnClick
          pauseOnHover
          onChange={index => updateSelected(items[index])}
          onItemClick={(item, index) => updateSelected(items[index])}
        />
      </div>
    </>
  );
}

function CarouselIsland({ items }) {
  const [renderable, setRenderable] = useState(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all(items.map(item => testImage(item.image))).then(valid => {
      if (!cancelled) setRenderable(items.filter((item, i) => valid[i]));
    });
    return () => { cancelled = true; };
  }, [items]);

  if (!renderable || renderable.length < 3) {
    return <HtmlGallery items={renderable?.length ? renderable : items} />;
  }
  return <CarouselStage items={renderable} />;
}

let root = null;
function unmount() {
  if (root) root.unmount();
  root = null;
}
function mount(items) {
  const container = document.getElementById('musa-circular-carousel-root');
  if (!container || !Array.isArray(items) || !items.length) return;
  unmount();
  const references = items.filter(item => validHttps(item.image) && validHttps(item.link));
  if (!references.length) return;
  updateSelected(references[0]);
  root = createRoot(container);
  root.render(<CarouselIsland items={references} />);
}

window.musaCircularCarousel = { mount, unmount };
window.dispatchEvent(new Event('musa-circular-ready'));
