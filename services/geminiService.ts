import { GoogleGenAI, Type } from "@google/genai";

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

/**
 * Generates a video using Veo 3.1
 * Can take an optional reference image for Image-to-Video
 */
export const generateVideo = async (
  prompt: string, 
  referenceImageBase64?: string
): Promise<string> => {
  const ai = getClient();
  const model = referenceImageBase64 ? 'veo-3.1-fast-generate-preview' : 'veo-3.1-fast-generate-preview';
  
  try {
    let operation;
    
    if (referenceImageBase64) {
      operation = await ai.models.generateVideos({
        model,
        image: {
          imageBytes: referenceImageBase64,
          mimeType: 'image/png', // Assuming PNG for simplicity in this demo context
        },
        prompt, // Optional but good for guidance
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    } else {
      operation = await ai.models.generateVideos({
        model,
        prompt,
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

    // We must append the key to fetch the actual bytes if we were to fetch it, 
    // but here we return the URI to be handled by the frontend. 
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
    fullPrompt += " detailed physics simulation for clothing, hair, and accessories, reacting naturally to movement and wind.";
  }
  
  if (settings.useMocap) {
    fullPrompt += " Extremely lifelike, motion-captured movement data style, realistic weight and balance.";
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
  options: { upscale: boolean; denoise: boolean; colorGrade: string; reconstruction: string; textures: string }
): Promise<string> => {

  let fullPrompt = `High quality video output. ${basePrompt}.`;

  if (options.upscale) fullPrompt += " Ultra-high resolution 4K style, sharp details.";
  if (options.denoise) fullPrompt += " Clean, noise-free, restoration quality.";
  if (options.colorGrade) fullPrompt += ` Professional color grading: ${options.colorGrade}.`;
  if (options.reconstruction) fullPrompt += ` Reconstructed details: ${options.reconstruction}.`;
  if (options.textures) fullPrompt += ` Material change: ${options.textures}.`;

  return await generateVideo(fullPrompt);
};

/**
 * Generates a script or screenplay scene description
 */
export const generateScript = async (prompt: string): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: "You are a Hollywood professional screenwriter. Output formatted screenplay text.",
    }
  });
  return response.text || "";
};

/**
 * Generates an image for character concepts or storyboards
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  // Using gemini-3-pro-image-preview for high quality character concepts
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