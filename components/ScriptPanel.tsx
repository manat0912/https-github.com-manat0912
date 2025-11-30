import React, { useState } from 'react';
import { generateScript } from '../services/geminiService';
import { Loader2, Sparkles, Film, ArrowRight } from 'lucide-react';

interface ScriptPanelProps {
  onUseScript: (text: string) => void;
}

const ScriptPanel: React.FC<ScriptPanelProps> = ({ onUseScript }) => {
  const [prompt, setPrompt] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const result = await generateScript(`Write a short movie scene script about: ${prompt}. Include visual descriptions for VFX.`);
      setScript(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate script.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800 p-4 w-full shrink-0">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Film className="text-cyan-400" /> Screenplay AI
      </h2>
      
      <div className="space-y-4 flex-1 flex flex-col">
        <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
          <label className="block text-sm font-medium text-zinc-400 mb-2">Story Concept</label>
          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-cyan-500 h-24 resize-none"
            placeholder="E.g., A cyberpunk detective walking through neon rain..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-3 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Generate Script
          </button>
        </div>

        <div className="flex-1 bg-white text-zinc-900 rounded-lg p-6 font-mono text-sm overflow-y-auto shadow-inner whitespace-pre-wrap">
            {script || <span className="text-zinc-400 italic">Script output will appear here...</span>}
        </div>

        {script && (
            <button 
                onClick={() => onUseScript(script)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded font-medium flex items-center justify-center gap-2"
            >
                Send to VFX Prompt <ArrowRight size={16} />
            </button>
        )}
      </div>
    </div>
  );
};

export default ScriptPanel;