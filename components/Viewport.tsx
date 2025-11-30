import React, { useState } from 'react';
import { Clip } from '../types';
import { Play, Pause, SkipBack, SkipForward, Maximize, Eye, EyeOff, SplitSquareHorizontal } from 'lucide-react';

interface ViewportProps {
  currentClip?: Clip;
  isPlaying: boolean;
  onTogglePlay: () => void;
  generatedAsset?: { url: string; type: 'video'|'image' } | null;
  inputVideoUrl?: string;
}

const Viewport: React.FC<ViewportProps> = ({ currentClip, isPlaying, onTogglePlay, generatedAsset, inputVideoUrl }) => {
  const [showInput, setShowInput] = useState(false);
  
  // Determine what to show
  // Priority: 
  // 1. Comparison Mode (if generated exists and showInput is true) -> Show Input
  // 2. Generated Asset (if exists) -> Show Result
  // 3. Current Clip (from Timeline playhead) -> Show Clip
  // 4. Input Video (if no generated yet, but input exists) -> Show Input Source
  
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

  return (
    <div className="flex-1 bg-black relative flex flex-col overflow-hidden group">
      {/* Canvas / Video Area */}
      <div className="flex-1 relative flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
        
        {displayUrl ? (
             isDisplayingVideo ? (
                <video 
                    src={displayUrl} 
                    className="max-h-full max-w-full shadow-2xl" 
                    controls={!isPlaying} 
                    autoPlay={isPlaying || !!generatedAsset}
                    loop
                    muted={!!generatedAsset && !showInput} // Mute result if it has no audio usually, or just safety
                />
             ) : (
                <img 
                    src={displayUrl} 
                    className="max-h-full max-w-full shadow-2xl" 
                    alt="Content" 
                />
             )
        ) : (
             currentClip && currentClip.type !== 'video' ? (
                 <img src={currentClip.thumbnail || "https://picsum.photos/800/450"} className="max-h-full max-w-full" alt="Clip" />
             ) : (
                <div className="text-zinc-700 flex flex-col items-center select-none">
                    <h1 className="text-4xl font-black tracking-tighter text-zinc-800 mb-2">MUNZGEN AI</h1>
                    <p className="text-sm tracking-widest uppercase">No Active Clip</p>
                </div>
             )
        )}

        {/* Overlay Guides (Simulated VFX Interface) */}
        <div className="absolute inset-0 pointer-events-none p-8 opacity-30">
            <div className="w-full h-full border border-zinc-600/30 border-dashed relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-500"></div>
            </div>
        </div>

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