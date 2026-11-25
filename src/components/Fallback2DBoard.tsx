import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { StoryStation, ThemeAtmosphere, WorldPoint } from '../types/story';
import { sampleStationSpline } from '../utils/storyLogic';

interface Fallback2DBoardProps {
  stations: StoryStation[];
  visitedIds: number[];
  activeStationId: number | null;
  shrekPos: WorldPoint;
  atmosphere: ThemeAtmosphere;
  onSelectStation: (stationId: number) => void;
}

export const Fallback2DBoard: React.FC<Fallback2DBoardProps> = ({
  stations,
  visitedIds,
  activeStationId,
  shrekPos,
  atmosphere,
  onSelectStation,
}) => {
  const isDark = atmosphere === 'oscuro';
  const spline = sampleStationSpline(stations, 12);

  // Map world [-22..22, -13..13] to SVG [60..940, 60..540]
  const toSvg = (p: WorldPoint) => ({
    x: 500 + (p.x / 22) * 440,
    y: 300 + (p.z / 13) * 230,
  });

  const pathD = spline
    .map((pt, idx) => {
      const s = toSvg(pt);
      return `${idx === 0 ? 'M' : 'L'} ${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
    })
    .join(' ');

  const shrekSvg = toSvg(shrekPos);

  return (
    <div
      data-testid="fallback-2d-board"
      className={`relative w-full h-full flex items-center justify-center p-4 sm:p-8 transition-colors duration-700 ${
        isDark ? 'bg-[#17121b]' : 'bg-[#dfd0b3]'
      }`}
    >
      <div
        className={`relative w-full max-w-6xl aspect-[16/10] rounded-xl border-4 overflow-hidden shadow-2xl ${
          isDark
            ? 'border-[#7a5b2c] bg-[#211b27]'
            : 'border-[#5a3b20] bg-[#f4e8cd]'
        }`}
      >
        {/* Center spine divider */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-r from-black/15 via-black/30 to-black/15 pointer-events-none z-10"
        />

        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full select-none"
          role="img"
          aria-label="Tablero ilustrado del cuento de Shrek en Muy Muy Lejano"
        >
          <defs>
            <radialGradient id="swampGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isDark ? '#27402a' : '#7ea85a'} stopOpacity="0.65" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="palaceGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isDark ? '#514122' : '#ebd07a'} stopOpacity="0.55" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Biome regions */}
          <ellipse cx="160" cy="460" rx="180" ry="120" fill="url(#swampGrad)" />
          <ellipse cx="620" cy="430" rx="200" ry="130" fill="url(#palaceGrad)" />
          <path
            d="M 390 10 Q 430 190 365 340 T 410 590"
            fill="none"
            stroke={isDark ? '#265359' : '#5aa6ad'}
            strokeWidth="28"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Winding adventure path */}
          <path
            d={pathD}
            fill="none"
            stroke={isDark ? '#4a3d33' : '#9c8564'}
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathD}
            fill="none"
            stroke={isDark ? '#8a7356' : '#d7c39d'}
            strokeWidth="8"
            strokeDasharray="10 10"
            strokeLinecap="round"
          />

          {/* Shrek marker */}
          <g transform={`translate(${shrekSvg.x}, ${shrekSvg.y})`} className="transition-transform duration-300">
            <circle r="18" fill="#6fa63b" stroke="#2c1e12" strokeWidth="3" />
            <circle cx="-13" cy="-12" r="5" fill="#6fa63b" stroke="#2c1e12" strokeWidth="2" />
            <circle cx="13" cy="-12" r="5" fill="#6fa63b" stroke="#2c1e12" strokeWidth="2" />
            <text
              y="5"
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#fff"
            >
              S
            </text>
          </g>
        </svg>

        {/* Interactive Station Buttons */}
        {stations.map((station) => {
          const pos = toSvg(station.worldPosition);
          const visited = visitedIds.includes(station.id);
          const active = activeStationId === station.id;
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => onSelectStation(station.id)}
              style={{
                left: `${(pos.x / 1000) * 100}%`,
                top: `${(pos.y / 600) * 100}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-amber-500 ${
                active
                  ? 'bg-amber-600 text-white border-amber-200 shadow-lg scale-105'
                  : visited
                    ? 'bg-emerald-800 text-amber-100 border-amber-400/60 shadow'
                    : isDark
                      ? 'bg-[#2b221c] text-amber-100 border-amber-500/40'
                      : 'bg-[#f9f0dc] text-[#2e1e10] border-[#8b6637]'
              }`}
            >
              <span className="tabular-nums">{station.canvasOrder}.</span>{' '}
              <span className="hidden sm:inline">{station.modalTitle.replace(/^\d+\.\s*/, '')}</span>
            </button>
          );
        })}

        <div
          className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
            isDark
              ? 'bg-[#221a14]/90 text-amber-200 border-amber-500/30'
              : 'bg-[#f8eed6]/95 text-[#432e1a] border-[#8c6838]/40'
          }`}
        >
          <Compass className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Vista Ilustrada 2D</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
