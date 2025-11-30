import React from 'react';
import { Track } from '../types';
import { LayoutTemplate, Clapperboard, Music, Smartphone, Zap, CheckCircle2 } from 'lucide-react';

interface ProjectTemplatesPanelProps {
  onSelect: (tracks: Track[]) => void;
}

const TEMPLATES = [
  {
    id: 'cinematic',
    name: 'Cinematic Standard',
    icon: Clapperboard,
    description: 'Standard setup for narrative scenes with dialog and score.',
    color: 'bg-blue-900/20 text-blue-400 border-blue-800',
    tracks: [
      { id: 't1', name: 'Main Camera (Video)', clips: [], locked: false, visible: true },
      { id: 't2', name: 'B-Roll / Cutaways', clips: [], locked: false, visible: true },
      { id: 't3', name: 'VFX Overlay', clips: [], locked: false, visible: true },
      { id: 't4', name: 'Dialog (Audio)', clips: [], locked: false, visible: true },
      { id: 't5', name: 'Score (Audio)', clips: [], locked: false, visible: true },
    ]
  },
  {
    id: 'music_video',
    name: 'Music Video',
    icon: Music,
    description: 'Optimized for performance takes and rhythmic editing.',
    color: 'bg-purple-900/20 text-purple-400 border-purple-800',
    tracks: [
      { id: 'mv1', name: 'Performance Take', clips: [], locked: false, visible: true },
      { id: 'mv2', name: 'Concept / Story', clips: [], locked: false, visible: true },
      { id: 'mv3', name: 'Effects Layer', clips: [], locked: false, visible: true },
      { id: 'mv4', name: 'Master Audio', clips: [], locked: true, visible: true },
    ]
  },
  {
    id: 'social',
    name: 'Social Media Short',
    icon: Smartphone,
    description: 'Vertical-focused layout with caption and sticker tracks.',
    color: 'bg-pink-900/20 text-pink-400 border-pink-800',
    tracks: [
      { id: 's1', name: 'Vertical Video Base', clips: [], locked: false, visible: true },
      { id: 's2', name: 'Overlay / Stickers', clips: [], locked: false, visible: true },
      { id: 's3', name: 'Captions / Text', clips: [], locked: false, visible: true },
      { id: 's4', name: 'Trending Sound', clips: [], locked: false, visible: true },
    ]
  },
  {
    id: 'vfx',
    name: 'VFX Heavy Shot',
    icon: Zap,
    description: 'Complex compositing setup with background plates and elements.',
    color: 'bg-emerald-900/20 text-emerald-400 border-emerald-800',
    tracks: [
      { id: 'v1', name: 'Background Plate', clips: [], locked: false, visible: true },
      { id: 'v2', name: '3D Elements / Assets', clips: [], locked: false, visible: true },
      { id: 'v3', name: 'Particle Systems', clips: [], locked: false, visible: true },
      { id: 'v4', name: 'Atmosphere / Fog', clips: [], locked: false, visible: true },
      { id: 'v5', name: 'Color Grade', clips: [], locked: false, visible: true },
    ]
  }
];

const ProjectTemplatesPanel: React.FC<ProjectTemplatesPanelProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">
      <div className="p-4 border-b border-zinc-800">
         <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <LayoutTemplate size={16} /> Project Templates
         </h2>
         <p className="text-xs text-zinc-500 mt-1">Start fresh with a pre-configured timeline layout.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 grid grid-cols-1 gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.tracks)}
            className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${template.color} hover:bg-opacity-30`}
          >
            <div className={`p-3 rounded-full bg-zinc-950/50 shrink-0`}>
               <template.icon size={20} />
            </div>
            <div>
               <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                 {template.name}
               </h3>
               <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                 {template.description}
               </p>
               <div className="mt-2 flex flex-wrap gap-1">
                 {template.tracks.slice(0, 3).map(t => (
                    <span key={t.id} className="text-[9px] bg-zinc-950/50 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-800">
                        {t.name}
                    </span>
                 ))}
                 {template.tracks.length > 3 && (
                    <span className="text-[9px] text-zinc-600 px-1 py-0.5 self-center">+{template.tracks.length - 3} more</span>
                 )}
               </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectTemplatesPanel;
