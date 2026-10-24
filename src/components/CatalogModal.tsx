import React, { useState, useMemo } from 'react';
import {
  X,
  Compass,
  ZoomIn,
  Maximize2,
  Minimize2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Layers,
  Palette,
} from 'lucide-react';
import { ArtworkItem, ArtworkCategory, REDDYMADE_ARTWORKS } from '../data/artworks';

interface CatalogModalProps {
  isOpen: boolean;
  initialTab?: 'collection' | 'inspect' | 'artist';
  inspectedArtwork?: ArtworkItem | null;
  onClose: () => void;
  onWalkToArtwork: (art: ArtworkItem) => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  initialTab = 'collection',
  inspectedArtwork = null,
  onClose,
  onWalkToArtwork,
}) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'inspect' | 'artist'>(
    inspectedArtwork ? 'inspect' : initialTab
  );
  const [activePiece, setActivePiece] = useState<ArtworkItem>(
    inspectedArtwork || REDDYMADE_ARTWORKS[0]
  );
  const [selectedCategory, setSelectedCategory] = useState<ArtworkCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [loupePos, setLoupePos] = useState({ x: 50, y: 50 });
  const [isFullscreenPlate, setIsFullscreenPlate] = useState(false);

  React.useEffect(() => {
    if (inspectedArtwork) {
      setActivePiece(inspectedArtwork);
      setActiveTab('inspect');
      setZoomLevel(1);
    } else {
      setActiveTab(initialTab);
    }
  }, [inspectedArtwork, initialTab, isOpen]);

  // Dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: REDDYMADE_ARTWORKS.length,
      pavilion: 0,
      shading: 0,
      sculpture: 0,
      plaster: 0,
      face: 0,
      explore: 0,
      art: 0,
    };
    REDDYMADE_ARTWORKS.forEach((item) => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });
    return counts;
  }, []);

  // Filtered artworks based on category and search query
  const filteredArtworks = useMemo(() => {
    return REDDYMADE_ARTWORKS.filter((art) => {
      // Category check
      if (selectedCategory !== 'all' && art.category !== selectedCategory) {
        return false;
      }
      // Search check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matches =
          art.title.toLowerCase().includes(query) ||
          art.creoleSubtitle.toLowerCase().includes(query) ||
          art.medium.toLowerCase().includes(query) ||
          art.series.toLowerCase().includes(query) ||
          art.accessionNumber.toLowerCase().includes(query) ||
          art.year.includes(query) ||
          art.category.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const updateLoupeCoordinates = (clientX: number, clientY: number, currentTarget: HTMLElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setLoupePos({ x, y });
  };

  const handleStepActivePiece = (delta: -1 | 1) => {
    const currentIndex = REDDYMADE_ARTWORKS.findIndex((a) => a.id === activePiece.id);
    const nextIndex =
      (currentIndex + delta + REDDYMADE_ARTWORKS.length) % REDDYMADE_ARTWORKS.length;
    setActivePiece(REDDYMADE_ARTWORKS[nextIndex]);
    setZoomLevel(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div
        className={`relative w-full ${
          isFullscreenPlate ? 'max-w-none h-full m-0 rounded-none' : 'max-w-7xl max-h-[95vh] rounded-xl'
        } flex flex-col bg-[#FBF9F5] text-[#1C1917] border border-[#D6CEBE] shadow-2xl overflow-hidden transition-all duration-200`}
      >
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 md:px-8 py-3.5 border-b border-[#E5DEC9] bg-[#F7F4EE] shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div className="flex items-center gap-2">
              <span className="font-serif-display text-2xl font-bold tracking-tight text-[#1C1917]">
                ReddyMade
              </span>
              <span className="text-[10px] sm:text-xs font-mono-tabular uppercase px-2 py-0.5 bg-[#EAE4D7] text-[#78716C] rounded">
                Exhibition Archive ({REDDYMADE_ARTWORKS.length})
              </span>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden p-1.5 text-xs font-medium text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DDD6C9] rounded-lg transition-colors flex items-center gap-1 shrink-0"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#EBE6DF] rounded-lg overflow-x-auto max-w-full">
              <button
                onClick={() => {
                  setActiveTab('collection');
                  setIsFullscreenPlate(false);
                }}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'collection'
                    ? 'bg-[#FBF9F5] text-[#1C1917] shadow-xs font-semibold'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Collection ({REDDYMADE_ARTWORKS.length})
              </button>
              <button
                onClick={() => setActiveTab('inspect')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'inspect'
                    ? 'bg-[#FBF9F5] text-[#1C1917] shadow-xs font-semibold'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Plate Study
              </button>
              <button
                onClick={() => {
                  setActiveTab('artist');
                  setIsFullscreenPlate(false);
                }}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'artist'
                    ? 'bg-[#FBF9F5] text-[#1C1917] shadow-xs font-semibold'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Artist Monograph
              </button>
            </div>

            <button
              onClick={onClose}
              className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DDD6C9] rounded-lg transition-colors items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <X className="w-4 h-4" />
              Return to 3D Gallery
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {/* TAB 1: COMPLETE CURATED COLLECTION CATALOGUE */}
          {activeTab === 'collection' && (
            <div className="space-y-6 md:space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E5DEC9] pb-4 md:pb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9A3412]">
                    <span>ORIGINAL WORKS BY JUSTIN REDDY</span>
                    <span aria-hidden="true">·</span>
                    <span>COMPLETE STUDIO CATALOGUE ({REDDYMADE_ARTWORKS.length})</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif-display font-medium text-[#1C1917] mt-1.5">
                    Complete Exhibition Catalogue
                  </h2>
                  <p className="text-xs sm:text-sm text-[#57534E] mt-1 max-w-3xl leading-relaxed">
                    Featuring the 3D Pavilion installations alongside the complete studio archive: Shading studies, carved wood sculptures, coral plaster reliefs, reclaimed wood portraits, found-cardboard ready-made explorations, and modernist paintings.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, medium, series..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-[#EBE6DF] border border-[#D6CEBE] rounded-lg text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#9A3412] focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {(
                  [
                    { key: 'all', label: 'All Works', count: categoryCounts.all },
                    { key: 'shading', label: 'Heritage Charcoal & Graphite', count: categoryCounts.shading },
                    { key: 'sculpture', label: 'Hardwood Totems & Mask Carvings', count: categoryCounts.sculpture },
                    { key: 'plaster', label: 'Coral Plaster & Bas-Reliefs', count: categoryCounts.plaster },
                    { key: 'face', label: 'Reclaimed Timber Portraits', count: categoryCounts.face },
                    { key: 'explore', label: 'ReadyMade Cardboard & Cargo Stencils', count: categoryCounts.explore },
                    { key: 'art', label: 'Modernist Cubism & Impasto Acrylics', count: categoryCounts.art },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      selectedCategory === cat.key
                        ? 'bg-[#1C1917] text-[#FBF9F5] shadow-xs font-semibold'
                        : 'bg-[#EBE6DF] text-[#57534E] hover:bg-[#DDD6C9] hover:text-[#1C1917]'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] font-mono-tabular px-1.5 py-0.2 rounded-full ${
                        selectedCategory === cat.key ? 'bg-white/20 text-white' : 'bg-black/10 text-[#78716C]'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Results status indicator */}
              <div className="flex items-center justify-between text-xs text-[#78716C] font-mono-tabular px-1">
                <span>
                  Showing {filteredArtworks.length} of {REDDYMADE_ARTWORKS.length} plates
                  {searchQuery ? ` matching "${searchQuery}"` : ''}
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[#9A3412] hover:underline cursor-pointer"
                  >
                    Clear search filter
                  </button>
                )}
              </div>

              {/* Grid of Artworks */}
              {filteredArtworks.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-[#F7F4EE] rounded-xl border border-[#E5DEC9]">
                  <p className="text-sm text-[#78716C]">
                    No artworks match your search & category filters.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-white rounded-lg hover:bg-[#292524] transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                  {filteredArtworks.map((art) => (
                    <div
                      key={art.id}
                      className="group flex flex-col justify-between bg-[#F7F4EE] border border-[#E5DEC9] rounded-xl p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        {/* Uncropped Artwork Display Box */}
                        <div
                          onClick={() => {
                            setActivePiece(art);
                            setActiveTab('inspect');
                          }}
                          className="relative w-full h-56 sm:h-64 bg-[#EDE8DE] border border-[#DCD5C5] rounded-lg overflow-hidden cursor-pointer flex items-center justify-center p-2 mb-3.5 group-hover:border-[#9A3412]/40 transition-colors"
                        >
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain shadow-xs transition-transform duration-200 group-hover:scale-[1.02]"
                          />

                          {/* Plate Index Badge */}
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[#FBF9F5] text-[10px] font-mono-tabular font-medium">
                            Plate {art.indexNumber}
                          </div>

                          {/* Category Badge */}
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-[#9A3412]/90 backdrop-blur-xs text-[#FBF9F5] text-[10px] font-mono-tabular uppercase font-semibold">
                            {art.category === 'pavilion' ? '3D Pavilion' : art.category}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] font-mono-tabular">
                          <span>{art.year}</span>
                        </div>

                        <h3
                          onClick={() => {
                            setActivePiece(art);
                            setActiveTab('inspect');
                          }}
                          className="text-base sm:text-lg font-serif-display font-semibold text-[#1C1917] mt-1 group-hover:text-[#9A3412] transition-colors cursor-pointer leading-snug line-clamp-2"
                        >
                          {art.title}
                        </h3>

                        <p className="text-xs text-[#57534E] mt-1 line-clamp-2 leading-relaxed">
                          {art.creoleSubtitle}
                        </p>

                        <div className="mt-2 text-[11px] font-medium text-[#78716C] truncate">
                          {art.medium}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#E5DEC9]">
                        <button
                          onClick={() => {
                            setActivePiece(art);
                            setActiveTab('inspect');
                          }}
                          className="flex-1 py-2 text-xs font-medium text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DDD6C9] active:bg-[#D5CEBF] rounded-md transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          Plate Study
                        </button>

                        {art.inPavilion ? (
                          <button
                            onClick={() => {
                              onWalkToArtwork(art);
                              onClose();
                            }}
                            className="flex-1 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-[#292524] active:bg-black rounded-md transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            Stand In Room
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActivePiece(art);
                              setActiveTab('inspect');
                            }}
                            className="flex-1 py-2 text-xs font-medium bg-[#8C3827]/10 text-[#8C3827] hover:bg-[#8C3827]/20 rounded-md transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                          >
                            <Palette className="w-3.5 h-3.5" />
                            Inspect Work
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HIGH-RES PLATE STUDY */}
          {activeTab === 'inspect' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: High-Res Interactive Viewer */}
              <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                {/* Viewer Box */}
                <div
                  onMouseMove={(e) => updateLoupeCoordinates(e.clientX, e.clientY, e.currentTarget)}
                  onTouchMove={(e) => {
                    if (e.touches.length > 0) {
                      updateLoupeCoordinates(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) {
                      updateLoupeCoordinates(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
                    }
                  }}
                  className={`relative w-full ${
                    isFullscreenPlate ? 'h-[80vh]' : 'h-[360px] sm:h-[460px] md:h-[500px]'
                  } bg-[#181512] rounded-xl overflow-hidden flex items-center justify-center border border-[#D6CEBE] shadow-inner select-none touch-none`}
                >
                  <img
                    src={activePiece.imageUrl}
                    alt={activePiece.title}
                    onClick={() => setZoomLevel((prev) => (prev > 1 ? 1 : 2.2))}
                    style={{
                      transform: zoomLevel > 1 ? `scale(${zoomLevel})` : undefined,
                      transformOrigin: `${loupePos.x}% ${loupePos.y}%`,
                    }}
                    className={`max-h-[92%] max-w-[92%] object-contain transition-transform duration-200 shadow-2xl ${
                      zoomLevel > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                  />

                  {/* Top Overlay Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 sm:gap-2">
                    <span className="px-2 sm:px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[#FBF9F5] text-[11px] sm:text-xs font-mono-tabular">
                      Plate {activePiece.indexNumber}
                    </span>
                  </div>

                  {/* Top Right Controls: Fullscreen */}
                  <button
                    onClick={() => setIsFullscreenPlate(!isFullscreenPlate)}
                    className="absolute top-3 right-3 p-2 rounded-md bg-black/75 backdrop-blur-md text-[#FBF9F5] hover:bg-black transition-colors"
                    title={isFullscreenPlate ? 'Exit Fullscreen' : 'View Fullscreen'}
                  >
                    {isFullscreenPlate ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Plate Navigation Steppers & Thumbnails */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleStepActivePiece(-1)}
                    className="p-2 rounded-lg bg-[#EBE6DF] hover:bg-[#DDD6C9] text-[#1C1917] transition-colors flex items-center gap-1 text-xs font-medium shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev Plate</span>
                  </button>

                  {/* Horizontal Thumbnails Slider */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1">
                    {REDDYMADE_ARTWORKS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActivePiece(item);
                          setZoomLevel(1);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-mono-tabular transition-all whitespace-nowrap shrink-0 ${
                          activePiece.id === item.id
                            ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917] shadow-sm font-semibold'
                            : 'bg-[#F7F4EE] text-[#57534E] border-[#D6CEBE] hover:text-[#1C1917]'
                        }`}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-4 h-4 rounded object-contain bg-white"
                        />
                        <span>{item.indexNumber}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStepActivePiece(1)}
                    className="p-2 rounded-lg bg-[#EBE6DF] hover:bg-[#DDD6C9] text-[#1C1917] transition-colors flex items-center gap-1 text-xs font-medium shrink-0"
                  >
                    <span>Next Plate</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: Curatorial Monograph ONLY */}
              <div className="lg:col-span-5 space-y-5 sm:space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#9A3412] uppercase tracking-widest">
                    <span>Plate {activePiece.indexNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activePiece.year}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-[#1C1917] mt-1.5 leading-tight">
                    {activePiece.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-serif-display italic text-[#57534E] mt-1">
                    {activePiece.creoleSubtitle}
                  </p>
                </div>

                {/* Curatorial Monograph Section */}
                <div className="space-y-3 pt-3 border-t border-[#E5DEC9]">
                  <h4 className="text-xs uppercase tracking-widest text-[#78716C] font-semibold">
                    Curatorial Monograph
                  </h4>
                  <p className="text-sm sm:text-base text-[#292524] font-serif-display leading-relaxed">
                    {activePiece.curatorialNote}
                  </p>
                </div>

                {/* Primary Action */}
                <div className="pt-2 flex items-center gap-3">
                  {activePiece.inPavilion && (
                    <button
                      onClick={() => {
                        onWalkToArtwork(activePiece);
                        onClose();
                      }}
                      className="w-full sm:w-auto px-5 py-3 text-xs font-medium bg-[#9A3412] text-white rounded-lg hover:bg-[#7C2D12] active:bg-[#60230e] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
                    >
                      <Compass className="w-4 h-4" />
                      Stand Before This Painting in 3D Pavilion
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ARTIST MONOGRAPH */}
          {activeTab === 'artist' && (
            <div className="max-w-3xl mx-auto space-y-6 py-2 sm:py-4">
              <div className="text-xs uppercase tracking-widest text-[#78716C] font-semibold">
                ARTIST MONOGRAPH · REDDYMADE ART, SEYCHELLES
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif-display font-medium text-[#1C1917]">
                Justin Reddy: Chronicling Island Heritage & Equatorial Color
              </h2>
              <div className="border-b border-[#E5DEC9]" />

              <p className="text-sm sm:text-base text-[#292524] leading-relaxed first-letter:text-4xl sm:first-letter:text-5xl first-letter:font-serif-display first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                Seychellois artist Justin Reddy creates under the studio banner of ReddyMade, synthesizing the sensory world of the Seychelles archipelago. His body of work bridges diverse expressive media: contemplative charcoal drawings capturing Creole architecture, monumental hardwood carvings and masks, coral plaster wall reliefs, expressive reclaimed-timber portraits, corrugated cardboard ready-made collages, and vibrant cubist acrylics.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 my-4 sm:my-6">
                <div className="p-4 sm:p-5 bg-[#F7F4EE] border border-[#E5DEC9] rounded-xl space-y-2">
                  <h3 className="font-serif-display text-lg font-bold text-[#1C1917]">
                    The Heritage Charcoal Series
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Rendered with vine charcoal and graphite on aged cotton rag paper, these drawings record historical Seychellois homesteads, ox-carts on La Digue, and the weathered dignity of island elders.
                  </p>
                </div>

                <div className="p-4 sm:p-5 bg-[#F7F4EE] border border-[#E5DEC9] rounded-xl space-y-2">
                  <h3 className="font-serif-display text-lg font-bold text-[#1C1917]">
                    Granite, Tide & Impasto Acrylics
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Bursting with radiant cobalt blue, cadmium yellow, and burnt orange, these works reflect the Precambrian granite boulders and tropical sun with sculptural impasto marks.
                  </p>
                </div>

                <div className="p-4 sm:p-5 bg-[#F7F4EE] border border-[#E5DEC9] rounded-xl space-y-2">
                  <h3 className="font-serif-display text-lg font-bold text-[#1C1917]">
                    Sculpture, Masks & Plaster Reliefs
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    From 1.6-meter carved tree trunk totems and horned ceremonial masks to lime-and-coral plaster bas-reliefs inscribed with &ldquo;Labor Omnia Vincit&rdquo;, Reddy anchors art in physical island materials.
                  </p>
                </div>

                <div className="p-4 sm:p-5 bg-[#F7F4EE] border border-[#E5DEC9] rounded-xl space-y-2">
                  <h3 className="font-serif-display text-lg font-bold text-[#1C1917]">
                    Ready-Made & Material Explorations
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    True to the name &ldquo;ReddyMade&rdquo;, found industrial shipping cartons, international newsprint mosaics, and weathered maritime boat timber are transformed into profound artworks.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
