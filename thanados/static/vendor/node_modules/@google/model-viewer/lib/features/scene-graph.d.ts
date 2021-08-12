import ModelViewerElementBase from '../model-viewer-base.js';
import { GLTF } from '../three-components/gltf-instance/gltf-defaulted.js';
import { Constructor } from '../utilities.js';
import { Model } from './scene-graph/model.js';
import { Texture as ModelViewerTexture } from './scene-graph/texture';
interface SceneExportOptions {
    binary?: boolean;
    trs?: boolean;
    onlyVisible?: boolean;
    embedImages?: boolean;
    maxTextureSize?: number;
    forcePowerOfTwoTextures?: boolean;
    includeCustomExtensions?: boolean;
}
export interface SceneGraphInterface {
    readonly model?: Model;
    variantName: string | undefined;
    readonly availableVariants: Array<string>;
    orientation: string;
    scale: string;
    readonly originalGltfJson: GLTF | null;
    exportScene(options?: SceneExportOptions): Promise<Blob>;
    createTexture(uri: string, type?: string): Promise<ModelViewerTexture | null>;
}
/**
 * SceneGraphMixin manages exposes a model API in order to support operations on
 * the <model-viewer> scene graph.
 */
export declare const SceneGraphMixin: <T extends Constructor<ModelViewerElementBase, object>>(ModelViewerElement: T) => {
    new (...args: any[]): SceneGraphInterface;
    prototype: SceneGraphInterface;
} & object & T;
export {};
