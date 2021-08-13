import { Material, MeshStandardMaterial } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { $clone, $prepare, GLTFInstance, PreparedGLTF } from '../GLTFInstance.js';
import { CorrelatedSceneGraph } from './correlated-scene-graph.js';
export declare const ALPHA_CUTOFF_OPAQUE = -0.5;
export declare const ALPHA_CUTOFF_BLEND = 0;
declare const $cloneAndPatchMaterial: unique symbol;
declare const $correlatedSceneGraph: unique symbol;
interface PreparedModelViewerGLTF extends PreparedGLTF {
    [$correlatedSceneGraph]?: CorrelatedSceneGraph;
}
/**
 * This specialization of GLTFInstance collects all of the processing needed
 * to prepare a model and to clone it making special considerations for
 * <model-viewer> use cases.
 */
export declare class ModelViewerGLTFInstance extends GLTFInstance {
    /**
     * @override
     */
    protected static [$prepare](source: GLTF): PreparedModelViewerGLTF;
    get correlatedSceneGraph(): CorrelatedSceneGraph;
    /**
     * @override
     */
    [$clone](): PreparedGLTF;
    /**
     * Creates a clone of the given material, and applies a patch to the
     * shader program.
     */
    [$cloneAndPatchMaterial](material: MeshStandardMaterial, sourceUUIDToClonedMaterial: Map<string, Material>): Material;
}
export {};
