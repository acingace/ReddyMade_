import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Wind,
  Music,
  Sun,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  Compass,
  Sliders,
  X,
  Menu,
  Search,
  ZoomIn,
  ArrowDown,
  Layers,
  Palette,
  Eye,
  Check,
  Copy,
  ArrowRight,
  Box,
  Mail,
  Instagram,
} from 'lucide-react';
import { ArtworkItem, ArtworkCategory, REDDYMADE_ARTWORKS } from './data/artworks';
import { GalleryScene3D, LightingPreset } from './components/GalleryScene3D';
import { GalleryMiniMap } from './components/GalleryMiniMap';
import { CatalogModal } from './components/CatalogModal';
import { MobileControlsOverlay } from './components/MobileControlsOverlay';
import { MasterworksCarousel } from './components/MasterworksCarousel';
import { soundscape } from './utils/soundscape';

export default function App() {
  // Navigation mode: 'monograph' (scrollable website) or 'pavilion-3d' (full immersive 3D walkthrough)
  const [activeMode, setActiveMode] = useState<'monograph' | 'pavilion-3d'>('monograph');

  // 3D Scene states
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkItem | null>(null);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('golden-hour');
  const [rakingLightActive, setRakingLightActive] = useState(false);
  const [reliefIntensity, setReliefIntensity] = useState(1.15);
  const [guidedTourActive, setGuidedTourActive] = useState(false);

  // Responsive device state
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMiniMapOpen, setMobileMiniMapOpen] = useState(false);
  const [mobilePlacardExpanded, setMobilePlacardExpanded] = useState(false);
  const [mobileMoveVector, setMobileMoveVector] = useState<{ x: number; z: number } | null>(null);
  const [mobileTurnDelta, setMobileTurnDelta] = useState<number>(0);

  // Audio state
  const [audioStarted, setAudioStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [windVolume, setWindVolume] = useState(0.55);
  const [musicVolume, setMusicVolume] = useState(0.45);
  const [showAtmosphereDrawer, setShowAtmosphereDrawer] = useState(false);

  // Catalog & Plate Study modal state
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogModalTab, setCatalogModalTab] = useState<'collection' | 'inspect' | 'artist'>('inspect');
  const [inspectedArtwork, setInspectedArtwork] = useState<ArtworkItem | null>(null);

  // On-page Catalogue filter & search state
  const [selectedCategory, setSelectedCategory] = useState<ArtworkCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 3D visitor position
  const [cameraPos, setCameraPos] = useState({ x: 0, z: 4.8, yaw: 0 });
  const [walkTargetCommand, setWalkTargetCommand] = useState<{
    position: [number, number, number];
    target: [number, number, number];
    timestamp: number;
  } | null>(null);

  const catalogueSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDeviceCheck = () => {
      setIsMobileDevice(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    handleDeviceCheck();
    window.addEventListener('resize', handleDeviceCheck);
    return () => window.removeEventListener('resize', handleDeviceCheck);
  }, []);

  const ensureAudioRunning = async () => {
    if (!audioStarted) {
      await soundscape.start();
      setAudioStarted(true);
      setIsMuted(false);
    }
  };

  const handleToggleMute = async () => {
    if (!audioStarted) {
      await ensureAudioRunning();
      return;
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundscape.setMuted(nextMuted);
  };

  const handleWindChange = async (val: number) => {
    await ensureAudioRunning();
    setWindVolume(val);
    soundscape.setWindVolume(val);
  };

  const handleMusicChange = async (val: number) => {
    await ensureAudioRunning();
    setMusicVolume(val);
    soundscape.setMusicVolume(val);
  };

  // Launch Fullscreen 3D Virtual Pavilion Walkthrough
  const handleEnter3DPavilion = async (targetArt?: ArtworkItem) => {
    await ensureAudioRunning();
    setActiveMode('pavilion-3d');
    if (targetArt) {
      setSelectedArtwork(targetArt);
    } else {
      setSelectedArtwork(null);
      setWalkTargetCommand({
        position: [0, 1.75, 4.8],
        target: [0, 2.1, -6.0],
        timestamp: Date.now(),
      });
    }
  };

  // Return to scrollable monograph website
  const handleExitToMonograph = () => {
    setActiveMode('monograph');
    setGuidedTourActive(false);
    setSelectedArtwork(null);
  };

  // Open high-res plate study for any piece
  const handleInspectArtwork = (art: ArtworkItem) => {
    setInspectedArtwork(art);
    setCatalogModalTab('inspect');
    setCatalogModalOpen(true);
  };

  // Walk directly to an artwork in 3D pavilion
  const handleWalkToInPavilion = async (art: ArtworkItem) => {
    await ensureAudioRunning();
    setActiveMode('pavilion-3d');
    setSelectedArtwork(art);
    setCatalogModalOpen(false);
  };

  // Filter category in on-page catalogue and scroll down
  const handleFilterCategoryAndScroll = (cat: ArtworkCategory) => {
    setSelectedCategory(cat);
    catalogueSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectArtwork = async (art: ArtworkItem | null) => {
    await ensureAudioRunning();
    if (art) {
      soundscape.playInteractionChime();
      setMobilePlacardExpanded(false);
    } else {
      setRakingLightActive(false);
    }
    setSelectedArtwork(art);
  };

  const handleStepArtwork = async (dir: -1 | 1) => {
    await ensureAudioRunning();
    const pavilionWorks = REDDYMADE_ARTWORKS.filter((a) => a.inPavilion === true);
    const currentIndex = selectedArtwork
      ? pavilionWorks.findIndex((a) => a.id === selectedArtwork.id)
      : -1;
    const nextIndex =
      (currentIndex + dir + pavilionWorks.length) % pavilionWorks.length;
    const nextArt = pavilionWorks[nextIndex];
    soundscape.playInteractionChime();
    setSelectedArtwork(nextArt);
  };

  // Dynamic category counts for on-page catalogue
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

  // Filtered artworks for on-page catalogue
  const onPageFilteredArtworks = useMemo(() => {
    return REDDYMADE_ARTWORKS.filter((art) => {
      if (selectedCategory !== 'all' && art.category !== selectedCategory) {
        return false;
      }
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

  // =========================================================================
  // MODE 1: FULLSCREEN 3D VIRTUAL PAVILION (IMMERSIVE WALKTHROUGH)
  // =========================================================================
  if (activeMode === 'pavilion-3d') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#12100E] text-[#FBF9F5] select-none touch-none">
        {/* Full Viewport 3D Canvas */}
        <GalleryScene3D
          selectedArtwork={selectedArtwork}
          onSelectArtwork={handleSelectArtwork}
          lightingPreset={lightingPreset}
          rakingLightActive={rakingLightActive}
          reliefIntensity={reliefIntensity}
          guidedTourActive={guidedTourActive}
          onStopGuidedTour={() => setGuidedTourActive(false)}
          onCameraMove={setCameraPos}
          walkTargetCommand={walkTargetCommand}
          mobileMoveVector={mobileMoveVector}
          mobileTurnDelta={mobileTurnDelta}
        />

        {/* 3D Pavilion Top Navigation Bar */}
        <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3 bg-black/75 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitToMonograph}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/25 text-xs font-semibold text-[#FBF9F5] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Exit to Monograph & Catalogue</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
              <span className="text-sm font-serif-display font-medium text-[#FBF9F5]">
                ReddyMade Pavilion
              </span>
              <span className="text-[10px] font-mono-tabular uppercase px-1.5 py-0.5 rounded bg-[#D97706]/20 text-[#D97706]">
                3D Immersion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Guided Tour Toggle */}
            <button
              onClick={async () => {
                await ensureAudioRunning();
                const nextTour = !guidedTourActive;
                setGuidedTourActive(nextTour);
                if (nextTour && !selectedArtwork) {
                  const pavilionWorks = REDDYMADE_ARTWORKS.filter((a) => a.inPavilion !== false);
                  setSelectedArtwork(pavilionWorks[0]);
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                guidedTourActive
                  ? 'bg-[#D97706] text-white'
                  : 'bg-white/10 text-[#FBF9F5] hover:bg-white/20'
              }`}
            >
              {guidedTourActive ? 'Stop Tour' : 'Guided Tour'}
            </button>

            {/* Atmosphere drawer button */}
            <button
              onClick={() => setShowAtmosphereDrawer(!showAtmosphereDrawer)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#FBF9F5] transition-colors cursor-pointer"
              title="Lighting & Soundscape Atmosphere"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#FBF9F5] transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Soundscape' : 'Mute Soundscape'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#D97706]" />}
            </button>
          </div>
        </header>

        {/* 3D Artwork Selected Placard */}
        {selectedArtwork && (
          <div className="fixed bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-30 p-4 sm:p-5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-[#FBF9F5] shadow-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono-tabular uppercase tracking-wider text-[#D97706]">
                  <span>Plate {selectedArtwork.indexNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArtwork.series}</span>
                </div>
                <h4 className="text-lg font-serif-display font-semibold text-white mt-0.5">
                  {selectedArtwork.title}
                </h4>
                <p className="text-xs font-serif-display italic text-[#D6CEBE]">
                  {selectedArtwork.creoleSubtitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedArtwork(null)}
                className="p-1 rounded-md text-[#78716C] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#A8A29E] line-clamp-2 leading-relaxed">
              {selectedArtwork.curatorialNote}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStepArtwork(-1)}
                  className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-xs"
                  title="Previous artwork"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleStepArtwork(1)}
                  className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-xs"
                  title="Next artwork"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRakingLightActive(!rakingLightActive)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    rakingLightActive
                      ? 'bg-[#D97706] text-white font-medium'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Raking Light
                </button>
                <button
                  onClick={() => handleInspectArtwork(selectedArtwork)}
                  className="px-3 py-1 text-xs font-semibold rounded bg-[#FBF9F5] text-[#1C1917] hover:bg-white transition-colors"
                >
                  Plate Study
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floorplan Mini-Map (Desktop corner or Mobile toggle) */}
        <div className="hidden md:block fixed bottom-6 right-6 z-30">
          <GalleryMiniMap
            cameraPos={cameraPos}
            selectedArtwork={selectedArtwork}
            onSelectArtwork={handleSelectArtwork}
            onClickFloorSpot={(x: number, z: number) => {
              setSelectedArtwork(null);
              setWalkTargetCommand({
                position: [x, 1.75, z],
                target: [0, 2.0, -4.5],
                timestamp: Date.now(),
              });
            }}
          />
        </div>

        {/* Atmosphere Drawer (Lighting Presets & Sound) */}
        {showAtmosphereDrawer && (
          <div className="fixed top-16 right-4 z-40 w-80 p-4 rounded-xl bg-black/90 backdrop-blur-md border border-white/15 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-mono-tabular uppercase tracking-wider text-[#D97706]">
                Lighting & Sound Atmosphere
              </span>
              <button
                onClick={() => setShowAtmosphereDrawer(false)}
                className="text-[#78716C] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lighting presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[#D6CEBE]">Daylight Simulation:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { key: 'golden-hour', label: 'Golden Hour' },
                    { key: 'equatorial-noon', label: 'Equatorial Noon' },
                    { key: 'sunset-veranda', label: 'Sunset Veranda' },
                    { key: 'nocturnal-spot', label: 'Night Spotlight' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => setLightingPreset(preset.key)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      lightingPreset === preset.key
                        ? 'bg-[#D97706] text-white font-medium'
                        : 'bg-white/5 hover:bg-white/10 text-[#D6CEBE]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio levels */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#D6CEBE]">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-[#D97706]" />
                    Tradewinds & Surf
                  </span>
                  <span className="font-mono-tabular">{Math.round(windVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={windVolume}
                  onChange={(e) => handleWindChange(parseFloat(e.target.value))}
                  className="w-full accent-[#D97706] h-1.5 bg-white/20 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[#D6CEBE]">
                  <span className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#D97706]" />
                    Acoustic Reverie
                  </span>
                  <span className="font-mono-tabular">{Math.round(musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
                  className="w-full accent-[#D97706] h-1.5 bg-white/20 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Joystick Controls Overlay */}
        {isMobileDevice && (
          <MobileControlsOverlay
            onMoveVectorChange={setMobileMoveVector}
            onTurn={(delta) => {
              setMobileTurnDelta(delta);
              setTimeout(() => setMobileTurnDelta(0), 120);
            }}
          />
        )}

        {/* Study Modal */}
        <CatalogModal
          isOpen={catalogModalOpen}
          initialTab={catalogModalTab}
          inspectedArtwork={inspectedArtwork}
          onClose={() => setCatalogModalOpen(false)}
          onWalkToArtwork={handleWalkToInPavilion}
        />
      </div>
    );
  }

  // =========================================================================
  // MODE 2: SCROLLABLE ARTIST MONOGRAPH WEBSITE WITH 3D ELEMENTS & CATALOGUE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#12100E] text-[#FBF9F5] selection:bg-[#D97706]/30 selection:text-white">
      {/* 1. STICKY TOP HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#12100E]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <a
            href="#monograph"
            className="text-xl sm:text-2xl font-serif-display font-semibold tracking-tight text-[#FBF9F5] hover:text-[#D97706] transition-colors"
          >
            ReddyMade
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#D6CEBE]">
            <a href="#monograph" className="hover:text-white transition-colors">
              Artist Monograph
            </a>
            <a href="#highlights" className="hover:text-white transition-colors">
              Featured Highlights
            </a>
            <button
              onClick={() => handleEnter3DPavilion()}
              className="hover:text-white transition-colors cursor-pointer"
            >
              3D Pavilion
            </button>
            <a href="#catalogue" className="hover:text-white transition-colors">
              Exhibition Catalogue ({REDDYMADE_ARTWORKS.length})
            </a>
            <a href="#materials" className="hover:text-white transition-colors">
              Material Language
            </a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Ambient Soundscape Toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#D6CEBE] hover:text-white transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
              title={isMuted ? 'Play Soundscape' : 'Mute Soundscape'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#D97706]" />
              )}
              <span className="hidden lg:inline">{isMuted ? 'Sound Off' : 'Soundscape'}</span>
            </button>


            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#FBF9F5]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-white/10 mt-3 space-y-2 text-sm font-medium">
            <a
              href="#monograph"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/5 text-[#FBF9F5]"
            >
              Artist Monograph
            </a>
            <a
              href="#highlights"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/5 text-[#FBF9F5]"
            >
              Featured Highlights
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleEnter3DPavilion();
              }}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-[#FBF9F5]"
            >
              3D Pavilion Experience
            </button>
            <a
              href="#catalogue"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/5 text-[#FBF9F5]"
            >
              Complete Catalogue ({REDDYMADE_ARTWORKS.length})
            </a>
            <a
              href="#materials"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/5 text-[#FBF9F5]"
            >
              Material Language
            </a>
          </div>
        )}
      </header>

      {/* 2. SECTION 1: HERO — ARTIST MONOGRAPH & PORTRAIT */}
      <section id="monograph" className="relative pt-10 sm:pt-16 md:pt-20 pb-16 px-4 sm:px-6 md:px-8 border-b border-white/10 overflow-hidden">
        {/* Subtle background ambient warm light */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D97706]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
          {/* Monumental Title */}
          <div className="space-y-4 max-w-5xl">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif-display font-medium text-[#FBF9F5] tracking-tight leading-[1.08]">
              Justin Reddy: Chronicling Island Heritage &amp; Equatorial Color
            </h1>
          </div>

          {/* Main Monograph Hero Layout: Artist Portrait + Monograph Text + Contact Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: The Artist Photograph (Softly blended with page background) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-0 bg-[#D97706]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
                <img
                  src="/assets/aistudio/1c50f416-f25a-4ae9-a6c7-9e4d24d606e8_7d8a3546.JPG"
                  alt="Justin Reddy"
                  className="w-full h-auto object-cover max-h-[500px] rounded-3xl opacity-90 transition-opacity duration-300 hover:opacity-100"
                  style={{
                    maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 58%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 58%, transparent 100%)',
                  }}
                />
              </div>
            </div>

            {/* Right: The Monograph Text & Contact Info */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <div className="space-y-6">
                <p className="text-lg sm:text-xl md:text-2xl text-[#FBF9F5] font-serif-display leading-relaxed">
                  Seychellois artist Justin Reddy creates under the studio banner of ReddyMade, synthesizing the sensory world of the Seychelles archipelago. His body of work bridges diverse expressive media: contemplative charcoal drawings capturing Creole architecture, monumental hardwood carvings and masks, coral plaster wall reliefs, expressive reclaimed-timber portraits, corrugated cardboard readymade collages, and vibrant cubist acrylics.
                </p>

                {/* Navigation CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#catalogue"
                    className="px-5 py-3 rounded-lg bg-[#FBF9F5] text-[#1C1917] hover:bg-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Browse Collection ({REDDYMADE_ARTWORKS.length} Works)</span>
                    <ArrowDown className="w-4 h-4 text-[#9A3412]" />
                  </a>

                  <button
                    onClick={() => handleEnter3DPavilion()}
                    className="px-5 py-3 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#D97706]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Enter 3D Virtual Pavilion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 2: FEATURED MASTERWORKS CAROUSEL */}
      <section id="highlights" className="py-16 sm:py-20 px-4 sm:px-6 md:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-4xl font-serif-display font-medium text-[#FBF9F5]">
                Featured Works
              </h2>
            </div>
          </div>

          <MasterworksCarousel
            onSelectArtworkForInspect={handleInspectArtwork}
            onFilterCategoryAndScroll={handleFilterCategoryAndScroll}
            onWalkToInPavilion={handleWalkToInPavilion}
          />
        </div>
      </section>

      {/* 4. SECTION 3: COMPLETE EXHIBITION CATALOGUE (ON-PAGE) */}
      <section
        id="catalogue"
        ref={catalogueSectionRef}
        className="py-16 sm:py-20 px-4 sm:px-6 md:px-8 border-b border-white/10 bg-[#161311]"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header & Search */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-tabular uppercase tracking-widest text-[#D97706]">
                <span>EXHIBITION CATALOGUE</span>
                <span aria-hidden="true">·</span>
                <span>{REDDYMADE_ARTWORKS.length} WORKS ARCHIVED</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-display font-medium text-[#FBF9F5] mt-1.5">
                Complete Collection Catalogue
              </h2>
              <p className="text-xs sm:text-sm text-[#A8A29E] mt-1.5 max-w-2xl leading-relaxed">
                Filter by media category, search across titles, series, or accession codes, and open any plate for high-resolution inspection.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles, media, series, year..."
                className="w-full pl-10 pr-8 py-2.5 text-xs bg-black/40 border border-white/15 rounded-xl text-[#FBF9F5] placeholder-[#78716C] focus:outline-none focus:border-[#D97706] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 max-w-full">
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
                className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-[#D97706] text-white shadow-md font-semibold'
                    : 'bg-white/5 text-[#D6CEBE] hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono-tabular px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.key ? 'bg-black/30 text-white' : 'bg-white/10 text-[#78716C]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Status Text */}
          <div className="flex items-center justify-between text-xs text-[#78716C] font-mono-tabular px-1">
            <span>
              Showing {onPageFilteredArtworks.length} of {REDDYMADE_ARTWORKS.length} works
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#D97706] hover:underline cursor-pointer"
              >
                Clear search filter
              </button>
            )}
          </div>

          {/* Artworks Grid */}
          {onPageFilteredArtworks.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-sm text-[#A8A29E]">No artworks match your search & category filters.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#D97706] text-white rounded-lg hover:bg-[#B45309] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-7">
              {onPageFilteredArtworks.map((art) => (
                <div
                  key={art.id}
                  className="group flex flex-col justify-between bg-[#1C1814] border border-white/10 rounded-2xl p-4 shadow-xl hover:border-white/20 transition-all duration-200"
                >
                  <div>
                    {/* Uncropped Artwork Frame */}
                    <div
                      onClick={() => handleInspectArtwork(art)}
                      className="relative w-full h-56 sm:h-64 bg-[#0F0D0C] border border-white/5 rounded-xl overflow-hidden cursor-pointer flex items-center justify-center p-2.5 mb-3.5 group-hover:border-[#D97706]/40 transition-colors"
                    >
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain rounded transition-transform duration-200 group-hover:scale-[1.02]"
                      />

                      {/* Plate Badge */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[#FBF9F5] text-[10px] font-mono-tabular">
                        Plate {art.indexNumber}
                      </div>
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] font-mono-tabular">
                      <span>{art.year}</span>
                    </div>

                    <h3
                      onClick={() => handleInspectArtwork(art)}
                      className="text-base sm:text-lg font-serif-display font-semibold text-[#FBF9F5] mt-1 group-hover:text-[#D97706] transition-colors cursor-pointer leading-snug line-clamp-2"
                    >
                      {art.title}
                    </h3>

                    <p className="text-xs text-[#A8A29E] mt-1 line-clamp-2 leading-relaxed">
                      {art.creoleSubtitle}
                    </p>

                    <div className="mt-2 text-[11px] font-medium text-[#78716C] truncate">
                      {art.medium}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleInspectArtwork(art)}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      Curatorial Monograph
                    </button>

                    {art.inPavilion ? (
                      <button
                        onClick={() => handleEnter3DPavilion(art)}
                        className="flex-1 py-2 text-xs font-semibold bg-[#D97706] text-white hover:bg-[#B45309] rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        Stand In 3D
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInspectArtwork(art)}
                        className="flex-1 py-2 text-xs font-medium bg-[#8C3827]/20 text-[#E0A824] hover:bg-[#8C3827]/30 rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        Studio Work
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. SECTION 4: THE DIVERSE MATERIAL LANGUAGE OF JUSTIN REDDY */}
      <section id="materials" className="py-20 sm:py-24 px-4 sm:px-6 md:px-8 border-b border-white/10 bg-[#12100E]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif-display font-medium text-[#FBF9F5] leading-tight">
              The Diverse Material Language of Justin Reddy
            </h2>
            <div className="w-16 h-0.5 bg-[#D97706]" />
          </div>

          <div className="space-y-6 text-base sm:text-lg text-[#D6CEBE] font-serif-display leading-relaxed">
            <p>
              Across five decades of artistic practice, Justin Reddy has explored a wide range of materials, from paper and papier-mâché to plastic bottle caps, discarded packaging, printed matter and sand.
            </p>
            <p>
              His practice is characterised by a continuing investigation into what materials can become beyond their conventional uses. Through experimentation, he discovers processes, relationships and systems that can lead to weaving, construction, assemblage, permutation, impression, transfer and repetition.
            </p>
            <p>
              Each material presents a different set of possibilities. Consequently, his work does not depend on a single technique or prescribed method. The process emerges through the encounter between the artist and the material, with experimentation capable of opening unexpected directions.
            </p>
            <p className="text-[#FBF9F5] font-medium pt-2 border-l-2 border-[#D97706] pl-4 italic">
              Within this evolving practice, Reddymade represents an approach in which discarded materials become the starting point for artistic investigation and discovery.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SECTION 5: CONTACT JUSTIN REDDY (BOTTOM ONLY) */}
      <section id="contact" className="py-20 px-4 sm:px-6 md:px-8 border-b border-white/10 bg-[#14110F]">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-3">
            <div className="text-xs font-mono-tabular uppercase tracking-widest text-[#D97706]">
              Direct Inquiries
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif-display font-medium text-[#FBF9F5]">
              Contact Justin Reddy
            </h2>
            <p className="text-xs sm:text-sm text-[#A8A29E] max-w-xl mx-auto leading-relaxed">
              For paintings, collaborations, and more information.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* Email */}
            <a
              href="mailto:justinsreddy@yahoo.co.uk"
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1C1814] hover:bg-white/5 border border-white/10 hover:border-[#D97706]/50 transition-all duration-200 group shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-[#D97706]/20 text-[#D97706] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-xs text-[#A8A29E] uppercase font-mono-tabular tracking-wider mb-1">
                Email
              </div>
              <div className="font-medium text-sm text-[#FBF9F5] group-hover:text-[#D97706] transition-colors break-all">
                justinsreddy@yahoo.co.uk
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/2482800101"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1C1814] hover:bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all duration-200 group shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.85-.38-4.09-1.11l-.29-.17-3.04.8 1.05-2.96-.19-.3a8.21 8.21 0 0 1-1.26-4.5c0-4.54 3.7-8.24 8.24-8.24zm4.51 11.58c-.25-.13-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.13-.17.25-.65.8-.8 1-.14.16-.29.18-.54.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.3-.23.25-.87.85-.87 2.08s.89 2.41 1.01 2.58c.13.16 1.75 2.67 4.24 3.74.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
                </svg>
              </div>
              <div className="text-xs text-[#A8A29E] uppercase font-mono-tabular tracking-wider mb-1">
                WhatsApp
              </div>
              <div className="font-medium text-sm text-[#FBF9F5] group-hover:text-emerald-400 transition-colors">
                +2482800101
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/autreintsgallery"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#1C1814] hover:bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all duration-200 group shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Instagram className="w-6 h-6" />
              </div>
              <div className="text-xs text-[#A8A29E] uppercase font-mono-tabular tracking-wider mb-1">
                Instagram
              </div>
              <div className="font-medium text-sm text-[#FBF9F5] group-hover:text-pink-400 transition-colors">
                @autreintsgallery
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 px-4 sm:px-6 md:px-8 border-t border-white/10 bg-[#0C0A09] text-xs text-[#78716C]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-1 text-center md:text-left">
              <div className="font-serif-display text-lg font-semibold text-[#FBF9F5]">
                ReddyMade — Justin Reddy Studio Archive
              </div>
              <p>Mahé, Seychelles · Chronicling Indian Ocean Vernacular &amp; Modernist Form</p>
            </div>

            {/* Contact links with logos */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <a
                href="mailto:justinsreddy@yahoo.co.uk"
                className="flex items-center gap-1.5 text-[#D6CEBE] hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#D97706]" />
                <span>justinsreddy@yahoo.co.uk</span>
              </a>
              <a
                href="https://wa.me/2482800101"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#D6CEBE] hover:text-emerald-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current text-emerald-400" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.44 0-2.85-.38-4.09-1.11l-.29-.17-3.04.8 1.05-2.96-.19-.3a8.21 8.21 0 0 1-1.26-4.5c0-4.54 3.7-8.24 8.24-8.24zm4.51 11.58c-.25-.13-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.13-.17.25-.65.8-.8 1-.14.16-.29.18-.54.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.3-.23.25-.87.85-.87 2.08s.89 2.41 1.01 2.58c.13.16 1.75 2.67 4.24 3.74.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z" />
                </svg>
                <span>+2482800101</span>
              </a>
              <a
                href="https://instagram.com/autreintsgallery"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#D6CEBE] hover:text-pink-400 transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>@autreintsgallery</span>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <a href="#monograph" className="hover:text-white transition-colors">
                Monograph
              </a>
              <a href="#highlights" className="hover:text-white transition-colors">
                Highlights
              </a>
              <button
                onClick={() => handleEnter3DPavilion()}
                className="hover:text-white transition-colors cursor-pointer"
              >
                3D Pavilion
              </button>
              <a href="#catalogue" className="hover:text-white transition-colors">
                Catalogue ({REDDYMADE_ARTWORKS.length})
              </a>
              <a href="#materials" className="hover:text-white transition-colors">
                Material Language
              </a>
            </div>
            <div className="text-right text-[#78716C] text-xs">
              © {new Date().getFullYear()} Justin Reddy
            </div>
          </div>
        </div>
      </footer>

      {/* Study Modal */}
      <CatalogModal
        isOpen={catalogModalOpen}
        initialTab={catalogModalTab}
        inspectedArtwork={inspectedArtwork}
        onClose={() => setCatalogModalOpen(false)}
        onWalkToArtwork={handleWalkToInPavilion}
      />
    </div>
  );
}
