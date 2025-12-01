
export enum ViewMode {
  EDITOR = 'EDITOR',
  SCRIPT = 'SCRIPT',
}

export enum ToolType {
  SELECT = 'SELECT',
  CUT = 'CUT',
  MAGIC_VFX = 'MAGIC_VFX', // General generation
  SCENE_REPLACE = 'SCENE_REPLACE', // Background swap
  CHARACTER_CREATOR = 'CHARACTER_CREATOR', // Veo generation
  OBJECT_TRACK = 'OBJECT_TRACK', // Simulated tracking/matting
  ANIMATION_STUDIO = 'ANIMATION_STUDIO', // New: Rigging & Animation
  SCENE_ARCHITECT = 'SCENE_ARCHITECT', // New: Reconstruction & Enhancement
  MATERIAL_LIBRARY = 'MATERIAL_LIBRARY', // New: Asset Browser
  BRIDGE = 'BRIDGE', // New: External Software Integration
  TEMPLATES = 'TEMPLATES', // New: Project Templates
  SETTINGS = 'SETTINGS', // New: Model Manager & Downloads
}

export enum VFXModule {
  GEN_FILL = 'GEN_FILL', // Adobe Firefly
  MAGIC_MASK = 'MAGIC_MASK', // DaVinci Resolve
  RELIGHT = 'RELIGHT', // Relight.AI
  ROTOBOT = 'ROTOBOT', // Rotoscoping
  SKY_REPLACE = 'SKY_REPLACE', // Luminar Neo
  DENOISE = 'DENOISE', // Topaz DeNoise
  SHARPEN = 'SHARPEN', // Topaz Sharpen
  NEURAL_FILTER = 'NEURAL_FILTER', // Photoshop Neural Filters
  DEPTH_MAP = 'DEPTH_MAP' // Depth-AI
}

export interface MaskPoint {
  id: string;
  x: number; // 0-1 normalized coordinate
  y: number; // 0-1 normalized coordinate
  type: 'include' | 'exclude';
}

export interface Clip {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio';
  start: number; // in seconds
  duration: number; // in seconds
  trackId: string;
  thumbnail?: string;
  url?: string;
  promptUsed?: string;
}

export interface Track {
  id: string;
  name: string;
  clips: Clip[];
  locked: boolean;
  visible: boolean;
}

export interface ProjectState {
  name: string;
  duration: number;
  tracks: Track[];
  currentTime: number;
  zoomLevel: number;
}

export interface GeneratedAsset {
  id: string;
  url: string;
  prompt: string;
  type: 'video' | 'image';
  timestamp: number;
}
