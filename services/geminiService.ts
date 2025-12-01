import { GoogleGenAI, FunctionDeclaration, Type, SchemaType } from "@google/genai";

const getClient = () => {
  // Always create a new client to pick up the latest selected key if changed via window.aistudio
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const checkApiKeySelection = async (): Promise<boolean> => {
  if ((window as any).aistudio?.hasSelectedApiKey) {
    return await (window as any).aistudio.hasSelectedApiKey();
  }
  return !!process.env.API_KEY; // Fallback for dev environments if not in the specific runtime
};

export const promptApiKeySelection = async () => {
  if ((window as any).aistudio?.openSelectKey) {
    await (window as any).aistudio.openSelectKey();
  }
};

// --- Intelligent Command Processing ---

export interface VFXCommand {
  action: 'CHANGE_TOOL' | 'GENERATE' | 'APPLY_PRESET' | 'UNKNOWN';
  toolId?: string;
  parameters?: any;
  responseMessage?: string;
  detectedEngine?: string;
}

const toolsDeclaration: FunctionDeclaration[] = [
  {
    name: 'change_tool',
    description: 'Switch the active tool in the application panel.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tool_id: {
          type: Type.STRING,
          description: 'The ID of the tool to switch to. Options: SELECT, CUT, MAGIC_VFX, SCENE_REPLACE, CHARACTER_CREATOR, OBJECT_TRACK, ANIMATION_STUDIO, SCENE_ARCHITECT, MATERIAL_LIBRARY, BRIDGE, SETTINGS',
        },
      },
      required: ['tool_id'],
    },
  },
  {
    name: 'generate_vfx',
    description: 'Generate a video or image effect based on a description, selecting the appropriate AI engine.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: 'Refined prompt for the generation model.' },
        requires_input_source: { type: Type.BOOLEAN, description: 'True if the user wants to edit/modify the existing video input.' },
        detected_engine: {
          type: Type.STRING,
          description: 'The best suited AI engine for this task.',
          enum: [
            'VEO_2', 'NANO_BANANA_PRO', // Google First Party
            'DAVINCI_MAGIC_MASK', // Rotoscoping/Masking
            'TOPAZ_VIDEO_AI', // Upscaling/Denoising
            'BLENDER_CYCLES', // 3D Rendering
            'ADOBE_SENSEI', // General Auto-Edit
            'NOTEBOOK_LM' // Research/Scripting
          ]
        }
      },
      required: ['prompt'],
    },
  },
];

export const processVFXCommand = async (userPrompt: string): Promise<VFXCommand> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        tools: [{ functionDeclarations: toolsDeclaration }],
        systemInstruction: "You are MunzGen AI Copilot. Map user requests to the most advanced AI engine available. For example, 'remove background' -> DAVINCI_MAGIC_MASK. 'Upscale' -> TOPAZ_VIDEO_AI. 'Create character' -> NANO_BANANA_PRO or VEO_2. 'Physics simulation' -> BLENDER_CYCLES.",
      },
    });

    const call = response.functionCalls?.[0];
    
    if (call) {
      if (call.name === 'change_tool') {
        return { 
          action: 'CHANGE_TOOL', 
          toolId: (call.args as any).tool_id,
          responseMessage: `Switching to ${(call.args as any).tool_id}...`
        };
      } else if (call.name === 'generate_vfx') {
        return { 
          action: 'GENERATE', 
          parameters: call.args,
          responseMessage: "Initiating generation...",
          detectedEngine: (call.args as any).detected_engine
        };
      }
    }

    // Default fallthrough if no function call
    return { action: 'GENERATE', parameters: { prompt: userPrompt, requires_input_source: true }, detectedEngine: 'VEO_2' };

  } catch (e) {
    console.error("Command processing failed", e);
    return { action: 'GENERATE', parameters: { prompt: userPrompt, requires_input_source: true }, detectedEngine: 'VEO_2' };
  }
};

// --- Generation Services ---

/**
 * Generates a video using Veo 3.1
 * Can take an optional reference image (base64) for Image-to-Video
 */
export const generateVideo = async (
  prompt: string, 
  referenceImageBase64?: string,
  engine?: string
): Promise<string> => {
  const ai = getClient();
  
  // Use "generate" (Pro/Slow) for high quality if no ref, or "fast" for preview. 
  // User requested "Veo 2" (advanced), so we prioritize quality.
  const model = 'veo-3.1-generate-preview'; 
  
  // Inject engine-specific stylistic keywords
  let finalPrompt = prompt;
  if (engine === 'DAVINCI_MAGIC_MASK') finalPrompt += " (Use perfect rotoscoping, clean matte extraction, high contrast separation).";
  if (engine === 'TOPAZ_VIDEO_AI') finalPrompt += " (4k resolution, ultra-sharp, noise reduction, artifact removal, 60fps smoothness).";
  if (engine === 'BLENDER_CYCLES') finalPrompt += " (3D Raytraced render, physically based materials, global illumination).";
  
  try {
    let operation;
    
    // Explicitly handle Image-to-Video if reference is provided
    if (referenceImageBase64) {
      operation = await ai.models.generateVideos({
        model, // Use the Pro model for I2V if available, or fall back to fast if needed. Veo 3.1 supports both.
        prompt: finalPrompt, 
        image: {
          imageBytes: referenceImageBase64,
          mimeType: 'image/png', 
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    } else {
      operation = await ai.models.generateVideos({
        model,
        prompt: finalPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    }

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video generated");

    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};

/**
 * Specialized generation for Character Animation
 */
export const generateCharacterAnimation = async (
  characterPrompt: string, 
  motionPrompt: string, 
  settings: { usePhysics: boolean; useMocap: boolean; autoRig: boolean }
): Promise<string> => {
  
  // Construct a sophisticated prompt for Veo that encapsulates the user's technical requests
  let fullPrompt = `High-fidelity 3D character animation. Character: ${characterPrompt}. Movement: ${motionPrompt}. Render style: Physically based rendering, 8k, cinematic lighting.`;
  
  if (settings.usePhysics) {
    fullPrompt += " detailed physics simulation for clothing, hair, and accessories, reacting naturally to movement and wind (Blender Cloth/Hair Sim).";
  }
  
  if (settings.useMocap) {
    fullPrompt += " Extremely lifelike, motion-captured movement data style (Rokoko/Mixamo style), realistic weight and balance.";
  }
  
  if (settings.autoRig) {
    fullPrompt += " Perfectly articulated skeletal animation.";
  }

  // We utilize the video generation capability to visualize this animation
  return await generateVideo(fullPrompt);
};

/**
 * Specialized generation for Scene Reconstruction and Enhancement
 */
export const enhanceScene = async (
  basePrompt: string,
  options: { upscale: boolean; denoise: boolean; colorGrade: string; reconstruction: string; textures: string },
  referenceImageBase64?: string
): Promise<string> => {

  let fullPrompt = `Professional VFX Edit. ${basePrompt}.`;

  if (options.upscale) fullPrompt += " Ultra-high resolution 4K style, sharp details (Topaz Video AI Quality).";
  if (options.denoise) fullPrompt += " Clean, noise-free, restoration quality (DeNoise AI).";
  if (options.colorGrade) fullPrompt += ` Professional color grading: ${options.colorGrade} (DaVinci Resolve Color).`;
  if (options.reconstruction) fullPrompt += ` Reconstructed details: ${options.reconstruction} (Adobe Sensei Fill).`;
  if (options.textures) fullPrompt += ` Material change: ${options.textures}.`;

  // Important: Pass the reference image if available to ensure we edit the actual scene
  return await generateVideo(fullPrompt, referenceImageBase64);
};

/**
 * Generates a script or screenplay scene description
 */
export const generateScript = async (prompt: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Flash is sufficient for text
    contents: prompt,
    config: {
      systemInstruction: "You are a Hollywood professional screenwriter using NotebookLM Plus research capabilities. Output formatted screenplay text.",
    }
  });
  return response.text || "";
};

/**
 * Generates an image for character concepts or storyboards
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  // Using gemini-3-pro-image-preview for high quality character concepts (Nano Banana Pro)
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: '16:9',
        imageSize: '1K',
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};