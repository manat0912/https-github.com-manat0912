import React, { useState, useEffect } from 'react';
import { 
    Link, RefreshCw, Power, Monitor, 
    ArrowRightLeft, FileVideo, Activity 
} from 'lucide-react';

const BridgePanel: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [munzStudioStatus, setMunzStudioStatus] = useState<'searching' | 'connected' | 'disconnected'>('searching');

  // Simulate connection attempt
  useEffect(() => {
    const timer = setTimeout(() => {
        setMunzStudioStatus('connected');
        setIsConnected(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">
      
      {/* Status Header */}
      <div className={`p-4 border-b border-zinc-800 ${munzStudioStatus === 'connected' ? 'bg-emerald-900/20' : 'bg-red-900/10'}`}>
        <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Bridge Status</span>
            <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${munzStudioStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                <span className={`text-xs font-bold ${munzStudioStatus === 'connected' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {munzStudioStatus === 'connected' ? 'ONLINE' : 'SEARCHING...'}
                </span>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Monitor size={16} className="text-zinc-400" />
            <ArrowRightLeft size={14} className="text-zinc-600" />
            <span className="font-bold text-sm">Munz AI Studio</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* Connection Control */}
        <div className="bg-zinc-800 rounded p-4 border border-zinc-700">
            <h3 className="font-bold text-sm text-white mb-2">Local Server Bridge</h3>
            <p className="text-xs text-zinc-400 mb-4">
                Connects MunzGen AI to your local "Munz AI Studio" build running on localhost:8188 (ComfyUI backend).
            </p>
            <div className="flex gap-2">
                <button 
                    className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isConnected ? 'bg-red-900/50 text-red-300 border border-red-800 hover:bg-red-900' : 'bg-emerald-700 text-white hover:bg-emerald-600'
                    }`}
                    onClick={() => {
                        setIsConnected(!isConnected);
                        setMunzStudioStatus(isConnected ? 'disconnected' : 'searching');
                        if(!isConnected) setTimeout(() => setMunzStudioStatus('connected'), 2000);
                    }}
                >
                    <Power size={14} /> {isConnected ? 'Disconnect' : 'Connect Bridge'}
                </button>
                <button className="px-3 bg-zinc-700 rounded text-zinc-300 hover:bg-zinc-600">
                    <RefreshCw size={14} />
                </button>
            </div>
        </div>

        {/* Software Integrations */}
        <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">External Integrations</h3>
            <div className="space-y-2">
                
                {/* Blender */}
                <div className="flex items-center justify-between bg-zinc-800 p-3 rounded border border-zinc-700 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#E87D0D] rounded flex items-center justify-center font-bold text-black text-xs">B3D</div>
                        <div>
                            <div className="text-sm font-bold">Blender</div>
                            <div className="text-[10px] text-zinc-400">Via Add-on Port 5500</div>
                        </div>
                    </div>
                    <Link size={14} className={isConnected ? "text-emerald-500" : "text-zinc-600"} />
                </div>

                {/* DaVinci */}
                <div className="flex items-center justify-between bg-zinc-800 p-3 rounded border border-zinc-700 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#283655] border border-blue-500/30 rounded flex items-center justify-center font-bold text-blue-200 text-xs">DVR</div>
                        <div>
                            <div className="text-sm font-bold">DaVinci Resolve</div>
                            <div className="text-[10px] text-zinc-400">Via OpenFX Plugin</div>
                        </div>
                    </div>
                    <Link size={14} className="text-zinc-600" />
                </div>

                {/* Natron */}
                <div className="flex items-center justify-between bg-zinc-800 p-3 rounded border border-zinc-700 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-700 rounded flex items-center justify-center font-bold text-white text-xs">N</div>
                        <div>
                            <div className="text-sm font-bold">Natron</div>
                            <div className="text-[10px] text-zinc-400">File Watcher Mode</div>
                        </div>
                    </div>
                    <Link size={14} className="text-zinc-600" />
                </div>

            </div>
        </div>

        {/* Data Transfer */}
        {isConnected && (
            <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                <h3 className="font-bold text-xs text-zinc-400 uppercase mb-3 flex items-center gap-2">
                    <Activity size={14} /> Active Session Data
                </h3>
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Pipeline</span>
                        <span className="text-cyan-400">Munz Studio V2 (ComfyUI)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Model</span>
                        <span className="text-white">Wan 2.2 I2V 14B Q4_K_M</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Queue</span>
                        <span className="text-emerald-400">Idle</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between items-center">
                        <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 flex items-center gap-1">
                            <FileVideo size={10} /> Sync Assets
                        </button>
                        <span className="text-[9px] text-zinc-600">Latency: 12ms</span>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default BridgePanel;