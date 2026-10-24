import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ArrowDown, Play, Pause, Compass } from 'lucide-react';
import { ArtworkItem, ArtworkCategory, REDDYMADE_ARTWORKS } from '../data/artworks';

interface MasterworksCarouselProps {
  onSelectArtworkForInspect: (art: ArtworkItem) => void;
  onFilterCategoryAndScroll: (category: ArtworkCategory) => void;
  onWalkToInPavilion: (art: ArtworkItem) => void;
}

// Curated selection of signature plates across the collection
const HIGHLIGHT_IDS = [
  'creole-plantation-house', // Flagship Charcoal
  'memwar-takamaka-heritage', // New Masterwork: Heritage Veranda
  'ble-losean-granite-tide', // New Masterwork: Indian Ocean Swell
  'maison-creole-la-bastille', // Authentic Masterwork: Radiant Creole Architecture
  'hauling-pirogue-cooperative', // Authentic Masterwork: Hauling the Pirogue
  'anse-granite-cove-acrylic', // Authentic Masterwork: Anse Source d’Argent
  'sculpture-04-carved-figure-141', // Monumental 160cm Totem
  'plaster-03-labor-omnia-vincit-126', // Plaster Latin Relief
  'face-03-sandy-yellow-panel', // Sandy Yellow Timber
  'explore-01-water-pump-cargo', // ReadyMade Cargo Stencil
  'art-05-analytical-cubist-guitar', // Cubist Guitar Still Life
  'sculpture-01-wood-mask-137', // Ceremonial Hardwood Mask
  'retour-des-kazye-fishermen', // Artisanal Fishermen with Kazye
  'shading-03-seated-plum', // 1985 Ink Gesture Study
];

export const MasterworksCarousel: React.FC<MasterworksCarouselProps> = ({
  onSelectArtworkForInspect,
  onFilterCategoryAndScroll,
  onWalkToInPavilion,
}) => {
  const highlightItems = HIGHLIGHT_IDS.map((id) =>
    REDDYMADE_ARTWORKS.find((a) => a.id === id)
  ).filter(Boolean) as ArtworkItem[];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % highlightItems.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPlaying, highlightItems.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + highlightItems.length) % highlightItems.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % highlightItems.length);
  };

  const currentArt = highlightItems[currentIndex];

  if (!currentArt) return null;

  return (
    <div className="relative w-full rounded-2xl bg-[#181512] border border-white/10 p-4 sm:p-6 md:p-8 shadow-2xl overflow-hidden">
      {/* Background ambient color glow sampled from artwork */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: currentArt.paletteSwatches[0] || '#D97706' }}
      />

      {/* Header controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono-tabular uppercase tracking-widest text-[#D97706]">
            <span>FEATURED ARTWORKS</span>
            <span aria-hidden="true">·</span>
            <span>{currentIndex + 1} OF {highlightItems.length}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif-display font-semibold text-[#FBF9F5] mt-0.5">
            Curated Masterworks & Featured Plates
          </h3>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#D6CEBE] hover:text-white transition-colors"
            title={isPlaying ? 'Pause Auto-Play' : 'Start Auto-Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-[#D6CEBE] hover:text-white transition-colors"
              aria-label="Previous artwork"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-[#D6CEBE] hover:text-white transition-colors"
              aria-label="Next artwork"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Slide Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center pt-6">
        {/* Left: Uncropped Artwork Frame */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div
            onClick={() => onSelectArtworkForInspect(currentArt)}
            className="relative w-full max-w-md h-72 sm:h-84 md:h-96 rounded-xl bg-[#0D0B0A] border border-white/10 p-3 flex items-center justify-center cursor-pointer group shadow-2xl transition-all"
          >
            <img
              src={currentArt.imageUrl}
              alt={currentArt.title}
              className="max-h-full max-w-full object-contain rounded transition-transform duration-300 group-hover:scale-[1.02]"
            />
            {/* Top badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md text-[11px] font-mono-tabular text-[#FBF9F5]">
              Plate {currentArt.indexNumber}
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-xs">
              <span className="px-4 py-2 rounded-lg bg-white/90 text-[#1C1917] text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                <ZoomIn className="w-4 h-4" />
                Open High-Res Study
              </span>
            </div>
          </div>
        </div>

        {/* Right: Curatorial Story & Navigation Trigger */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#D97706] uppercase tracking-wider">
              <span>{currentArt.year}</span>
              <span aria-hidden="true">·</span>
              <span>{currentArt.dimensions}</span>
            </div>
            <h4 className="text-2xl sm:text-3xl font-serif-display font-semibold text-[#FBF9F5] mt-1 leading-snug">
              {currentArt.title}
            </h4>
            <p className="text-sm font-serif-display italic text-[#D6CEBE] mt-1">
              {currentArt.creoleSubtitle}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-[#A8A29E] leading-relaxed line-clamp-3">
            {currentArt.curatorialNote}
          </p>

          {/* Interactive CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectArtworkForInspect(currentArt)}
              className="px-4 py-2.5 rounded-lg bg-[#FBF9F5] text-[#1C1917] hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
              View Curatorial Monograph
            </button>

            <button
              onClick={() => onFilterCategoryAndScroll(currentArt.category)}
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FBF9F5] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDown className="w-4 h-4 text-[#D97706]" />
              Explore in Full Catalogue
            </button>

            {currentArt.inPavilion && (
              <button
                onClick={() => onWalkToInPavilion(currentArt)}
                className="px-4 py-2.5 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                Stand In 3D Pavilion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnails indicator bar */}
      <div className="flex items-center justify-center gap-2 pt-6 mt-4 border-t border-white/10 overflow-x-auto">
        {highlightItems.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setCurrentIndex(idx)}
            className={`flex items-center gap-2 p-1 rounded-lg border transition-all shrink-0 ${
              currentIndex === idx
                ? 'border-[#D97706] bg-white/10'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
            title={item.title}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-7 h-7 rounded object-contain bg-black/40"
            />
            <span className="hidden sm:inline text-[11px] font-mono-tabular text-[#FBF9F5]">
              {item.indexNumber}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
