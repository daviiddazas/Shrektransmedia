import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { GENERATED_TEXTURES } from '../three/proceduralTextures';

interface StoryBookIntroProps {
  title: string;
  subtitle: string;
  tagline: string;
  phase: 'title' | 'opening' | 'playing';
  onOpenStory: () => void;
}

const PARTICLES = Array.from({ length: 24 }, (_, idx) => ({
  id: idx,
  left: `${8 + ((idx * 37) % 84)}%`,
  top: `${10 + ((idx * 53) % 78)}%`,
  size: 4 + (idx % 4) * 2,
  dur: `${3.6 + (idx % 5) * 0.8}s`,
  delay: `${(idx % 6) * 0.4}s`,
}));

export const StoryBookIntro: React.FC<StoryBookIntroProps> = ({
  title,
  subtitle,
  tagline,
  phase,
  onOpenStory,
}) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (phase === 'title') {
      setStep(0);
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenStory();
        }
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }

    if (phase === 'opening') {
      const t1 = window.setTimeout(() => setStep(1), 80);
      const t2 = window.setTimeout(() => setStep(2), 520);
      const t3 = window.setTimeout(() => setStep(3), 1050);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [phase, onOpenStory]);

  if (phase === 'playing') return null;

  const isOpening = phase === 'opening';

  return (
    <div
      data-testid="storybook-intro"
      className={`fixed inset-0 z-40 flex items-center justify-center overflow-hidden select-none transition-opacity duration-700 ${
        step === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 42%, #3f2818 0%, #24160d 55%, #120b06 100%)',
      }}
    >
      {/* Subtle oak table plank grain */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 140px)',
        }}
      />

      {/* Warm candle glow */}
      <div
        aria-hidden="true"
        className="absolute w-[680px] h-[680px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(240, 178, 76, 0.22) 0%, rgba(212, 134, 44, 0.06) 45%, transparent 72%)',
        }}
      />

      {/* Magic fireflies & dust particles */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="firefly-particle absolute rounded-full bg-amber-300"
            style={
              {
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                boxShadow: '0 0 10px 2px rgba(252, 211, 77, 0.65)',
                '--dur': p.dur,
                '--delay': p.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* 3D Perspective Storybook Centerpiece */}
      <div
        className={`book-stage-perspective relative z-10 flex flex-col items-center justify-center px-4 transition-transform duration-1000 ease-out ${
          step >= 2 ? 'scale-125' : 'scale-100'
        }`}
      >
        <div className="relative w-[310px] sm:w-[400px] md:w-[440px] aspect-[3/4] rounded-r-2xl rounded-l-md shadow-[0_32px_70px_rgba(0,0,0,0.78)]">
          {/* Back cover & inner illuminated parchment spread waiting inside */}
          <div
            className="absolute inset-0 rounded-r-2xl rounded-l-md border-4 border-[#5a3b20] overflow-hidden"
            style={{
              backgroundImage: `url(${GENERATED_TEXTURES.parchmentTile})`,
              backgroundSize: 'cover',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-amber-900/25" />
            <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
              <Sparkles className="w-10 h-10 text-amber-700 mb-3" aria-hidden="true" />
              <p className="font-display text-lg sm:text-xl font-bold text-[#3b2714] tracking-wide">
                Muy Muy Lejano te espera...
              </p>
              <p className="font-story italic text-sm text-[#5c4024] mt-2">
                El tablero mágico cobra vida ante tus ojos.
              </p>
            </div>
          </div>

          {/* Turning parchment pages */}
          <div
            aria-hidden="true"
            className={`book-page-turn absolute inset-y-2 right-2 left-3 rounded-r-xl border border-[#b59460] shadow-md ${
              step >= 1 ? 'is-flipped-3' : ''
            }`}
            style={{
              backgroundImage: `url(${GENERATED_TEXTURES.parchmentTile})`,
              backgroundSize: 'cover',
            }}
          />
          <div
            aria-hidden="true"
            className={`book-page-turn absolute inset-y-2 right-2 left-3 rounded-r-xl border border-[#b59460] shadow-md ${
              step >= 1 ? 'is-flipped-2' : ''
            }`}
            style={{
              backgroundImage: `url(${GENERATED_TEXTURES.parchmentTile})`,
              backgroundSize: 'cover',
            }}
          />
          <div
            aria-hidden="true"
            className={`book-page-turn absolute inset-y-2 right-2 left-3 rounded-r-xl border border-[#b59460] shadow-md ${
              step >= 1 ? 'is-flipped-1' : ''
            }`}
            style={{
              backgroundImage: `url(${GENERATED_TEXTURES.parchmentTile})`,
              backgroundSize: 'cover',
            }}
          />

          {/* Ornate Front Cover */}
          <div
            className={`book-cover-3d absolute inset-0 rounded-r-2xl rounded-l-md overflow-hidden border-2 border-[#c99c3c]/70 shadow-2xl ${
              isOpening ? 'is-opening' : ''
            }`}
          >
            <img
              src={GENERATED_TEXTURES.coverCrest}
              alt="Portada medieval ilustrada del libro de cuentos de Shrek"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Measured dark vignette scrim for gold & ivory legibility */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-black/72 via-black/42 to-black/80"
            />

            {/* Left leather spine ridges */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-[#1a0d07]/90 via-[#3d2113]/60 to-transparent border-r border-[#c99c3c]/30"
            />

            {/* Cover Typography & Primary CTA */}
            <div className="relative z-10 h-full flex flex-col items-center justify-between px-8 py-9 sm:py-11 text-center">
              <div className="space-y-2 mt-1">
                <h1
                  className="font-display text-4xl sm:text-5xl font-bold tracking-[0.14em] text-[#f7dca1] drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]"
                  style={{ textWrap: 'balance' }}
                >
                  {title}
                </h1>
                <p
                  className="font-display text-xs sm:text-sm font-semibold tracking-[0.16em] text-[#ebd29a] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
                  style={{ textWrap: 'balance' }}
                >
                  {subtitle}
                </p>
              </div>

              <div className="space-y-5 mb-1 w-full flex flex-col items-center">
                <p className="font-story italic text-sm sm:text-base text-[#f6ead0] max-w-[28ch] leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  “{tagline}”
                </p>

                <button
                  type="button"
                  data-start="true"
                  disabled={isOpening}
                  onClick={onOpenStory}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg font-display text-sm sm:text-base font-bold tracking-wider text-[#261607] bg-gradient-to-b from-[#f4d482] to-[#c9922c] border border-[#ffefb8] shadow-[0_10px_28px_rgba(0,0,0,0.65)] hover:from-[#fae099] hover:to-[#d8a138] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300 whitespace-nowrap"
                >
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                  <span>{isOpening ? 'Abriendo el cuento...' : 'ABRIR EL CUENTO'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {!isOpening && (
          <p className="mt-5 text-xs text-amber-100/90 tracking-wide">
            Presiona Enter o haz clic para iniciar la narración y descubrir el tablero 3D
          </p>
        )}
      </div>
    </div>
  );
};
