import { CorrelatedSceneGraph } from '../../three-components/gltf-instance/correlated-scene-graph.js';
import { Model as ModelInterface } from './api.js';
import { Material } from './material.js';
declare const $materials: unique symbol;
/**
 * A Model facades the top-level GLTF object returned by Three.js' GLTFLoader.
 * Currently, the model only bothers itself with the materials in the Three.js
 * scene graph.
 */
export declare class Model implements ModelInterface {
    private [$materials];
    constructor(correlatedSceneGraph: CorrelatedSceneGraph, onUpdate?: () => void);
    /**
     * Materials are listed in the order of the GLTF materials array, plus a
     * default material at the end if one is used.
     *
     * TODO(#1003): How do we handle non-active scenes?
     */
    get materials(): Array<Material>;
}
export {};
