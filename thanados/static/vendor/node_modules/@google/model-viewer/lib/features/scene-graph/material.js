/* @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { DoubleSide, FrontSide } from 'three';
import { ALPHA_CUTOFF_BLEND, ALPHA_CUTOFF_OPAQUE } from '../../three-components/gltf-instance/ModelViewerGLTFInstance.js';
import { PBRMetallicRoughness } from './pbr-metallic-roughness.js';
import { TextureInfo, TextureUsage } from './texture-info.js';
import { $correlatedObjects, $onUpdate, $sourceObject, ThreeDOMElement } from './three-dom-element.js';
const $pbrMetallicRoughness = Symbol('pbrMetallicRoughness');
const $normalTexture = Symbol('normalTexture');
const $occlusionTexture = Symbol('occlusionTexture');
const $emissiveTexture = Symbol('emissiveTexture');
const $backingThreeMaterial = Symbol('backingThreeMaterial');
const $applyAlphaCutoff = Symbol('applyAlphaCutoff');
/**
 * Material facade implementation for Three.js materials
 */
export class Material extends ThreeDOMElement {
    constructor(onUpdate, gltf, gltfMaterial, correlatedMaterials) {
        super(onUpdate, gltfMaterial, correlatedMaterials);
        if (correlatedMaterials == null) {
            return;
        }
        if (gltfMaterial.extensions &&
            gltfMaterial.extensions['KHR_materials_pbrSpecularGlossiness']) {
            console.warn(`Material ${gltfMaterial.name} uses a deprecated extension
          "KHR_materials_pbrSpecularGlossiness", please use
          "pbrMetallicRoughness" instead. Specular Glossiness materials are
          currently supported for rendering, but not for our scene-graph API,
          nor for auto-generation of USDZ for Quick Look.`);
        }
        if (gltfMaterial.pbrMetallicRoughness == null) {
            gltfMaterial.pbrMetallicRoughness = {};
        }
        this[$pbrMetallicRoughness] = new PBRMetallicRoughness(onUpdate, gltf, gltfMaterial.pbrMetallicRoughness, correlatedMaterials);
        if (gltfMaterial.emissiveFactor == null) {
            gltfMaterial.emissiveFactor = [0, 0, 0];
        }
        if (gltfMaterial.doubleSided == null) {
            gltfMaterial.doubleSided = false;
        }
        if (gltfMaterial.alphaMode == null) {
            gltfMaterial.alphaMode = 'OPAQUE';
        }
        if (gltfMaterial.alphaCutoff == null) {
            gltfMaterial.alphaCutoff = 0.5;
        }
        const { normalTexture: gltfNormalTexture, occlusionTexture: gltfOcculsionTexture, emissiveTexture: gltfEmissiveTexture } = gltfMaterial;
        const { normalMap, aoMap, emissiveMap } = correlatedMaterials.values().next().value;
        this[$normalTexture] = new TextureInfo(onUpdate, TextureUsage.Normal, normalMap, correlatedMaterials, gltf, gltfNormalTexture ? gltfNormalTexture : null);
        this[$occlusionTexture] = new TextureInfo(onUpdate, TextureUsage.Occlusion, aoMap, correlatedMaterials, gltf, gltfOcculsionTexture ? gltfOcculsionTexture : null);
        this[$emissiveTexture] = new TextureInfo(onUpdate, TextureUsage.Emissive, emissiveMap, correlatedMaterials, gltf, gltfEmissiveTexture ? gltfEmissiveTexture : null);
    }
    get [$backingThreeMaterial]() {
        return this[$correlatedObjects]
            .values()
            .next()
            .value;
    }
    get name() {
        return this[$sourceObject].name || '';
    }
    get pbrMetallicRoughness() {
        return this[$pbrMetallicRoughness];
    }
    get normalTexture() {
        return this[$normalTexture];
    }
    get occlusionTexture() {
        return this[$occlusionTexture];
    }
    get emissiveTexture() {
        return this[$emissiveTexture];
    }
    get emissiveFactor() {
        return this[$sourceObject].emissiveFactor;
    }
    setEmissiveFactor(rgb) {
        for (const material of this[$correlatedObjects]) {
            material.emissive.fromArray(rgb);
        }
        this[$sourceObject].emissiveFactor = rgb;
        this[$onUpdate]();
    }
    [$applyAlphaCutoff]() {
        const gltfMaterial = this[$sourceObject];
        // 0.0001 is the minimum in order to keep from using zero, which disables
        // masking in three.js. It's also small enough to be less than the smallest
        // normalized 8-bit value.
        const cutoff = gltfMaterial.alphaMode === 'OPAQUE' ?
            ALPHA_CUTOFF_OPAQUE :
            (gltfMaterial.alphaMode === 'BLEND' ?
                ALPHA_CUTOFF_BLEND :
                Math.max(0.0001, Math.min(1.0, gltfMaterial.alphaCutoff)));
        for (const material of this[$correlatedObjects]) {
            material.alphaTest = cutoff;
            material.needsUpdate = true;
        }
    }
    setAlphaCutoff(cutoff) {
        this[$sourceObject].alphaCutoff = cutoff;
        this[$applyAlphaCutoff]();
        this[$onUpdate]();
    }
    getAlphaCutoff() {
        return this[$sourceObject].alphaCutoff;
    }
    setDoubleSided(doubleSided) {
        for (const material of this[$correlatedObjects]) {
            // When double-sided is disabled gltf spec dictates that Back-Face culling
            // must be disabled, in three.js parlance that would mean FrontSide
            // rendering only.
            // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#double-sided
            material.side = doubleSided ? DoubleSide : FrontSide;
            material.needsUpdate = true;
        }
        this[$sourceObject].doubleSided = doubleSided;
        this[$onUpdate]();
    }
    getDoubleSided() {
        return this[$sourceObject].doubleSided;
    }
    setAlphaMode(alphaMode) {
        const enableTransparency = (material, enabled) => {
            material.transparent = enabled;
            material.depthWrite = !enabled;
        };
        this[$sourceObject].alphaMode = alphaMode;
        for (const material of this[$correlatedObjects]) {
            enableTransparency(material, alphaMode !== 'OPAQUE');
            this[$applyAlphaCutoff]();
            material.needsUpdate = true;
        }
        this[$onUpdate]();
    }
    getAlphaMode() {
        return this[$sourceObject].alphaMode;
    }
}
//# sourceMappingURL=material.js.map