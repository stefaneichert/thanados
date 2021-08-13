import { MeshStandardMaterial } from 'three';
import { AlphaMode, GLTF, Material as GLTFMaterial } from '../../three-components/gltf-instance/gltf-2.0.js';
import { Material as MaterialInterface, RGB } from './api.js';
import { PBRMetallicRoughness } from './pbr-metallic-roughness.js';
import { TextureInfo } from './texture-info.js';
import { ThreeDOMElement } from './three-dom-element.js';
declare const $pbrMetallicRoughness: unique symbol;
declare const $normalTexture: unique symbol;
declare const $occlusionTexture: unique symbol;
declare const $emissiveTexture: unique symbol;
declare const $backingThreeMaterial: unique symbol;
declare const $applyAlphaCutoff: unique symbol;
/**
 * Material facade implementation for Three.js materials
 */
export declare class Material extends ThreeDOMElement implements MaterialInterface {
    private [$pbrMetallicRoughness];
    private [$normalTexture];
    private [$occlusionTexture];
    private [$emissiveTexture];
    get [$backingThreeMaterial](): MeshStandardMaterial;
    constructor(onUpdate: () => void, gltf: GLTF, gltfMaterial: GLTFMaterial, correlatedMaterials: Set<MeshStandardMaterial> | undefined);
    get name(): string;
    get pbrMetallicRoughness(): PBRMetallicRoughness;
    get normalTexture(): TextureInfo;
    get occlusionTexture(): TextureInfo;
    get emissiveTexture(): TextureInfo;
    get emissiveFactor(): RGB;
    setEmissiveFactor(rgb: RGB): void;
    [$applyAlphaCutoff](): void;
    setAlphaCutoff(cutoff: number): void;
    getAlphaCutoff(): number;
    setDoubleSided(doubleSided: boolean): void;
    getDoubleSided(): boolean;
    setAlphaMode(alphaMode: AlphaMode): void;
    getAlphaMode(): AlphaMode;
}
export {};
