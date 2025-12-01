
import React, { useState, useRef } from 'react';
import { Clip, MaskPoint } from '../types';
import { Play, Pause, SkipBack, SkipForward, Maximize, Eye, EyeOff, Plus, Minus, MousePointer2 } from 'lucide-react';

interface ViewportProps {
  currentClip?: Clip;
  isPlaying: boolean;
  onTogglePlay: () => void;
  generatedAsset?: { url: string; type: 'video'|'image' } | null;
  inputVideoUrl?: string;
  // Interactive Masking Props
  maskingMode?: 'include' | 'exclude' | null;
  maskPoints?: MaskPoint[];
  onMaskClick?: (x: number, y: number) => void;
}

const Viewport: React.FC<ViewportProps> = ({ 
  currentClip, isPlaying, onTogglePlay, generatedAsset, inputVideoUrl,
  maskingMode, maskPoints = [], onMaskClick
}) => {
  const [showInput, setShowInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Determine what to show
  const displayUrl = (() => {
    if (generatedAsset) {
        return showInput && inputVideoUrl ? inputVideoUrl : generatedAsset.url;
    }
    if (currentClip?.url) return currentClip.url;
    if (inputVideoUrl) return inputVideoUrl;
    return null;
  })();

  const isDisplayingVideo = (() => {
      if (generatedAsset && !showInput) return generatedAsset.type === 'video';
      if (generatedAsset && showInput) return true; // Input is assumed video
      if (currentClip) return currentClip.type === 'video';
      if (inputVideoUrl) return true;
      return false;
  })();

  const label = (() => {
      if (generatedAsset) return showInput ? "BEFORE (Input)" : "AFTER (Result)";
      if (currentClip) return `CLIP: ${currentClip.name}`;
      if (inputVideoUrl) return "SOURCE INPUT";
      return "No Active Clip";
  })();

  const handleMaskClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!maskingMode || !onMaskClick || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Clamp to 0-1 just in case
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));
    
    onMaskClick(clampedX, clampedY);
  };

  return (
    <div className="flex-1 bg-black relative flex flex-col overflow-hidden group">
      {/* Canvas / Video Area */}
      <div 
        ref={containerRef}
        onClick={handleMaskClick}
        className={`flex-1 relative flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] 
        ${maskingMode ? 'cursor-crosshair' : 'cursor-default'}`}
      >
        
        {displayUrl ? (
             isDisplayingVideo ? (
                <video 
                    src={displayUrl} 
                    className="max-h-full max-w-full shadow-2xl pointer-events-none" 
                    controls={!isPlaying} 
                    autoPlay={isPlaying || !!generatedAsset}
                    loop
                    muted={!!generatedAsset && !showInput} 
                />
             ) : (
                <img 
                    src={displayUrl} 
                    className="max-h-full max-w-full shadow-2xl pointer-events-none" 
                    alt="Content" 
                />
             )
        ) : (
             currentClip && currentClip.type !== 'video' ? (
                 <img src={currentClip.thumbnail || "https://picsum.photos/800/450"} className="max-h-full max-w-full pointer-events-none" alt="Clip" />
             ) : (
                <div className="text-zinc-700 flex flex-col items-center select-none pointer-events-none">
                    <h1 className="text-4xl font-black tracking-tighter text-zinc-800 mb-2">MUNZGEN AI</h1>
                    <p className="text-sm tracking-widest uppercase">No Active Clip</p>
                </div>
             )
        )}

        {/* MASKING OVERLAY (Points) */}
        {maskPoints.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
             {maskPoints.map((point) => (
                <div 
                  key={point.id}
                  className={`absolute w-4 h-4 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center
                  ${point.type === 'include' ? 'border-green-400 bg-green-500/30' : 'border-red-400 bg-red-500/30'}`}
                  style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                >
                   {point.type === 'include' ? <Plus size={10} className="text-white"/> : <Minus size={10} className="text-white"/>}
                </div>
             ))}
          </div>
        )}

        {/* MASKING MODE INDICATOR */}
        {maskingMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur border border-zinc-700 rounded-full px-4 py-1.5 flex items-center gap-2 pointer-events-none animate-pulse z-20">
             {maskingMode === 'include' ? <Plus size={16} className="text-green-400"/> : <Minus size={16} className="text-red-400"/>}
             <span className={`text-xs font-bold uppercase ${maskingMode === 'include' ? 'text-green-400' : 'text-red-400'}`}>
                {maskingMode === 'include' ? "Select Area to Keep" : "Select Area to Exclude"}
             </span>
             <span className="text-[10px] text-zinc-500 ml-2">Click on video</span>
          </div>
        )}

        {/* Overlay Guides (Simulated VFX Interface) */}
        {!maskingMode && (
          <div className="absolute inset-0 pointer-events-none p-8 opacity-30">
              <div className="w-full h-full border border-zinc-600/30 border-dashed relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-500"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-500"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-500"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-500"></div>
              </div>
          </div>
        )}

        {/* Comparison Label */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-zinc-800 text-xs font-bold text-white flex items-center gap-2">
            <span className={showInput ? 'text-zinc-400' : 'text-cyan-400'}>
                {label}
            </span>
        </div>

        {/* Comparison Toggle (Only if Generated + Input exist) */}
        {generatedAsset && inputVideoUrl && (
            <button
                onMouseDown={() => setShowInput(true)}
                onMouseUp={() => setShowInput(false)}
                onMouseLeave={() => setShowInput(false)}
                className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded border border-zinc-800 text-xs font-bold text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer z-20"
            >
                {showInput ? <Eye size={14} className="text-zinc-400"/> : <EyeOff size={14} className="text-cyan-400" />}
                Hold to Compare
            </button>
        )}
      </div>

      {/* Transport Controls */}
      <div className="h-12 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-6 text-zinc-400 z-10 relative">
        <button className="hover:text-white transition-colors"><SkipBack size={20} /></button>
        <button 
            className="w-8 h-8 rounded-full bg-zinc-200 text-black flex items-center justify-center hover:bg-white hover:scale-105 transition-all"
            onClick={onTogglePlay}
        >
            {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-0.5" />}
        </button>
        <button className="hover:text-white transition-colors"><SkipForward size={20} /></button>
        <div className="w-px h-6 bg-zinc-800 mx-2"></div>
        <button className="hover:text-cyan-400 transition-colors"><Maximize size={18} /></button>
      </div>
    </div>
  );
};

export default Viewport;
