import React, { useState } from 'react';
import { Download, Cpu, HardDrive, Info, CheckCircle2, AlertTriangle, ExternalLink, Key, ShieldCheck } from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'models' | 'api' | 'optimization'>('models');
  const [apiKey, setApiKey] = useState('');

  const models = [
    {
      category: 'Video Generation',
      items: [
        { name: 'Wan 2.1 / 2.2', desc: 'Efficient I2V/T2V for 12GB VRAM', size: '14GB', type: 'GGUF / Safetensors', recommended: true },
        { name: 'LTXVideo', desc: 'Rapid prototyping, high speed', size: '5GB', type: 'Checkpoint' },
        { name: 'Mochi 1', desc: 'High motion fidelity 10B param model', size: '19GB', type: 'Checkpoint' },
        { name: 'COGVideoX-2b', desc: 'Fast generation, lower VRAM usage', size: '9GB', type: 'Checkpoint' },
      ]
    },
    {
      category: 'Image Generation',
      items: [
        { name: 'Stable Diffusion XL (SDXL)', desc: 'High quality base model', size: '6.5GB', type: 'Safetensors', recommended: true },
        { name: 'Flux.1', desc: 'Next-gen detail and prompt adherence', size: '12GB', type: 'Safetensors' },
        { name: 'SD 3.5 Large', desc: 'Latest Stability AI architecture', size: '8GB', type: 'Safetensors' },
      ]
    },
    {
      category: 'Video-to-Video',
      items: [
        { name: 'AnimateDiff Motion Module', desc: 'Temporal coherence for SD1.5/SDXL', size: '2GB', type: 'Motion Model' },
        { name: 'ControlNet (OpenPose, Depth)', desc: 'Structure control for V2V', size: '1.5GB ea', type: 'ControlNet' },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">
      
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 shrink-0">
        <button 
          onClick={() => setActiveTab('models')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'models' ? 'border-cyan-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Models
        </button>
        <button 
          onClick={() => setActiveTab('api')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'api' ? 'border-cyan-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          API Access
        </button>
        <button 
          onClick={() => setActiveTab('optimization')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'optimization' ? 'border-cyan-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Optimization
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        
        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-800 p-3 rounded flex items-start gap-3">
              <Info className="text-blue-400 shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-blue-200">
                <p className="font-bold mb-1">Local Model Integration</p>
                <p>These models run locally via the Munz AI Bridge. Clicking download opens the external repository.</p>
              </div>
            </div>

            {models.map((cat, idx) => (
              <div key={idx}>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">{cat.category}</h3>
                <div className="space-y-2">
                  {cat.items.map((model, mIdx) => (
                    <div key={mIdx} className="bg-zinc-800 rounded p-3 border border-zinc-700 hover:border-zinc-600 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-100">{model.name}</span>
                          {model.recommended && <span className="bg-emerald-900 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Recommended</span>}
                        </div>
                        <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">{model.type}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">{model.desc}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1"><HardDrive size={10} /> {model.size}</span>
                        <button className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[10px] px-2 py-1 rounded transition-colors">
                          <Download size={10} /> Download Source
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-5">
            <div className="bg-zinc-800 p-4 rounded border border-zinc-700">
               <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-white">
                  <Key size={16} className="text-emerald-400" /> External API Configuration
               </h3>
               <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Connect third-party cloud models (e.g., Runway, Pika, Midjourney API) directly into MunzGen AI.
               </p>
               
               <div className="space-y-3">
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Service Provider</label>
                      <select className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none appearance-none">
                          <option>Custom / Generic OpenAI Compatible</option>
                          <option>Hugging Face Inference</option>
                          <option>Stability AI Cloud</option>
                      </select>
                  </div>
                  
                  <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">API Key</label>
                      <div className="relative">
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-sm text-white focus:border-emerald-500 focus:outline-none pl-8"
                        />
                        <ShieldCheck size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-1">Keys are stored locally in your browser session.</p>
                  </div>

                  <button className="w-full bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded text-xs font-bold transition-colors">
                      Save & Verify Connection
                  </button>
               </div>
            </div>
            
            <div className="p-4 bg-zinc-950 rounded border border-zinc-800">
                <span className="text-xs font-bold text-zinc-400 block mb-2">Enabled Features via API</span>
                <ul className="space-y-1">
                    <li className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Cloud Rendering
                    </li>
                    <li className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Premium Models (Gen-3, etc.)
                    </li>
                    <li className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Auto-VFX Suite
                    </li>
                </ul>
            </div>
          </div>
        )}

        {activeTab === 'optimization' && (
          <div className="space-y-5">
            <div className="bg-zinc-800 p-4 rounded border border-zinc-700">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Cpu size={16} className="text-purple-400" /> 12GB VRAM Optimization
              </h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                For GPUs with 12GB VRAM (e.g., RTX 3060, 4070), use quantized models (GGUF/FP8) to fit advanced video generators like Wan 2.2 into memory.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2 bg-zinc-900 rounded">
                  <span className="text-zinc-300">ComfyUI Arguments</span>
                  <code className="text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded">--lowvram --fp8_e4m3fn</code>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-zinc-900 rounded">
                  <span className="text-zinc-300">VAE Tiling</span>
                  <span className="text-emerald-400 font-bold">Enabled</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-zinc-900 rounded">
                  <span className="text-zinc-300">Model Quantization</span>
                  <span className="text-yellow-400 font-bold">Q4_K_M / Q8_0</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800 p-4 rounded border border-zinc-700">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-400" /> Memory Management
              </h3>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs cursor-pointer group">
                  <span className="text-zinc-300 group-hover:text-white">Auto-Unload Models</span>
                  <div className="w-8 h-4 bg-emerald-600 rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow"></div>
                  </div>
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer group">
                  <span className="text-zinc-300 group-hover:text-white">Aggressive Garbage Collection</span>
                  <div className="w-8 h-4 bg-zinc-600 rounded-full relative">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow"></div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="p-3 border border-dashed border-zinc-700 rounded text-center">
                 <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1 w-full">
                    <ExternalLink size={12} /> View Detailed Benchmarks
                 </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPanel;