

import React, { useState, useRef } from 'react';
import { ToolType, Track, Clip, VFXModule, MaskPoint, ModelSource } from '../types';
import { 
  Wand2, Scissors, UserSquare2, MountainSnow, Crosshair, 
  Video, PlayCircle, Loader2, AlertCircle, ImagePlus,
  Move3d, Layers, Bone, Wind, ScanLine, FileUp, UploadCloud,
  Package, Link as LinkIcon, Settings as SettingsIcon,
  ChevronUp, ChevronDown, Grid, LayoutTemplate, Sparkles, X, Music, Bot, Zap, Cpu,
  Eraser, Sun, Scan, Focus, Cloud, Camera, Plus, Minus, Trash2, MousePointer2,
  Map, Navigation, Code2, Globe
} from 'lucide-react';
import { 
  generateVideo, 
  generateImage, 
  generateCharacterAnimation, 
  enhanceScene,
  checkApiKeySelection, 
  promptApiKeySelection,
  processVFXCommand
} from '../services/geminiService';
import MaterialLibrary, { MaterialItem } from './MaterialLibrary';
import SettingsPanel from './SettingsPanel';
import BridgePanel from './BridgePanel';
import ProjectTemplatesPanel from './ProjectTemplatesPanel';

interface ControlPanelProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  onAssetGenerated: (url: string, type: 'video' | 'image', prompt: string) => void;
  onLoadTemplate: (tracks: Track[]) => void;
  onImportClip: (file: File, trackId: string, type: 'video' | 'audio') => void;
  onClearTrack: (trackId: string) => void;
  inputVideoClip?: Clip;
  inputAudioClip?: Clip;
  // Masking Props
  maskingMode: 'include' | 'exclude' | null;
  setMaskingMode: (mode: 'include' | 'exclude' | null) => void;
  maskPoints: MaskPoint[];
  onClearMasks: () => void;
}

const ControlPanelReal: React.FC<ControlPanelProps> = ({ 
    activeTool, setActiveTool, onAssetGenerated, onLoadTemplate, onImportClip, onClearTrack,
    inputVideoClip, inputAudioClip,
    maskingMode, setMaskingMode, maskPoints, onClearMasks
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeEngine, setActiveEngine] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [autoVFX, setAutoVFX] = useState(true); // Default to true for better UX
  
  // UI State
  const [isToolsGridExpanded, setIsToolsGridExpanded] = useState(true);

  // Animation Studio State
  const [characterPrompt, setCharacterPrompt] = useState('');
  const [autoRig, setAutoRig] = useState(false);
  const [usePhysics, setUsePhysics] = useState(false);
  const [useMocap, setUseMocap] = useState(false);
  const [motionPrompt, setMotionPrompt] = useState('');
  const [mocapFileName, setMocapFileName] = useState<string | null>(null);

  // Scene Architect (Pro Suite) State
  const [activeModule, setActiveModule] = useState<VFXModule | null>(null);
  const [moduleParams, setModuleParams] = useState<any>({});
  const [modelSource, setModelSource] = useState<ModelSource>('CLOSED');
  
  // Legacy Scene Architect State (kept for fallback)
  const [upscale, setUpscale] = useState(false);
  const [denoise, setDenoise] = useState(false);
  const [colorGrade, setColorGrade] = useState('');
  const [texturePrompt, setTexturePrompt] = useState('');

  // Hidden video element for frame extraction
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  const tools = [
    { id: ToolType.SELECT, icon: Crosshair, label: 'Select' },
    { id: ToolType.CUT, icon: Scissors, label: 'Cut' },
    { id: ToolType.MAGIC_VFX, icon: Wand2, label: 'Magic VFX' },
    { id: ToolType.SCENE_REPLACE, icon: MountainSnow, label: 'Scene Swap' },
    { id: ToolType.CHARACTER_CREATOR, icon: UserSquare2, label: 'Character' },
    { id: ToolType.OBJECT_TRACK, icon: Video, label: 'Track' },
    { id: ToolType.ANIMATION_STUDIO, icon: Move3d, label: 'Anim Studio' },
    { id: ToolType.SCENE_ARCHITECT, icon: Layers, label: 'Pro AI Suite' },
    { id: ToolType.MATERIAL_LIBRARY, icon: Package, label: 'Materials' },
    { id: ToolType.BRIDGE, icon: LinkIcon, label: 'Bridge' },
    { id: ToolType.TEMPLATES, icon: LayoutTemplate, label: 'Templates' },
    { id: ToolType.SETTINGS, icon: SettingsIcon, label: 'Settings' },
  ];

  const closedModules = [
    { id: VFXModule.GEN_FILL, icon: Eraser, label: 'Gen Fill', color: 'text-blue-400' },
    { id: VFXModule.MAGIC_MASK, icon: Scan, label: 'Magic Mask', color: 'text-purple-400' },
    { id: VFXModule.ROTOBOT, icon: Bot, label: 'Rotobot', color: 'text-green-400' },
    { id: VFXModule.RELIGHT, icon: Sun, label: 'Relight', color: 'text-yellow-400' },
    { id: VFXModule.SKY_REPLACE, icon: Cloud, label: 'Sky AI', color: 'text-cyan-400' },
    { id: VFXModule.TERRAIN_AI, icon: Map, label: 'Terrain AI', color: 'text-amber-500' },
    { id: VFXModule.AUTO_MAP, icon: Navigation, label: 'Auto Map', color: 'text-indigo-400' },
    { id: VFXModule.DENOISE, icon: Wand2, label: 'DeNoise', color: 'text-indigo-400' },
    { id: VFXModule.SHARPEN, icon: Focus, label: 'Sharpen', color: 'text-pink-400' },
    { id: VFXModule.DEPTH_MAP, icon: Layers, label: 'Depth AI', color: 'text-emerald-400' },
  ];

  const openModules = [
      { id: VFXModule.SAM3_SEGMENT, icon: Scan, label: 'SAM 3', color: 'text-green-400', desc: 'Segment Anything 3' },
      { id: VFXModule.WAN_INPAINT, icon: Eraser, label: 'Wan 2.1', color: 'text-blue-400', desc: 'Wan Video Inpainting' },
      { id: VFXModule.DEPTH_ANYTHING, icon: Layers, label: 'Depth V2', color: 'text-purple-400', desc: 'Depth Anything V2' },
      { id: VFXModule.FLUX_FILL, icon: Wand2, label: 'Flux Fill', color: 'text-cyan-400', desc: 'Flux Inpainting' },
  ];

  // Derive visible modules based on source selection
  const visibleModules = modelSource === 'CLOSED' ? closedModules : openModules;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoInputImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onImportClip(file, 't_input_v', 'video');
          setStatusMsg(`Imported ${file.name}`);
          setTimeout(() => setStatusMsg(''), 2000);
      }
  };

  const handleAudioInputImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onImportClip(file, 't_input_a', 'audio');
          setStatusMsg(`Imported Audio: ${file.name}`);
          setTimeout(() => setStatusMsg(''), 2000);
      }
  };

  const handleMocapFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setMocapFileName(file.name);
    }
  };

  const handleMaterialApply = async (item: MaterialItem) => {
    // Treat material application as a scene enhancement
    await executeGeneration(async () => {
      setStatusMsg(`Applying ${item.name}...`);
      
      // Capture frame if input video exists
      const base64Input = await captureVideoFrame();
      
      // Use enhanceScene to modify the scene with the material
      const url = await enhanceScene(`Apply ${item.promptEquivalent} to the scene`, {
        upscale: false, denoise: false, colorGrade: '', reconstruction: '', textures: item.promptEquivalent,
        modelSource
      }, base64Input);
      
      onAssetGenerated(url, 'video', `Material: ${item.name}`);
    });
  };

  // Helper to capture a frame from the input video to use as a reference for generation
  const captureVideoFrame = async (): Promise<string | undefined> => {
    if (!inputVideoClip || !hiddenVideoRef.current) return undefined;
    
    return new Promise((resolve) => {
      const video = hiddenVideoRef.current!;
      video.crossOrigin = "anonymous";
      video.src = inputVideoClip.url || '';
      
      video.onloadeddata = () => {
        video.currentTime = 0; // Capture first frame
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        } else {
          resolve(undefined);
        }
      };
      
      setTimeout(() => resolve(undefined), 2000);
    });
  };

  const executeGeneration = async (generationFn: () => Promise<void>) => {
     // Check Key
     const hasKey = await checkApiKeySelection();
     if (!hasKey) {
         setStatusMsg("Waiting for API Key selection...");
         try {
             await promptApiKeySelection();
         } catch (e) {
             setStatusMsg("API Key selection failed or cancelled.");
             return;
         }
     }
 
     setIsGenerating(true);
     try {
       await generationFn();
       setStatusMsg("Generation Complete!");
       setTimeout(() => setStatusMsg(''), 3000);
     } catch (error: any) {
       console.error(error);
       if (error.message?.includes("Requested entity was not found") || error.message?.includes("404")) {
           setStatusMsg("Session expired. Please re-select API Key.");
           await promptApiKeySelection();
       } else {
           setStatusMsg(`Error: ${error.message || 'Generation failed'}`);
       }
     } finally {
       setIsGenerating(false);
       setActiveEngine(null);
     }
  };

  const handleGenerate = async () => {
    // 1. Intelligent Routing (Auto-VFX)
    let finalPrompt = prompt;
    let toolAction = 'GENERATE';
    let detectedEngine = 'VEO_2'; // Default
    
    if (autoVFX && prompt && activeTool !== ToolType.SCENE_ARCHITECT) {
       setStatusMsg("Copilot Analyzing Request...");
       const command = await processVFXCommand(prompt);
       
       if (command.action === 'CHANGE_TOOL' && command.toolId) {
           setStatusMsg(command.responseMessage || "Switching tool...");
           setActiveTool(command.toolId as ToolType);
           setIsGenerating(false);
           return; // Stop here, we just switched tools
       }
       
       if (command.action === 'GENERATE') {
           if (command.parameters?.prompt) finalPrompt = command.parameters.prompt;
           if (command.detectedEngine) detectedEngine = command.detectedEngine;
       }
    }

    // If we are in SCENE_ARCHITECT (Pro Suite), mapped engine is specific to module
    if (activeTool === ToolType.SCENE_ARCHITECT && activeModule) {
        detectedEngine = activeModule.replace('_', ' '); // E.g., "MAGIC MASK"
    }

    setActiveEngine(detectedEngine);

    // Basic validation
    if (activeTool === ToolType.ANIMATION_STUDIO) {
        if (!characterPrompt || !motionPrompt) return;
    } else if (activeTool === ToolType.SCENE_ARCHITECT) {
        // Validation handled by module params check implicitly
    } else {
        if (!prompt) return;
    }

    const autoVFXSuffix = autoVFX 
        ? " Professional VFX Studio: Ensure seamless integration, photorealistic lighting, and match input video perspective." 
        : "";

    await executeGeneration(async () => {
        // 2. Context Extraction (Grounding)
        setStatusMsg(`Active Engine: ${detectedEngine.replace(/_/g, ' ')}...`);
        const base64Input = await captureVideoFrame();
        
        let base64Ref = undefined;
        if (refImage) {
            base64Ref = refImage.split(',')[1];
        } else if (base64Input) {
            base64Ref = base64Input;
            setStatusMsg(`Processing Input with ${detectedEngine.replace(/_/g, ' ')}...`);
        }

        if (activeTool === ToolType.ANIMATION_STUDIO) {
            const url = await generateCharacterAnimation(characterPrompt + autoVFXSuffix, motionPrompt, {
              autoRig, usePhysics, useMocap
            });
            onAssetGenerated(url, 'video', `Anim: ${characterPrompt} - ${motionPrompt}`);
        } 
        else if (activeTool === ToolType.SCENE_ARCHITECT) {
            // New Pro AI Suite Logic with Interactive Masking
            const url = await enhanceScene(prompt + autoVFXSuffix, {
              upscale, denoise, colorGrade, reconstruction: prompt, textures: texturePrompt,
              module: activeModule || undefined,
              moduleParams,
              maskPoints, // Pass the interactive selection points
              modelSource // Pass the source selection (Open/Closed)
            }, base64Ref);
            
            let label = `Architect: ${prompt}`;
            if (activeModule) label = `${activeModule}: ${prompt}`;
            onAssetGenerated(url, 'video', label);
        }
        else if (activeTool === ToolType.CHARACTER_CREATOR && !refImage && !base64Ref) {
            // Concept Art Mode - Nano Banana Pro
            setActiveEngine('NANO_BANANA_PRO');
            setStatusMsg("Engine: Nano Banana Pro (Gemini 3 Pro Image)");
            const url = await generateImage(prompt + autoVFXSuffix);
            onAssetGenerated(url, 'image', prompt);
        } else {
            // Standard Video Mode / VFX Edit
            const url = await generateVideo(finalPrompt + autoVFXSuffix, base64Ref, detectedEngine);
            onAssetGenerated(url, 'video', finalPrompt);
        }
    });
  };

  // Determine if we are in a tool that uses the generic prompt and generate button
  const isGenericTool = 
    activeTool !== ToolType.ANIMATION_STUDIO && 
    activeTool !== ToolType.SCENE_ARCHITECT && 
    activeTool !== ToolType.MATERIAL_LIBRARY &&
    activeTool !== ToolType.SETTINGS &&
    activeTool !== ToolType.BRIDGE &&
    activeTool !== ToolType.TEMPLATES;

  // Determine if Auto-VFX Option should be available
  const canUseAutoVFX = 
    activeTool === ToolType.MAGIC_VFX || 
    activeTool === ToolType.SCENE_REPLACE || 
    activeTool === ToolType.CHARACTER_CREATOR || 
    activeTool === ToolType.SCENE_ARCHITECT ||
    activeTool === ToolType.ANIMATION_STUDIO;
  
  // Is Masking Relevant?
  const isMaskingRelevant = 
    activeTool === ToolType.SCENE_ARCHITECT && 
    (
        activeModule === VFXModule.MAGIC_MASK || 
        activeModule === VFXModule.ROTOBOT || 
        activeModule === VFXModule.GEN_FILL || 
        activeModule === VFXModule.TERRAIN_AI || 
        activeModule === VFXModule.AUTO_MAP ||
        activeModule === VFXModule.SAM3_SEGMENT ||
        activeModule === VFXModule.WAN_INPAINT
    );

  return (
    <div className="w-full h-full bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 relative">
      
      {/* Hidden Video Element for Frame Capture */}
      <video ref={hiddenVideoRef} className="hidden" crossOrigin="anonymous" muted playsInline />

      {/* Tool Grid Header */}
      <div 
        className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900 shrink-0 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsToolsGridExpanded(!isToolsGridExpanded)}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Grid size={12} /> Tool Palette
        </span>
        <button 
            className="text-zinc-500 hover:text-white"
        >
            {isToolsGridExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Tool Grid */}
      {isToolsGridExpanded && (
        <div className="p-4 grid grid-cols-4 gap-2 border-b border-zinc-800 bg-zinc-900/50">
            {tools.map((tool) => (
            <button
                key={tool.id}
                onClick={(e) => { e.stopPropagation(); setActiveTool(tool.id); }}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                activeTool === tool.id 
                    ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/30' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
            >
                <tool.icon size={18} className="mb-1" />
                <span className="text-[9px] font-medium uppercase tracking-wider truncate w-full text-center">{tool.label}</span>
            </button>
            ))}
        </div>
      )}

      {/* Contextual Properties */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
        <h3 className="text-zinc-100 font-semibold mb-4 flex items-center gap-2 shrink-0">
            {activeTool === ToolType.MAGIC_VFX && <Wand2 className="text-purple-400" size={18}/>}
            {activeTool === ToolType.SCENE_REPLACE && <MountainSnow className="text-emerald-400" size={18}/>}
            {activeTool === ToolType.CHARACTER_CREATOR && <UserSquare2 className="text-orange-400" size={18}/>}
            {activeTool === ToolType.ANIMATION_STUDIO && <Move3d className="text-pink-400" size={18}/>}
            {activeTool === ToolType.SCENE_ARCHITECT && <Layers className="text-blue-400" size={18}/>}
            {activeTool === ToolType.MATERIAL_LIBRARY && <Package className="text-yellow-400" size={18}/>}
            {activeTool === ToolType.BRIDGE && <LinkIcon className="text-emerald-400" size={18}/>}
            {activeTool === ToolType.TEMPLATES && <LayoutTemplate className="text-cyan-400" size={18}/>}
            {activeTool === ToolType.SETTINGS && <SettingsIcon className="text-zinc-400" size={18}/>}
            <span className="capitalize truncate">{activeTool === ToolType.SCENE_ARCHITECT ? "Pro AI Suite" : activeTool.replace('_', ' ').toLowerCase()} Properties</span>
        </h3>

        {activeTool === ToolType.MATERIAL_LIBRARY ? (
            <div className="flex-1 min-h-0">
                 <MaterialLibrary onApply={handleMaterialApply} isProcessing={isGenerating} />
            </div>
        ) : activeTool === ToolType.SETTINGS ? (
             <div className="flex-1 min-h-0">
                <SettingsPanel />
             </div>
        ) : activeTool === ToolType.BRIDGE ? (
             <div className="flex-1 min-h-0">
                <BridgePanel />
             </div>
        ) : activeTool === ToolType.TEMPLATES ? (
             <div className="flex-1 min-h-0">
                <ProjectTemplatesPanel onSelect={(tracks) => {
                    onLoadTemplate(tracks);
                    setStatusMsg("Template applied successfully.");
                    setTimeout(() => setStatusMsg(''), 2000);
                }} />
             </div>
        ) : (
            <div className="space-y-5 flex-1">
                {/* Reference Image Input & Video Input */}
                {(activeTool === ToolType.SCENE_REPLACE || activeTool === ToolType.CHARACTER_CREATOR || activeTool === ToolType.MAGIC_VFX || activeTool === ToolType.SCENE_ARCHITECT) && (
                     <div className="space-y-2">
                        <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Inputs</label>
                        <div className="grid grid-cols-2 gap-2">
                            {/* Ref Image */}
                            <div className="relative group cursor-pointer border-2 border-dashed border-zinc-700 rounded-lg h-24 flex items-center justify-center overflow-hidden hover:border-cyan-500 transition-colors bg-zinc-950">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileChange} accept="image/*" />
                                {refImage ? (
                                    <>
                                        <img src={refImage} alt="Ref" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <button onClick={(e) => {e.preventDefault(); setRefImage(null);}} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-red-500 z-20">
                                            <X size={10} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-2">
                                        <ImagePlus className="mx-auto text-zinc-500 mb-1" size={20} />
                                        <span className="text-[10px] text-zinc-500">Ref Image</span>
                                    </div>
                                )}
                            </div>

                            {/* Video Input */}
                            <div className="relative group cursor-pointer border-2 border-dashed border-zinc-700 rounded-lg h-24 flex items-center justify-center overflow-hidden hover:border-cyan-500 transition-colors bg-zinc-950">
                                {inputVideoClip ? (
                                    <>
                                        <div className="text-center p-2">
                                            <Video className="mx-auto text-cyan-500 mb-1" size={20} />
                                            <span className="text-[10px] text-cyan-400 truncate w-20 block">{inputVideoClip.name}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onClearTrack('t_input_v'); }} 
                                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-red-500 z-20"
                                        >
                                            <X size={10} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleVideoInputImport} accept="video/*" />
                                        <div className="text-center p-2">
                                            <Video className="mx-auto text-zinc-500 mb-1" size={20} />
                                            <span className="text-[10px] text-zinc-500">Input Video</span>
                                        </div>
                                    </>
                                )}
                            </div>

                             {/* Audio Input */}
                            <div className="col-span-2 relative group cursor-pointer border-2 border-dashed border-zinc-700 rounded-lg h-16 flex items-center justify-center overflow-hidden hover:border-cyan-500 transition-colors bg-zinc-950">
                                {inputAudioClip ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Music className="text-cyan-500" size={16} />
                                            <span className="text-[10px] text-cyan-400 truncate max-w-[150px]">{inputAudioClip.name}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onClearTrack('t_input_a'); }} 
                                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-red-500 z-20"
                                        >
                                            <X size={10} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleAudioInputImport} accept="audio/*" />
                                        <div className="flex items-center gap-2">
                                            <Music className="text-zinc-500" size={16} />
                                            <span className="text-[10px] text-zinc-500">Input Audio (Voice/Sound)</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                   </div>
                )}

                {/* ANIMATION STUDIO CONTROLS */}
                {activeTool === ToolType.ANIMATION_STUDIO && (
                    <>
                        <div className="space-y-2">
                             <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Character Description</label>
                             <input 
                                type="text"
                                value={characterPrompt}
                                onChange={(e) => setCharacterPrompt(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:border-pink-500 focus:outline-none"
                                placeholder="E.g., A futuristic robot warrior..."
                             />
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Natural Motion Command</label>
                             <textarea 
                                value={motionPrompt}
                                onChange={(e) => setMotionPrompt(e.target.value)}
                                className="w-full h-20 bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-zinc-200 resize-none focus:border-pink-500 focus:outline-none"
                                placeholder="E.g., Walk sadly towards camera, stopping to look at the ground."
                             />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setAutoRig(!autoRig)}
                                className={`p-2 rounded border flex items-center justify-center gap-2 text-xs font-bold transition-all ${autoRig ? 'bg-pink-900/50 border-pink-500 text-pink-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                <Bone size={14} /> Auto-Rig
                            </button>
                             <button 
                                onClick={() => setUseMocap(!useMocap)}
                                className={`p-2 rounded border flex items-center justify-center gap-2 text-xs font-bold transition-all ${useMocap ? 'bg-pink-900/50 border-pink-500 text-pink-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                <ScanLine size={14} /> Mocap Data
                            </button>
                             <button 
                                onClick={() => setUsePhysics(!usePhysics)}
                                className={`col-span-2 p-2 rounded border flex items-center justify-center gap-2 text-xs font-bold transition-all ${usePhysics ? 'bg-pink-900/50 border-pink-500 text-pink-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                <Wind size={14} /> Physics (Hair/Cloth)
                            </button>
                        </div>

                        {useMocap && (
                            <div className="p-3 border border-dashed border-zinc-700 bg-zinc-950/50 rounded-lg animate-in fade-in slide-in-from-top-2">
                                <label className="flex flex-col items-center justify-center cursor-pointer group">
                                    <div className="p-2 bg-zinc-800 rounded-full group-hover:bg-pink-900/50 transition-colors mb-2">
                                        <FileUp size={16} className="text-zinc-400 group-hover:text-pink-400" />
                                    </div>
                                    <span className="text-xs text-zinc-500 group-hover:text-zinc-300 text-center">
                                        {mocapFileName || "Import .FBX / .BVH Data"}
                                    </span>
                                    <input type="file" className="hidden" accept=".fbx,.bvh" onChange={handleMocapFileChange} />
                                </label>
                            </div>
                        )}
                    </>
                )}

                {/* PRO AI SUITE (SCENE ARCHITECT REFACTORED) */}
                {activeTool === ToolType.SCENE_ARCHITECT && (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">AI Modules</label>
                            
                            {/* MODEL SOURCE TOGGLE */}
                            <div className="flex bg-zinc-950 rounded p-0.5 border border-zinc-800">
                                <button 
                                    onClick={() => { setModelSource('CLOSED'); setActiveModule(null); }}
                                    className={`px-2 py-1 text-[9px] font-bold uppercase rounded transition-colors flex items-center gap-1 ${modelSource === 'CLOSED' ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <Zap size={10} /> Proprietary
                                </button>
                                <button 
                                    onClick={() => { setModelSource('OPEN'); setActiveModule(null); }}
                                    className={`px-2 py-1 text-[9px] font-bold uppercase rounded transition-colors flex items-center gap-1 ${modelSource === 'OPEN' ? 'bg-zinc-800 text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <Globe size={10} /> Open Src
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {visibleModules.map((mod) => (
                                <button
                                    key={mod.id}
                                    onClick={() => { setActiveModule(mod.id); setMaskingMode(null); }}
                                    className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${
                                        activeModule === mod.id 
                                        ? 'bg-zinc-800 border-cyan-500 shadow-md shadow-cyan-900/20' 
                                        : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                                    }`}
                                >
                                    <mod.icon size={16} className={`mb-1 ${mod.color}`} />
                                    <span className="text-[8px] font-bold text-zinc-400 uppercase text-center">{mod.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Module Specific Inputs */}
                        {activeModule && (
                            <div className="p-3 bg-zinc-950 rounded border border-zinc-800 mb-2 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
                                     <Sparkles size={12} className="text-cyan-400" />
                                     <span className="text-xs font-bold text-white uppercase">{activeModule.replace('_', ' ')} Settings</span>
                                     {modelSource === 'OPEN' && <span className="text-[9px] bg-green-900/30 text-green-400 px-1 rounded border border-green-800 ml-auto">HF/Open</span>}
                                </div>

                                {/* INTERACTIVE MASKING CONTROLS */}
                                {isMaskingRelevant && (
                                   <div className="mb-4 space-y-2">
                                      <label className="text-[10px] text-zinc-500 uppercase font-bold flex items-center justify-between">
                                          Interactive Selection
                                          {maskPoints.length > 0 && (
                                              <span className="text-cyan-400 text-[9px]">{maskPoints.length} Points Selected</span>
                                          )}
                                      </label>
                                      
                                      <div className="grid grid-cols-3 gap-2">
                                          <button 
                                            onClick={() => setMaskingMode(maskingMode === 'include' ? null : 'include')}
                                            className={`p-2 rounded border flex flex-col items-center justify-center gap-1 transition-all ${
                                                maskingMode === 'include' 
                                                ? 'bg-green-900/30 border-green-500 text-green-400' 
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                          >
                                              <Plus size={14} />
                                              <span className="text-[9px] font-bold">Select (+)</span>
                                          </button>
                                          
                                          <button 
                                            onClick={() => setMaskingMode(maskingMode === 'exclude' ? null : 'exclude')}
                                            className={`p-2 rounded border flex flex-col items-center justify-center gap-1 transition-all ${
                                                maskingMode === 'exclude' 
                                                ? 'bg-red-900/30 border-red-500 text-red-400' 
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                                            }`}
                                          >
                                              <Minus size={14} />
                                              <span className="text-[9px] font-bold">Exclude (-)</span>
                                          </button>

                                          <button 
                                            onClick={onClearMasks}
                                            disabled={maskPoints.length === 0}
                                            className="p-2 rounded border bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50 disabled:hover:text-zinc-400 flex flex-col items-center justify-center gap-1"
                                          >
                                              <Trash2 size={14} />
                                              <span className="text-[9px] font-bold">Clear</span>
                                          </button>
                                      </div>
                                      
                                      <p className="text-[9px] text-zinc-500 italic">
                                          {maskingMode ? "Click on the preview video to set points." : "Select a mode to start masking."}
                                      </p>
                                   </div>
                                )}

                                {(activeModule === VFXModule.GEN_FILL || activeModule === VFXModule.MAGIC_MASK || activeModule === VFXModule.SKY_REPLACE || activeModule === VFXModule.TERRAIN_AI || activeModule === VFXModule.AUTO_MAP || activeModule === VFXModule.WAN_INPAINT || activeModule === VFXModule.SAM3_SEGMENT || activeModule === VFXModule.FLUX_FILL) && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Target Description</label>
                                        <input 
                                            type="text" 
                                            value={prompt} 
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={activeModule === VFXModule.SKY_REPLACE ? "E.g. Sunset, Stormy Clouds" : activeModule === VFXModule.TERRAIN_AI ? "E.g. Cracked desert ground" : "E.g. The car in the foreground"}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                                        />
                                    </div>
                                )}

                                {activeModule === VFXModule.TERRAIN_AI && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Terrain Preset</label>
                                        <select 
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-white focus:outline-none"
                                            onChange={(e) => setModuleParams({...moduleParams, terrainType: e.target.value})}
                                        >
                                            <option value="">Custom (Use Prompt)</option>
                                            <option value="desert">Dry Desert</option>
                                            <option value="snow">Snowy Tundra</option>
                                            <option value="grass">Lush Grassland</option>
                                            <option value="mars">Red Mars Surface</option>
                                            <option value="asphalt">City Asphalt</option>
                                            <option value="water">Water / Ocean</option>
                                        </select>
                                    </div>
                                )}

                                {activeModule === VFXModule.AUTO_MAP && (
                                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold">
                                                <label>Texture Scale</label>
                                                <span className="text-cyan-400">{moduleParams.textureScale || 1.0}x</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0.1" 
                                                max="3.0" 
                                                step="0.1"
                                                defaultValue="1.0"
                                                className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded appearance-none"
                                                onChange={(e) => setModuleParams({...moduleParams, textureScale: e.target.value})}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                             <label className="text-[10px] text-zinc-500 uppercase font-bold">Depth Influence</label>
                                             <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={moduleParams.depthInfluence !== false} // Default true
                                                    onChange={(e) => setModuleParams({...moduleParams, depthInfluence: e.target.checked})}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-7 h-4 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {activeModule === VFXModule.RELIGHT && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Light Source</label>
                                        <select 
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-1.5 text-xs text-white focus:outline-none"
                                            onChange={(e) => setModuleParams({...moduleParams, lightSource: e.target.value})}
                                        >
                                            <option value="cinematic">Cinematic Soft</option>
                                            <option value="sunlight">Direct Sunlight</option>
                                            <option value="neon">Neon Cyberpunk</option>
                                            <option value="moonlight">Moonlight</option>
                                        </select>
                                    </div>
                                )}

                                {(activeModule === VFXModule.DENOISE || activeModule === VFXModule.SHARPEN) && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold">Strength</label>
                                        <input type="range" className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded appearance-none" />
                                    </div>
                                )}
                            </div>
                        )}

                        {!activeModule && (
                             <div className="p-4 text-center text-zinc-500 text-xs italic border border-dashed border-zinc-800 rounded">
                                Select a module to begin professional enhancement.
                             </div>
                        )}
                    </>
                )}

                {/* STANDARD PROMPT */}
                {isGenericTool && (
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">AI Prompt Instruction</label>
                        <textarea 
                            className="w-full h-32 bg-zinc-950 border border-zinc-700 rounded-md p-3 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 resize-none placeholder-zinc-600"
                            placeholder={
                                activeTool === ToolType.SCENE_REPLACE ? "E.g., Change the background to a mars landscape..." :
                                activeTool === ToolType.CHARACTER_CREATOR ? "E.g., A cyborg warrior with neon armor..." :
                                "Describe the VFX or generation..."
                            }
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                )}

                {/* Auto-VFX Toggle */}
                {canUseAutoVFX && (
                   <div className={`bg-gradient-to-r p-3 rounded-lg border transition-all ${autoVFX ? 'from-purple-900/40 to-blue-900/40 border-purple-500/50' : 'from-zinc-900 to-zinc-800 border-zinc-700'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {autoVFX ? <Bot size={18} className="text-purple-400" /> : <Sparkles size={18} className="text-zinc-500" />}
                                <div>
                                    <span className={`text-xs font-bold block ${autoVFX ? 'text-zinc-100' : 'text-zinc-400'}`}>AI Copilot & Auto-VFX</span>
                                    <span className="text-[10px] text-zinc-400 block">Intelligent command routing</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={autoVFX} onChange={() => setAutoVFX(!autoVFX)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                        
                        {autoVFX && (
                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                                <div className="text-[9px] bg-black/40 px-2 py-1 rounded text-zinc-400 flex items-center gap-1.5">
                                    <Zap size={10} className="text-yellow-500" /> Gemini 2.5 Pro
                                </div>
                                <div className="text-[9px] bg-black/40 px-2 py-1 rounded text-zinc-400 flex items-center gap-1.5">
                                    <Video size={10} className="text-emerald-500" /> Veo 2 / Nano Banana
                                </div>
                                <div className="text-[9px] bg-black/40 px-2 py-1 rounded text-zinc-400 flex items-center gap-1.5">
                                    <Wand2 size={10} className="text-purple-500" /> DaVinci Magic Mask
                                </div>
                                <div className="text-[9px] bg-black/40 px-2 py-1 rounded text-zinc-400 flex items-center gap-1.5">
                                    <Cpu size={10} className="text-blue-500" /> Topaz Video AI
                                </div>
                            </div>
                        )}
                   </div>
                )}

                {/* Action Button */}
                <button
                    disabled={isGenerating || (
                        (activeTool === ToolType.ANIMATION_STUDIO && (!characterPrompt || !motionPrompt)) ||
                        (activeTool === ToolType.SCENE_ARCHITECT && !activeModule && !prompt && !texturePrompt) ||
                        (isGenericTool && !prompt)
                    )}
                    onClick={handleGenerate}
                    className={`w-full py-3 rounded font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all ${
                        isGenerating ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 
                        'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20'
                    }`}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={16} /> Processing...
                        </>
                    ) : (
                        <>
                            <PlayCircle size={16} /> {autoVFX ? 'Execute Command' : 'Generate'}
                        </>
                    )}
                </button>
            </div>
        )}

        {/* Status Message */}
        {statusMsg && (
            <div className={`mt-3 p-3 rounded border text-xs flex items-start gap-2 ${
                statusMsg.includes("Error") ? 'bg-red-900/20 border-red-800 text-red-200' : 
                'bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}>
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{statusMsg}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanelReal;
