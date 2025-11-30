import React, { useRef, useState } from 'react';
import { Track, Clip } from '../types';
import { Video, Image as ImageIcon, Music, Lock, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

interface TimelineProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onImportClip: (file: File, trackId: string, type: 'video' | 'audio') => void;
  onClearTrack: (trackId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ tracks, currentTime, duration, onSeek, onImportClip, onClearTrack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importingTrackId, setImportingTrackId] = useState<string | null>(null);
  const [importingType, setImportingType] = useState<'video' | 'audio'>('video');

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const handlePlusClick = (trackId: string, type: 'video' | 'audio') => {
    setImportingTrackId(trackId);
    setImportingType(type);
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && importingTrackId) {
          onImportClip(file, importingTrackId, importingType);
      }
      setImportingTrackId(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 border-t border-zinc-800 select-none">
      {/* Hidden File Input for Track Headers */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        accept={importingType === 'audio' ? 'audio/*' : 'video/*'} 
        onChange={handleFileChange}
      />

      {/* Time Ruler */}
      <div 
        className="h-8 bg-zinc-950 border-b border-zinc-800 relative cursor-pointer"
        onClick={handleTimelineClick}
      >
        <div 
          className="absolute top-0 bottom-0 bg-red-500 w-0.5 z-20 pointer-events-none transition-all duration-100 ease-linear"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="w-3 h-3 bg-red-500 transform -translate-x-1.5 rotate-45 -mt-1.5" />
        </div>
        <div className="flex justify-between px-2 text-xs text-zinc-500 pt-2">
          <span>00:00</span>
          <span>{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Tracks Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2">
        {tracks.map((track) => {
            const isAudio = track.name.toLowerCase().includes('audio') || track.name.toLowerCase().includes('sound');
            const isInput = track.id.startsWith('t_input');
            const hasClips = track.clips.length > 0;
            
            return (
                <div key={track.id} className="flex h-16 group">
                    {/* Track Header */}
                    <div className="w-48 bg-zinc-800 rounded-l-md border-r border-zinc-700 flex flex-col p-2 justify-between shrink-0 relative">
                    <div className="flex items-center justify-between text-zinc-300">
                        <span className="text-sm font-medium truncate w-24">{track.name}</span>
                        <div className="flex space-x-1">
                            {!isInput && (
                                <>
                                    <button className="p-1 hover:text-white"><Lock size={12} /></button>
                                    <button className="p-1 hover:text-white">
                                        {track.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                         <div className="text-zinc-500 text-xs flex items-center gap-1">
                            {isAudio ? <Music size={10} /> : <Video size={10} />}
                            <span>{isInput ? 'Source' : 'Track'}</span>
                        </div>

                        {/* Input Controls (Add/Remove) */}
                        {isInput && (
                            <div className="flex gap-1">
                                {hasClips && (
                                    <button 
                                        onClick={() => onClearTrack(track.id)}
                                        className="p-1 bg-zinc-900 rounded hover:bg-red-900 hover:text-red-300 text-zinc-500 transition-colors"
                                        title="Clear Track"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handlePlusClick(track.id, isAudio ? 'audio' : 'video')}
                                    className="p-1 bg-zinc-900 rounded hover:bg-cyan-900 hover:text-cyan-300 text-zinc-500 transition-colors"
                                    title="Add Clip"
                                >
                                    <Plus size={10} />
                                </button>
                            </div>
                        )}
                    </div>
                   
                    </div>

                    {/* Track Content */}
                    <div 
                    className="flex-1 bg-zinc-900/50 relative rounded-r-md border border-zinc-800"
                    onClick={handleTimelineClick}
                    >
                    {track.clips.map((clip) => {
                        const left = (clip.start / duration) * 100;
                        const width = (clip.duration / duration) * 100;
                        
                        return (
                        <div
                            key={clip.id}
                            className={`absolute top-1 bottom-1 rounded-md border cursor-move flex items-center overflow-hidden px-2 hover:opacity-90 transition-opacity ${
                                isAudio ? 'bg-emerald-600/80 border-emerald-500/50' : 'bg-indigo-600/80 border-indigo-500/50'
                            }`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                        >
                            {clip.thumbnail && !isAudio && (
                                <img src={clip.thumbnail} alt="" className="h-full w-auto object-cover mr-2 rounded opacity-70" />
                            )}
                            <span className="text-xs text-white truncate drop-shadow-md flex items-center gap-1">
                                {isAudio && <Music size={10} />}
                                {clip.name}
                            </span>
                        </div>
                        );
                    })}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default Timeline;