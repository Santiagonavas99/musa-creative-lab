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
  try { const url = new URL(raw); return url.protocol === 'https:' ? url.href : ''; }
  catch { return ''; }
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

// Only validated, already-loaded photos reach the real component.
// The lightweight CSS3D ring is visible until React Bits reports ready.
function CarouselStage({ items }) {
  const [ready, setReady] = useState(false);
  const container = useRef(null);
  useEffect(() => { updateSelected(items[0]); }, [items]);
  useEffect(() => {
    const node = container.current?.querySelector('.circular-carousel');
    const rootNode = document.getElementById('musa-circular-carousel-root');
    const native = document.getElementById('musa-native-cylinder');
    if (!node || !rootNode || !native) return undefined;
    let active = true;
    const verify = () => {
      if (!active || !node.hasAttribute('data-ready')) return;
      const bounds = rootNode.getBoundingClientRect();
      if (bounds.width < 100 || bounds.height < 100) return;
      // React Bits can set data-ready after its timeout, even with missing images.
      // Do not remove the native 3D ring until a complete card is on screen.
      const frontLoaded = [...node.querySelectorAll('.circular-carousel__photo')].some(img => {
        if (!img.complete || !img.naturalWidth) return false;
        const card = img.closest('.circular-carousel__card');
        if (!card || getComputedStyle(card).visibility === 'hidden') return false;
        const rect = img.getBoundingClientRect();
        return rect.width > 40 && rect.height > 40 &&
          rect.left < bounds.right - 40 && rect.right > bounds.left + 40 &&
          rect.top < bounds.bottom - 40 && rect.bottom > bounds.top + 40;
      });
      if (!frontLoaded) return;
      setReady(true);
      rootNode.dataset.ready = 'true';
      native.dataset.hidden = 'true';
      active = false;
      clearInterval(timer);
    };
    const timer = setInterval(verify, 140);
    verify();
    return () => {
      active = false;
      clearInterval(timer);
      native.dataset.hidden = 'false';
      rootNode.dataset.ready = 'false';
    };
  }, [items]);

  const carouselItems = items.map(item => ({
    src: item.image,
    alt: item.title || 'Referencia creativa',
    title: item.title || 'Sin título',
    subtitle: SOURCE_LABELS[item.source] || 'MUSA'
  }));

  return (
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
  );
}

class CarouselErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    console.error('MUSA: se conserva el cilindro HTML cuando falla React Bits.', error);
  }
  render() { return this.state.failed ? null : this.props.children; }
}

let root = null;
function unmount() {
  if (root) root.unmount();
  root = null;
}
function mount(items) {
  const container = document.getElementById('musa-circular-carousel-root');
  if (!container || !Array.isArray(items) || items.length < 3) return;
  unmount();
  const references = items.filter(item => validHttps(item.image) && validHttps(item.link));
  if (references.length < 3) return;
  updateSelected(references[0]);
  root = createRoot(container);
  root.render(<CarouselErrorBoundary><CarouselStage items={references} /></CarouselErrorBoundary>);
}
window.musaCircularCarousel = { mount, unmount };
window.dispatchEvent(new Event('musa-circular-ready'));
