import React, { useRef, useState } from 'react';

interface Slide {
  image: string;
  title: string;
  caption: string;
}

const SLIDES: Slide[] = [
  {
    image: '/images/welcome/start.png',
    title: 'Follow a guided program',
    caption: 'Warm-ups, strength blocks, and cooldowns — mapped out for you.',
  },
  {
    image: '/images/welcome/player.png',
    title: 'Stay on pace',
    caption: 'Built-in work and rest timers keep every set on track.',
  },
  {
    image: '/images/welcome/history.png',
    title: 'Watch your progress build',
    caption: 'Every session logged automatically, so you can see the trend.',
  },
];

export const WelcomeCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.offsetWidth * index, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.offsetWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.offsetWidth);
    setActiveIndex(index);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="hide-scrollbar"
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          borderRadius: '20px',
        }}
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.image}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '4px',
            }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              style={{
                width: '100%',
                maxWidth: '280px',
                aspectRatio: '390 / 560',
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: '20px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 12px 40px -12px rgba(0, 240, 255, 0.25)',
                display: 'block',
              }}
            />
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                {slide.title}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {slide.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {SLIDES.map((slide, index) => (
          <button
            key={slide.image}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex}
            onClick={() => scrollToIndex(index)}
            style={{
              width: index === activeIndex ? '20px' : '8px',
              height: '8px',
              borderRadius: '4px',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: index === activeIndex ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.2)',
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
};
