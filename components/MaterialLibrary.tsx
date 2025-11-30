import React, { useState } from 'react';
import { Search, Upload, Box, Image as ImageIcon, Sparkles, FolderOpen, Plus, X, UploadCloud, FileBox, ChevronUp, ChevronDown, Filter } from 'lucide-react';

export interface MaterialItem {
  id: string;
  name: string;
  type: 'texture' | 'vfx' | 'object';
  thumbnail: string; // Data URL for images, or placeholder for objects
  promptEquivalent: string; // The text description used for AI generation
  fileName?: string;
}

interface MaterialLibraryProps {
  onApply: (item: MaterialItem) => void;
  isProcessing: boolean;
}

const MOCK_ASSETS: MaterialItem[] = [
  { id: '1', name: 'Cyber Metal', type: 'texture', thumbnail: 'https://picsum.photos/id/1/100/100', promptEquivalent: 'cyberpunk brushed steel metal texture' },
  { id: '2', name: 'Volcanic Rock', type: 'texture', thumbnail: 'https://picsum.photos/id/10/100/100', promptEquivalent: 'cracked volcanic magma rock texture' },
  { id: '3', name: 'Neon Rain', type: 'vfx', thumbnail: 'https://picsum.photos/id/20/100/100', promptEquivalent: 'overlay of heavy neon purple rain' },
  { id: '4', name: 'Explosion A', type: 'vfx', thumbnail: 'https://picsum.photos/id/30/100/100', promptEquivalent: 'cinematic large scale explosion' },
  { id: '5', name: 'Sci-Fi Crate', type: 'object', thumbnail: 'https://picsum.photos/id/40/100/100', promptEquivalent: 'futuristic cargo crate 3d model' },
  { id: '6', name: 'Vintage Wood', type: 'texture', thumbnail: 'https://picsum.photos/id/50/100/100', promptEquivalent: 'aged vintage oak wood texture' },
];

const MaterialLibrary: React.FC<MaterialLibraryProps> = ({ onApply, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'texture' | 'vfx' | 'object'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<MaterialItem[]>(MOCK_ASSETS);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  
  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newAssetFile, setNewAssetFile] = useState<File | null>(null);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetPrompt, setNewAssetPrompt] = useState('');
  const [newAssetType, setNewAssetType] = useState<MaterialItem['type']>('texture');
  const [newAssetPreview, setNewAssetPreview] = useState<string>('');

  const filteredAssets = assets.filter(asset => {
    const matchesTab = activeTab === 'all' || asset.type === activeTab;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAssetFile(file);
      setNewAssetName(file.name.split('.')[0]);
      
      // Auto-detect type
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.glb') || lowerName.endsWith('.obj') || lowerName.endsWith('.fbx')) {
        setNewAssetType('object');
        setNewAssetPrompt(`3D Model of ${file.name.split('.')[0]}`);
        setNewAssetPreview(''); // No visual preview for 3D yet
      } else {
        setNewAssetType('texture');
        setNewAssetPrompt(`Texture of ${file.name.split('.')[0]}`);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewAssetPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveAsset = () => {
    if (!newAssetName || !newAssetPrompt) return;

    const newAsset: MaterialItem = {
      id: Date.now().toString(),
      name: newAssetName,
      type: newAssetType,
      thumbnail: newAssetPreview || 'placeholder', // Placeholder logic handled in render
      promptEquivalent: newAssetPrompt,
      fileName: newAssetFile?.name
    };

    setAssets([newAsset, ...assets]);
    resetModal();
  };

  const resetModal = () => {
    setIsImportModalOpen(false);
    setNewAssetFile(null);
    setNewAssetName('');
    setNewAssetPrompt('');
    setNewAssetType('texture');
    setNewAssetPreview('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 relative">
      {/* Filters Header */}
      <div className="mb-2">
         <div 
            className="flex items-center justify-between cursor-pointer py-1"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
         >
            <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1.5">
                <Filter size={10} /> Search & Filters
            </span>
            <span className="text-zinc-500">
                {isFiltersExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </span>
         </div>
         
         {isFiltersExpanded && (
            <div className="space-y-3 mb-2 animate-in slide-in-from-top-2">
                <div className="relative">
                <Search className="absolute left-2 top-2.5 text-zinc-500" size={14} />
                <input 
                    type="text"
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded pl-8 pr-2 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                </div>
                
                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-950 p-1 rounded-md overflow-x-auto">
                {['all', 'texture', 'vfx', 'object'].map((tab) => (
                    <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-2 py-1 text-[10px] uppercase font-bold rounded flex-1 transition-colors ${
                        activeTab === tab ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    >
                    {tab}
                    </button>
                ))}
                </div>
            </div>
         )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2 content-start pb-4 min-h-0">
        {/* Import Button (Trigger Modal) */}
        <button 
            onClick={() => setIsImportModalOpen(true)}
            className="aspect-square border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-zinc-800 transition-all group shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-cyan-900 group-hover:text-cyan-400 mb-2 transition-colors">
            <Plus size={16} />
          </div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 group-hover:text-zinc-300">Import</span>
        </button>

        {filteredAssets.map((asset) => (
          <div 
            key={asset.id}
            onClick={() => !isProcessing && onApply(asset)}
            className={`relative aspect-square rounded-lg overflow-hidden border border-zinc-800 group cursor-pointer hover:border-cyan-500 transition-all bg-zinc-950 shrink-0 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {asset.type === 'object' && asset.thumbnail === 'placeholder' || (asset.type === 'object' && !asset.thumbnail.startsWith('data:')) ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    <Box size={32} className="text-zinc-700 group-hover:text-cyan-600 transition-colors" />
                </div>
            ) : (
                <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
              <span className="text-xs font-bold text-white mb-1">{asset.name}</span>
              <span className="text-[9px] uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded mb-1">
                {asset.type}
              </span>
              <p className="text-[8px] text-zinc-400 line-clamp-2 px-1">"{asset.promptEquivalent}"</p>
            </div>

            {/* Type Icon Badge (Always visible) */}
            <div className="absolute top-1 right-1 w-5 h-5 bg-zinc-900/80 rounded flex items-center justify-center text-zinc-400 backdrop-blur-sm">
              {asset.type === 'texture' && <ImageIcon size={10} />}
              {asset.type === 'vfx' && <Sparkles size={10} />}
              {asset.type === 'object' && <Box size={10} />}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 p-2 bg-zinc-800/50 rounded border border-zinc-800 text-[10px] text-zinc-400 text-center shrink-0">
        Click an asset to apply it to the active scene.
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-800">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                        <UploadCloud size={16} className="text-cyan-400" /> Import Custom Asset
                    </span>
                    <button onClick={resetModal} className="text-zinc-500 hover:text-white"><X size={16}/></button>
                </div>
                
                <div className="p-4 space-y-4">
                    {/* File Drop Area */}
                    {!newAssetFile ? (
                        <label className="border-2 border-dashed border-zinc-700 rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-zinc-800/50 transition-all bg-zinc-950">
                            <Upload size={20} className="text-zinc-500 mb-2" />
                            <span className="text-xs text-zinc-400">Click to upload (.png, .jpg, .glb, .obj)</span>
                            <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.glb,.obj,.fbx" onChange={handleFileSelect} />
                        </label>
                    ) : (
                        <div className="flex items-center gap-3 bg-zinc-800 p-2 rounded border border-zinc-700">
                            {newAssetType === 'object' ? (
                                <div className="w-10 h-10 bg-zinc-900 rounded flex items-center justify-center">
                                    <Box size={20} className="text-cyan-400" />
                                </div>
                            ) : (
                                <img src={newAssetPreview} alt="Preview" className="w-10 h-10 object-cover rounded bg-zinc-900" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{newAssetFile.name}</p>
                                <p className="text-[10px] text-zinc-500 uppercase">{newAssetType}</p>
                            </div>
                            <button onClick={() => setNewAssetFile(null)} className="p-1 hover:bg-zinc-700 rounded text-zinc-400"><X size={14}/></button>
                        </div>
                    )}

                    {/* Meta Data Inputs */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Asset Name</label>
                            <input 
                                type="text" 
                                value={newAssetName} 
                                onChange={(e) => setNewAssetName(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="e.g. Alien Spaceship"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Type</label>
                                <select 
                                    value={newAssetType}
                                    onChange={(e) => setNewAssetType(e.target.value as any)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-white focus:border-cyan-500 focus:outline-none appearance-none"
                                >
                                    <option value="texture">Texture</option>
                                    <option value="vfx">VFX Overlay</option>
                                    <option value="object">3D Object</option>
                                </select>
                             </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">AI Prompt Description</label>
                            <textarea 
                                value={newAssetPrompt}
                                onChange={(e) => setNewAssetPrompt(e.target.value)}
                                className="w-full h-16 bg-zinc-950 border border-zinc-700 rounded p-2 text-xs text-white focus:border-cyan-500 focus:outline-none resize-none"
                                placeholder="Describe this asset for the AI (e.g. 'A rusted iron futuristic crate')"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveAsset}
                        disabled={!newAssetFile || !newAssetName || !newAssetPrompt}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white py-2 rounded text-xs font-bold transition-colors"
                    >
                        Add to Library
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MaterialLibrary;