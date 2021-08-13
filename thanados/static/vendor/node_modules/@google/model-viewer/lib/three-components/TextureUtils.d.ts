import { EventDispatcher, Texture, WebGLRenderer, WebGLRenderTarget } from 'three';
import { ProgressTracker } from '../utilities/progress-tracker.js';
export interface EnvironmentMapAndSkybox {
    environmentMap: WebGLRenderTarget;
    skybox: Texture | null;
}
export interface EnvironmentGenerationConfig {
    progressTracker?: ProgressTracker;
}
export default class TextureUtils extends EventDispatcher {
    private generatedEnvironmentMap;
    private generatedEnvironmentMapAlt;
    private PMREMGenerator;
    private skyboxCache;
    private environmentMapCache;
    constructor(threeRenderer: WebGLRenderer);
    load(url: string, progressCallback?: (progress: number) => void): Promise<Texture>;
    /**
     * Returns a { skybox, environmentMap } object with the targets/textures
     * accordingly. `skybox` is a WebGLRenderCubeTarget, and `environmentMap`
     * is a Texture from a WebGLRenderCubeTarget.
     */
    generateEnvironmentMapAndSkybox(skyboxUrl?: string | null, environmentMap?: string | null, options?: EnvironmentGenerationConfig): Promise<EnvironmentMapAndSkybox>;
    private addMetadata;
    /**
     * Loads an equirect Texture from a given URL, for use as a skybox.
     */
    private loadSkyboxFromUrl;
    /**
     * Loads a WebGLRenderTarget from a given URL. The render target in this
     * case will be assumed to be used as an environment map.
     */
    private loadEnvironmentMapFromUrl;
    /**
     * Loads a dynamically generated environment map.
     */
    private loadGeneratedEnvironmentMap;
    /**
     * Loads a dynamically generated environment map, designed to be neutral and
     * color-preserving. Shows less contrast around the different sides of the
     * object.
     */
    private loadGeneratedEnvironmentMapAlt;
    dispose(): Promise<void>;
}
