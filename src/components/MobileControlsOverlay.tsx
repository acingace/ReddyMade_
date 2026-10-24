import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Compass,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';

interface MobileControlsOverlayProps {
  onMoveVectorChange: (vec: { x: number; z: number } | null) => void;
  onTurn: (delta: number) => void;
  onToggleMiniMap?: () => void;
  miniMapOpen?: boolean;
}

export const MobileControlsOverlay: React.FC<MobileControlsOverlayProps> = ({
  onMoveVectorChange,
  onTurn,
  onToggleMiniMap,
  miniMapOpen = false,
}) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

  const startMove = (dir: 'forward' | 'backward' | 'left' | 'right') => {
    setActiveDirection(dir);
    if (dir === 'forward') onMoveVectorChange({ x: 0, z: 1 });
    else if (dir === 'backward') onMoveVectorChange({ x: 0, z: -1 });
    else if (dir === 'left') onMoveVectorChange({ x: -1, z: 0 });
    else if (dir === 'right') onMoveVectorChange({ x: 1, z: 0 });
  };

  const stopMove = () => {
    setActiveDirection(null);
    onMoveVectorChange(null);
  };

  return (
    <div className="pointer-events-none select-none z-20">
      {/* Visibility Toggle Button for Mobile Screen Cleanliness */}
      <div className="pointer-events-auto fixed bottom-20 left-3 md:hidden z-20">
        <button
          onClick={() => setControlsVisible(!controlsVisible)}
          className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[#D6CEBE] hover:text-white transition-colors shadow-lg active:scale-95"
          title={controlsVisible ? 'Hide D-Pad' : 'Show Walk Controls'}
          aria-label="Toggle Walk Controls"
        >
          {controlsVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {controlsVisible && (
        <div className="pointer-events-auto fixed bottom-28 left-3 md:hidden flex flex-col items-center gap-2">
          {/* Virtual 4-Way D-Pad for Touch Devices */}
          <div className="relative w-32 h-32 bg-black/60 backdrop-blur-md border border-white/20 rounded-full p-2 shadow-2xl flex items-center justify-center">
            {/* Center Hub with Mini-Map quick trigger */}
            {onToggleMiniMap && (
              <button
                onClick={onToggleMiniMap}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-xs ${
                  miniMapOpen
                    ? 'bg-[#D97706] text-white'
                    : 'bg-white/15 text-[#D6CEBE] hover:text-white'
                }`}
                title="Toggle Floorplan Map"
              >
                <Compass className="w-4 h-4" />
              </button>
            )}

            {/* UP / Forward Button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                startMove('forward');
              }}
              onPointerUp={stopMove}
              onPointerLeave={stopMove}
              className={`absolute top-1 left-1/2 -translate-x-1/2 w-10 h-9 flex items-center justify-center rounded-t-xl transition-all ${
                activeDirection === 'forward'
                  ? 'bg-[#D97706] text-white scale-95'
                  : 'text-[#FBF9F5] hover:bg-white/15 active:bg-[#D97706]'
              }`}
              aria-label="Move Forward"
            >
              <ChevronUp className="w-6 h-6" />
            </button>

            {/* DOWN / Backward Button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                startMove('backward');
              }}
              onPointerUp={stopMove}
              onPointerLeave={stopMove}
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-9 flex items-center justify-center rounded-b-xl transition-all ${
                activeDirection === 'backward'
                  ? 'bg-[#D97706] text-white scale-95'
                  : 'text-[#FBF9F5] hover:bg-white/15 active:bg-[#D97706]'
              }`}
              aria-label="Move Backward"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            {/* LEFT / Strafe Left Button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                startMove('left');
              }}
              onPointerUp={stopMove}
              onPointerLeave={stopMove}
              className={`absolute left-1 top-1/2 -translate-y-1/2 w-9 h-10 flex items-center justify-center rounded-l-xl transition-all ${
                activeDirection === 'left'
                  ? 'bg-[#D97706] text-white scale-95'
                  : 'text-[#FBF9F5] hover:bg-white/15 active:bg-[#D97706]'
              }`}
              aria-label="Step Left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* RIGHT / Strafe Right Button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                startMove('right');
              }}
              onPointerUp={stopMove}
              onPointerLeave={stopMove}
              className={`absolute right-1 top-1/2 -translate-y-1/2 w-9 h-10 flex items-center justify-center rounded-r-xl transition-all ${
                activeDirection === 'right'
                  ? 'bg-[#D97706] text-white scale-95'
                  : 'text-[#FBF9F5] hover:bg-white/15 active:bg-[#D97706]'
              }`}
              aria-label="Step Right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Turn Left / Right Touch Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTurn(0.18)}
              className="px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[#D6CEBE] active:text-white active:bg-white/20 transition-all flex items-center gap-1 text-[11px]"
              title="Turn Left"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Turn</span>
            </button>
            <button
              onClick={() => onTurn(-0.18)}
              className="px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[#D6CEBE] active:text-white active:bg-white/20 transition-all flex items-center gap-1 text-[11px]"
              title="Turn Right"
            >
              <span>Turn</span>
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
