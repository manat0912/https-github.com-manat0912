import React, { useState } from 'react';
import { ToolType, Track, Clip } from '../types';
import { 
  Wand2, Scissors, UserSquare2, MountainSnow, Crosshair, 
  Video, PlayCircle, Loader2, AlertCircle, ImagePlus,
  Move3d, Layers, Bone, Wind, ScanLine, FileUp, UploadCloud,
  Package, Link as LinkIcon, Settings as SettingsIcon,
  ChevronUp, ChevronDown, Grid, LayoutTemplate, Sparkles, X, Music
} from 'lucide-react';
import { 
  generateVideo, 
  generateImage, 
  generateCharacterAnimation, 
  enhanceScene,
  checkApiKeySelection, 
  promptApiKeySelection 
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
}

const ControlPanelReal: React.FC<ControlPanelProps> = ({ 
    activeTool, setActiveTool, onAssetGenerated, onLoadTemplate, onImportClip, onClearTrack,
    inputVideoClip, inputAudioClip 
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [refImage, setRefImage] = useState<string | null>(null);
  const [autoVFX, setAutoVFX] = useState(false);
  
  // UI State
  const [isToolsGridExpanded, setIsToolsGridExpanded] = useState(true);

  // Animation Studio State
  const [characterPrompt, setCharacterPrompt] = useState('');
  const [autoRig, setAutoRig] = useState(false);
  const [usePhysics, setUsePhysics] = useState(false);
  const [useMocap, setUseMocap] = useState(false);
  const [motionPrompt, setMotionPrompt] = useState('');
  const [mocapFileName, setMocapFileName] = useState<string | null>(null);

  // Scene Architect State
  const [upscale, setUpscale] = useState(false);
  const [denoise, setDenoise] = useState(false);
  const [colorGrade, setColorGrade] = useState('');
  const [texturePrompt, setTexturePrompt] = useState('');

  const tools = [
    { id: ToolType.SELECT, icon: Crosshair, label: 'Select' },
    { id: ToolType.CUT, icon: Scissors, label: 'Cut' },
    { id: ToolType.MAGIC_VFX, icon: Wand2, label: 'Magic VFX' },
    { id: ToolType.SCENE_REPLACE, icon: MountainSnow, label: 'Scene Swap' },
    { id: ToolType.CHARACTER_CREATOR, icon: UserSquare2, label: 'Character' },
    { id: ToolType.OBJECT_TRACK, icon: Video, label: 'Track' },
    { id: ToolType.ANIMATION_STUDIO, icon: Move3d, label: 'Anim Studio' },
    { id: ToolType.SCENE_ARCHITECT, icon: Layers, label: 'Architect' },
    { id: ToolType.MATERIAL_LIBRARY, icon: Package, label: 'Materials' },
    { id: ToolType.BRIDGE, icon: LinkIcon, label: 'Bridge' },
    { id: ToolType.TEMPLATES, icon: LayoutTemplate, label: 'Templates' },
    { id: ToolType.SETTINGS, icon: SettingsIcon, label: 'Settings' },
  ];

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
      // Use enhanceScene to modify the scene with the material
      const url = await enhanceScene(`Apply ${item.promptEquivalent} to the scene`, {
        upscale: false, denoise: false, colorGrade: '', reconstruction: '', textures: item.promptEquivalent
      });
      onAssetGenerated(url, 'video', `Material: ${item.name}`);
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
     }
  };

  const handleGenerate = async () => {
    // Basic validation
    if (activeTool === ToolType.ANIMATION_STUDIO) {
        if (!characterPrompt || !motionPrompt) return;
    } else if (activeTool === ToolType.SCENE_ARCHITECT) {
        if (!prompt && !texturePrompt) return;
    } else {
        if (!prompt) return;
    }

    // Auto-VFX Logic
    const autoVFXSuffix = autoVFX 
        ? " Auto-VFX enabled: handle all visual effects, compositing, lighting matching, and seamless integration automatically. Ensure professional studio quality." 
        : "";

    await executeGeneration(async () => {
        setStatusMsg("Initializing AI Model...");
        if (activeTool === ToolType.ANIMATION_STUDIO) {
            setStatusMsg("Processing Auto-Rigging & Physics Simulation...");
            const url = await generateCharacterAnimation(characterPrompt + autoVFXSuffix, motionPrompt, {
              autoRig, usePhysics, useMocap
            });
            onAssetGenerated(url, 'video', `Anim: ${characterPrompt} - ${motionPrompt}`);
        } 
        else if (activeTool === ToolType.SCENE_ARCHITECT) {
            setStatusMsg("Reconstructing & Enhancing Scene...");
            const url = await enhanceScene(prompt + autoVFXSuffix, {
              upscale, denoise, colorGrade, reconstruction: prompt, textures: texturePrompt
            });
            onAssetGenerated(url, 'video', `Architect: ${prompt}`);
        }
        else if (activeTool === ToolType.CHARACTER_CREATOR && !refImage) {
            // Concept Art Mode
            setStatusMsg("Generating Character Concept...");
            const url = await generateImage(prompt + autoVFXSuffix);
            onAssetGenerated(url, 'image', prompt);
        } else {
            // Standard Video Mode
            let base64Ref = undefined;
            if (refImage) {
                base64Ref = refImage.split(',')[1];
            }
            setStatusMsg("Rendering Video (this may take a minute)...");
            const url = await generateVideo(prompt + autoVFXSuffix, base64Ref);
            onAssetGenerated(url, 'video', prompt);
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

  return (
    <div className="w-full h-full bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
      
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
            <span className="capitalize truncate">{activeTool.replace('_', ' ').toLowerCase()} Properties</span>
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

                {/* SCENE ARCHITECT CONTROLS */}
                {activeTool === ToolType.SCENE_ARCHITECT && (
                    <>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                             <button 
                                onClick={() => setUpscale(!upscale)}
                                className={`p-2 rounded border flex items-center justify-center gap-2 text-xs font-bold transition-all ${upscale ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                            >
                               <UploadCloud size={14} /> 4K Upscale
                            </button>
                             <button 
                                onClick={() => setDenoise(!denoise)}
                                className={`p-2 rounded border flex items-center justify-center gap-2 text-xs font-bold transition-all ${denoise ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                            >
                                <Wand2 size={14} /> AI Denoise
                            </button>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Reconstruction / Fix</label>
                             <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-16 bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-zinc-200 resize-none focus:border-blue-500 focus:outline-none"
                                placeholder="E.g., Reconstruct damaged building wall, fill missing sky..."
                             />
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Object/Texture Remix</label>
                             <input 
                                type="text"
                                value={texturePrompt}
                                onChange={(e) => setTexturePrompt(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
                                placeholder="E.g., Change terrain to magma..."
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Color Grading</label>
                             <input 
                                type="text"
                                value={colorGrade}
                                onChange={(e) => setColorGrade(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
                                placeholder="E.g., Cyberpunk teal and orange..."
                             />
                        </div>
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
                   <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-3 rounded-lg border border-purple-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-400" />
                                <div>
                                    <span className="text-xs font-bold text-zinc-100 block">AI Auto-VFX</span>
                                    <span className="text-[10px] text-zinc-400 block">Handle compositing & effects automatically</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={autoVFX} onChange={() => setAutoVFX(!autoVFX)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                   </div>
                )}

                {/* Action Button */}
                <button
                    disabled={isGenerating || (
                        (activeTool === ToolType.ANIMATION_STUDIO && (!characterPrompt || !motionPrompt)) ||
                        (activeTool === ToolType.SCENE_ARCHITECT && !prompt && !texturePrompt) ||
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
                            <PlayCircle size={16} /> Generate / Apply
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