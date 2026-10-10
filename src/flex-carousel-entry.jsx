import React from 'react';
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
    <div className="musa-carousel-simple" aria-label="Galería de inspiración">
      {items.map(item => (
        <a key={item.source + ':' + item.id} href={item.link} target="_blank" rel="noopener noreferrer">
          <img src={item.image} alt={item.title || 'Referencia creativa'} loading="lazy" />
          <span>{item.title}</span>
        </a>
      ))}
    </div>
  );
}

function unmount() {
  if (root) root.unmount();
  root = null;
}

function mount(items) {
  const container = document.getElementById('musa-flex-carousel-root');
  if (!container || !Array.isArray(items) || items.length === 0) return;
  unmount();
  const references = items.filter(item => sourceLink(item.image) && sourceLink(item.link));
  if (!references.length) return;
  setActiveReference(references[0]);
  root = createRoot(container);

  // React Bits uses WebGL2. Allow exploration on older or GPU-restricted devices.
  const canvas = document.createElement('canvas');
  const supportsWebGL = !!canvas.getContext('webgl2');
  if (!supportsWebGL) {
    root.render(<FallbackGallery items={references} />);
    return;
  }

  const slides = references.map(item => ({
    src: item.image,
    alt: item.title || 'Referencia creativa',
    title: item.title || 'Sin título',
    subtitle: SOURCE_LABELS[item.source] || 'MUSA',
    source: item.source,
    link: item.link,
    id: item.id
  }));
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  root.render(
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
      onChange={index => setActiveReference(references[index])}
      onSelect={index => setActiveReference(references[index])}
    />
  );
}

window.musaFlexCarousel = { mount, unmount };
window.dispatchEvent(new Event('musa-carousel-ready'));
