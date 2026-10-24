import React from 'react';
import { ArtworkItem, REDDYMADE_ARTWORKS } from '../data/artworks';

interface GalleryMiniMapProps {
  cameraPos: { x: number; z: number; yaw: number };
  selectedArtwork: ArtworkItem | null;
  onSelectArtwork: (art: ArtworkItem) => void;
  onClickFloorSpot: (x: number, z: number) => void;
  onClose?: () => void;
}

export const GalleryMiniMap: React.FC<GalleryMiniMapProps> = ({
  cameraPos,
  selectedArtwork,
  onSelectArtwork,
  onClickFloorSpot,
  onClose,
}) => {
  // Convert gallery coordinates [-9, 9] to SVG [0, 140]
  const toSvg = (val: number) => ((val + 9) / 18) * 140;

  const handlePointerInteraction = (clientX: number, clientY: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sz = clientY - rect.top;
    const worldX = (sx / rect.width) * 18 - 9;
    const worldZ = (sz / rect.height) * 18 - 9;
    onClickFloorSpot(
      Math.max(-7.2, Math.min(7.2, worldX)),
      Math.max(-7.2, Math.min(7.6, worldZ))
    );
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    handlePointerInteraction(e.clientX, e.clientY, e.currentTarget);
  };

  const handleSvgTouch = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      e.preventDefault();
      handlePointerInteraction(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
    }
  };

  const userX = toSvg(cameraPos.x);
  const userZ = toSvg(cameraPos.z);
  const deg = (-cameraPos.yaw * 180) / Math.PI;

  return (
    <div className="bg-black/70 backdrop-blur-md border border-white/15 rounded-xl p-3 w-48 text-[#FBF9F5] shadow-2xl touch-manipulation">
      <div className="flex items-center justify-between text-[11px] text-[#D6CEBE] mb-2">
        <span className="font-medium tracking-wide">Pavilion Floorplan</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono-tabular text-[10px] opacity-80">Tap to Walk</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:text-white rounded text-xs leading-none"
              title="Close mini-map"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="relative w-[140px] h-[140px] mx-auto select-none">
        <svg
          viewBox="0 0 140 140"
          className="w-full h-full rounded-lg bg-[#1C1917]/90 border border-white/10 cursor-crosshair touch-none"
          onClick={handleSvgClick}
          onTouchStart={handleSvgTouch}
        >
          {/* South Indian Ocean Veranda strip */}
          <rect x="0" y="124" width="140" height="16" fill="rgba(6, 182, 212, 0.18)" />
          <text
            x="70"
            y="135"
            textAnchor="middle"
            fill="rgba(214, 206, 190, 0.55)"
            fontSize="7"
          >
            OCEAN VERANDA
          </text>

          {/* Central Granite Monolith Plinth & Benches */}
          <rect
            x={toSvg(-0.75)}
            y={toSvg(-1.95)}
            width="12"
            height="12"
            rx="1.5"
            fill="rgba(214, 206, 190, 0.25)"
          />
          <rect
            x={toSvg(-4.1)}
            y={toSvg(1.8)}
            width="20"
            height="5"
            rx="1"
            fill="rgba(214, 206, 190, 0.18)"
          />
          <rect
            x={toSvg(1.5)}
            y={toSvg(1.8)}
            width="20"
            height="5"
            rx="1"
            fill="rgba(214, 206, 190, 0.18)"
          />

          {/* Artwork Markers (01 - 08) */}
          {REDDYMADE_ARTWORKS.filter((art) => art.inPavilion !== false).map((art) => {
            const ax = toSvg(art.position[0]);
            const az = toSvg(art.position[2]);
            const isSelected = selectedArtwork?.id === art.id;
            return (
              <g
                key={art.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectArtwork(art);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  onSelectArtwork(art);
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={ax}
                  cy={az}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#D97706' : '#F59E0B'}
                  stroke={isSelected ? '#FDE68A' : '#1C1917'}
                  strokeWidth={isSelected ? 1.5 : 1}
                />
                <text
                  x={ax}
                  y={az + 2.5}
                  textAnchor="middle"
                  fill="#1C1917"
                  fontSize="5"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {art.indexNumber}
                </text>
              </g>
            );
          })}

          {/* Visitor Location Marker with FOV Cone */}
          <g transform={`translate(${userX}, ${userZ}) rotate(${deg})`}>
            {/* View Direction Cone */}
            <path
              d="M 0 0 L -12 -22 L 12 -22 Z"
              fill="rgba(217, 119, 6, 0.3)"
              stroke="rgba(245, 158, 11, 0.5)"
              strokeWidth="0.5"
            />
            {/* Visitor Dot */}
            <circle cx="0" cy="0" r="4.5" fill="#FBF9F5" stroke="#D97706" strokeWidth="1.5" />
            <circle cx="0" cy="-2.5" r="1.5" fill="#D97706" />
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[9px] text-[#A8A29E] mt-2 font-mono-tabular">
        <span>X: {cameraPos.x.toFixed(1)}m</span>
        <span>Z: {cameraPos.z.toFixed(1)}m</span>
      </div>
    </div>
  );
};
