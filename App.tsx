
import React, { useState, useEffect } from 'react';
import { ViewMode, ToolType, Track, Clip, MaskPoint } from './types';
import Timeline from './components/Timeline';
import ControlPanel from './components/ControlPanel';
import Viewport from './components/Viewport';
import ScriptPanel from './components/ScriptPanel';
import { 
  Layers, Film, Clapperboard, Download, Settings, Menu, 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown 
} from 'lucide-react';
import { checkApiKeySelection, promptApiKeySelection } from './services/geminiService';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.EDITOR);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.SELECT);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Resizing State
  const [isResizing, setIsResizing] = useState<'timeline' | 'control' | 'script' | null>(null);
  const [timelineHeight, setTimelineHeight] = useState(256);
  const [controlPanelWidth, setControlPanelWidth] = useState(320);
  const [scriptPanelWidth, setScriptPanelWidth] = useState(384);

  // Minimize State
  const [minimized, setMinimized] = useState({
    timeline: false,
    control: false,
    script: false
  });

  // Masking State (Pro AI Suite)
  const [maskingMode, setMaskingMode] = useState<'include' | 'exclude' | null>(null);
  const [maskPoints, setMaskPoints] = useState<MaskPoint[]>([]);

  // Generated result to show in viewport
  const [lastGenerated, setLastGenerated] = useState<{ url: string; type: 'video' | 'image' } | null>(null);

  // Mock Data
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 't_input_v',
      name: 'Input Video',
      locked: false,
      visible: true,
      clips: []
    },
    {
      id: 't_input_a',
      name: 'Input Audio',
      locked: false,
      visible: true,
      clips: []
    },
    {
      id: 't1',
      name: 'Main Video',
      locked: false,
      visible: true,
      clips: [
        { id: 'c1', name: 'Desert Scene', type: 'video', start: 0, duration: 5, trackId: 't1', thumbnail: 'https://picsum.photos/200/100?random=1' },
        { id: 'c2', name: 'Cyber City', type: 'video', start: 6, duration: 4, trackId: 't1', thumbnail: 'https://picsum.photos/200/100?random=2' },
      ]
    },
    {
      id: 't2',
      name: 'VFX Layer',
      locked: false,
      visible: true,
      clips: [
        { id: 'c3', name: 'Explosion', type: 'image', start: 3, duration: 2, trackId: 't2', thumbnail: 'https://picsum.photos/200/100?random=3' }
      ]
    }
  ]);

  // Derive Input Video URL for Before/After comparison
  const inputVideoTrack = tracks.find(t => t.id === 't_input_v');
  const inputAudioTrack = tracks.find(t => t.id === 't_input_a');
  
  const inputVideoClip = inputVideoTrack?.clips.length ? inputVideoTrack.clips[0] : undefined;
  const inputAudioClip = inputAudioTrack?.clips.length ? inputAudioTrack.clips[0] : undefined;

  const inputVideoUrl = inputVideoClip?.type === 'video' ? inputVideoClip.url : undefined;

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
           if(prev >= 30) {
               setIsPlaying(false);
               return 0;
           }
           return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (isResizing === 'timeline') {
        // Resize Timeline (from bottom up)
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 100 && newHeight < window.innerHeight - 100) {
            setTimelineHeight(newHeight);
        }
      } else if (isResizing === 'control') {
        // Resize Control Panel (Right Side, drag left to increase)
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 200 && newWidth < 800) {
            setControlPanelWidth(newWidth);
        }
      } else if (isResizing === 'script') {
        // Resize Script Panel (Left Side, drag right to increase)
        const newWidth = e.clientX;
        if (newWidth > 200 && newWidth < 1000) {
            setScriptPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizing === 'timeline' ? 'row-resize' : 'col-resize';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizing]);


  const handleAssetGenerated = (url: string, type: 'video' | 'image', prompt: string) => {
    setLastGenerated({ url, type });
  };

  const handleScriptToPrompt = (text: string) => {
    setViewMode(ViewMode.EDITOR);
    setActiveTool(ToolType.MAGIC_VFX);
    alert("Script copied to clipboard for prompt: " + text.substring(0, 50) + "...");
    navigator.clipboard.writeText(text);
  };
  
  const handleLoadTemplate = (newTracks: Track[]) => {
      // Confirm with user if tracks are not empty? Skipping for simplicity in this demo.
      setTracks(newTracks);
  };
  
  const handleImportClip = (file: File, trackId: string, type: 'video' | 'audio') => {
    const url = URL.createObjectURL(file);
    const newClip: Clip = {
        id: `clip_${Date.now()}`,
        name: file.name,
        type: type,
        start: 0,
        duration: 10, // Default duration, mock value
        trackId: trackId,
        url: url,
        thumbnail: type === 'video' ? 'https://picsum.photos/200/100?grayscale' : undefined 
    };
    
    setTracks(prev => prev.map(t => {
        if (t.id === trackId) {
             // For input tracks, wipe existing to enforce single slot if needed, or append.
             // Given the UI shows single input in Control Panel, replacing is cleaner for Inputs.
             if (trackId === 't_input_v' || trackId === 't_input_a') {
                 return { ...t, clips: [newClip] };
             }
             return { ...t, clips: [...t.clips, newClip] };
        }
        return t;
    }));
  };

  const handleClearTrack = (trackId: string) => {
    setTracks(prev => prev.map(t => {
        if (t.id === trackId) {
            return { ...t, clips: [] };
        }
        return t;
    }));
  };

  const handleConnectKey = async () => {
      await promptApiKeySelection();
  };

  const toggleMinimize = (panel: 'timeline' | 'control' | 'script') => {
    setMinimized(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  const handleMaskClick = (x: number, y: number) => {
    if (!maskingMode) return;
    const newPoint: MaskPoint = {
      id: Date.now().toString(),
      x,
      y,
      type: maskingMode
    };
    setMaskPoints([...maskPoints, newPoint]);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      
      {/* Header */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded flex items-center justify-center font-bold text-lg">M</div>
          <span className="font-bold tracking-tight text-zinc-100">MunzGen <span className="text-cyan-400">AI</span></span>
          <div className="h-6 w-px bg-zinc-700 mx-2"></div>
          <nav className="flex gap-1 bg-zinc-800 p-1 rounded-md">
            <button 
              onClick={() => setViewMode(ViewMode.EDITOR)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === ViewMode.EDITOR ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setViewMode(ViewMode.SCRIPT)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === ViewMode.SCRIPT ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Screenplay
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
           <button 
            onClick={handleConnectKey}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded transition-colors text-zinc-300"
          >
             🔑 Connect Key
          </button>
          <button className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-cyan-400 transition-colors">
            <Settings size={18} />
          </button>
          <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {viewMode === ViewMode.SCRIPT ? (
           <div className="flex w-full h-full">
             <div 
                style={{ width: minimized.script ? 40 : scriptPanelWidth }} 
                className="shrink-0 relative transition-all duration-300 ease-in-out border-r border-zinc-800 bg-zinc-900"
             >
                {minimized.script ? (
                    <div className="w-full h-full flex flex-col items-center pt-4 gap-4">
                        <button 
                            onClick={() => toggleMinimize('script')}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-cyan-400 border border-zinc-700"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <span className="writing-vertical-rl text-zinc-500 text-xs font-bold tracking-widest uppercase rotate-180">Screenplay Panel</span>
                    </div>
                ) : (
                    <ScriptPanel onUseScript={handleScriptToPrompt} />
                )}
             </div>
             
             {/* Script Resize Handle */}
             <div 
               className={`w-1 bg-zinc-900 hover:bg-cyan-500 z-30 transition-colors h-full flex items-center justify-center group relative ${minimized.script ? 'cursor-default pointer-events-none' : 'cursor-col-resize'}`}
               onMouseDown={() => !minimized.script && setIsResizing('script')}
             >
                <div className={`h-8 w-1 bg-zinc-700 group-hover:bg-cyan-300 rounded ${minimized.script ? 'hidden' : ''}`}></div>
                
                {/* Minimize Button */}
                {!minimized.script && (
                    <button 
                        onClick={() => { toggleMinimize('script'); }}
                        className="absolute top-4 left-2 bg-zinc-800 p-1 rounded-full border border-zinc-700 text-zinc-400 hover:text-cyan-400 z-40 shadow-lg"
                    >
                        <ChevronLeft size={14} />
                    </button>
                )}
             </div>

             <div className="flex-1 bg-zinc-950 flex items-center justify-center p-12 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <div className="text-center max-w-md">
                    <Clapperboard size={64} className="mx-auto mb-6 text-zinc-700" />
                    <h2 className="text-2xl font-bold text-zinc-500 mb-2">Screenplay Mode</h2>
                    <p className="text-zinc-600">Write your story here. Use the AI generator to create scenes, then send them to the VFX Editor to visualize them.</p>
                </div>
             </div>
           </div>
        ) : (
          <>
            {/* Left Tools */}
            <div className="w-14 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-4 shrink-0 z-20">
              <button className="p-2 bg-zinc-800 rounded text-cyan-400"><Layers size={20} /></button>
              <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400"><Film size={20} /></button>
              <div className="h-px w-8 bg-zinc-800 my-2"></div>
              <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400"><Menu size={20} /></button>
            </div>

            {/* Editor Workspace */}
            <div className="flex-1 flex flex-col min-w-0">
               <div className="flex-1 flex min-h-0 relative">
                  <Viewport 
                    isPlaying={isPlaying} 
                    onTogglePlay={() => setIsPlaying(!isPlaying)} 
                    generatedAsset={lastGenerated}
                    currentClip={tracks[2].clips.find(c => currentTime >= c.start && currentTime < c.start + c.duration)}
                    inputVideoUrl={inputVideoUrl}
                    maskingMode={maskingMode}
                    maskPoints={maskPoints}
                    onMaskClick={handleMaskClick}
                  />
                  
                  {/* Control Panel Resize Handle */}
                  <div 
                    className={`w-1 bg-zinc-900 hover:bg-cyan-500 z-30 transition-colors h-full flex items-center justify-center group relative ${minimized.control ? 'cursor-default pointer-events-none' : 'cursor-col-resize'}`}
                    onMouseDown={() => !minimized.control && setIsResizing('control')}
                  >
                     <div className={`h-8 w-1 bg-zinc-700 group-hover:bg-cyan-300 rounded ${minimized.control ? 'hidden' : ''}`}></div>

                     {/* Minimize Button */}
                    {!minimized.control && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleMinimize('control'); }}
                            className="absolute top-4 right-2 bg-zinc-800 p-1 rounded-full border border-zinc-700 text-zinc-400 hover:text-cyan-400 z-40 shadow-lg"
                        >
                            <ChevronRight size={14} />
                        </button>
                    )}
                  </div>

                  <div 
                    style={{ width: minimized.control ? 40 : controlPanelWidth }} 
                    className="shrink-0 relative transition-all duration-300 ease-in-out border-l border-zinc-800 bg-zinc-900"
                  >
                     {minimized.control ? (
                        <div className="w-full h-full flex flex-col items-center pt-4 gap-4">
                            <button 
                                onClick={() => toggleMinimize('control')}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-cyan-400 border border-zinc-700"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="writing-vertical-rl text-zinc-500 text-xs font-bold tracking-widest uppercase">Tools & Settings</span>
                        </div>
                     ) : (
                        <ControlPanel 
                            activeTool={activeTool} 
                            setActiveTool={setActiveTool} 
                            onAssetGenerated={handleAssetGenerated}
                            onLoadTemplate={handleLoadTemplate}
                            onImportClip={handleImportClip}
                            onClearTrack={handleClearTrack}
                            inputVideoClip={inputVideoClip}
                            inputAudioClip={inputAudioClip}
                            maskingMode={maskingMode}
                            setMaskingMode={setMaskingMode}
                            maskPoints={maskPoints}
                            onClearMasks={() => setMaskPoints([])}
                        />
                     )}
                  </div>
               </div>
               
               {/* Timeline Resize Handle */}
               <div 
                 className={`h-1 bg-zinc-900 hover:bg-cyan-500 z-30 transition-colors w-full flex items-center justify-center group relative ${minimized.timeline ? 'cursor-default pointer-events-none' : 'cursor-row-resize'}`}
                 onMouseDown={() => !minimized.timeline && setIsResizing('timeline')}
               >
                   <div className={`w-8 h-1 bg-zinc-700 group-hover:bg-cyan-300 rounded ${minimized.timeline ? 'hidden' : ''}`}></div>

                    {/* Minimize Button */}
                    {!minimized.timeline && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleMinimize('timeline'); }}
                            className="absolute right-4 bottom-2 bg-zinc-800 p-1 rounded-full border border-zinc-700 text-zinc-400 hover:text-cyan-400 z-40 shadow-lg"
                        >
                            <ChevronDown size={14} />
                        </button>
                    )}
               </div>

               {/* Timeline */}
               <div 
                style={{ height: minimized.timeline ? 36 : timelineHeight }} 
                className="shrink-0 relative transition-all duration-300 ease-in-out bg-zinc-900 border-t border-zinc-800"
               >
                   {minimized.timeline ? (
                       <div className="w-full h-full flex items-center justify-between px-4">
                           <span className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                               <Layers size={14}/> Timeline
                           </span>
                           <button 
                                onClick={() => toggleMinimize('timeline')}
                                className="p-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-cyan-400"
                            >
                                <ChevronUp size={14} />
                            </button>
                       </div>
                   ) : (
                       <Timeline 
                          tracks={tracks} 
                          currentTime={currentTime} 
                          duration={30} 
                          onSeek={setCurrentTime}
                          onImportClip={handleImportClip}
                          onClearTrack={handleClearTrack}
                       />
                   )}
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
