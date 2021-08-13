/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
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
import { EquirectangularReflectionMapping, EventDispatcher, GammaEncoding, PMREMGenerator, TextureLoader, UnsignedByteType } from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { deserializeUrl } from '../utilities.js';
import EnvironmentScene from './EnvironmentScene.js';
import EnvironmentSceneAlt from './EnvironmentSceneAlt.js';
const GENERATED_SIGMA = 0.04;
const HDR_FILE_RE = /\.hdr(\.js)?$/;
const ldrLoader = new TextureLoader();
const hdrLoader = new RGBELoader();
hdrLoader.setDataType(UnsignedByteType);
// Attach a `userData` object for arbitrary data on textures that
// originate from TextureUtils, similar to Object3D's userData,
// for help debugging, providing metadata for tests, and semantically
// describe the type of texture within the context of this application.
const userData = {
    url: null,
};
export default class TextureUtils extends EventDispatcher {
    constructor(threeRenderer) {
        super();
        this.generatedEnvironmentMap = null;
        this.generatedEnvironmentMapAlt = null;
        this.skyboxCache = new Map();
        this.environmentMapCache = new Map();
        this.PMREMGenerator = new PMREMGenerator(threeRenderer);
    }
    async load(url, progressCallback = () => { }) {
        try {
            const isHDR = HDR_FILE_RE.test(url);
            const loader = isHDR ? hdrLoader : ldrLoader;
            const texture = await new Promise((resolve, reject) => loader.load(url, resolve, (event) => {
                progressCallback(event.loaded / event.total * 0.9);
            }, reject));
            progressCallback(1.0);
            this.addMetadata(texture, url);
            texture.mapping = EquirectangularReflectionMapping;
            if (!isHDR) {
                texture.encoding = GammaEncoding;
            }
            return texture;
        }
        finally {
            if (progressCallback) {
                progressCallback(1);
            }
        }
    }
    /**
     * Returns a { skybox, environmentMap } object with the targets/textures
     * accordingly. `skybox` is a WebGLRenderCubeTarget, and `environmentMap`
     * is a Texture from a WebGLRenderCubeTarget.
     */
    async generateEnvironmentMapAndSkybox(skyboxUrl = null, environmentMap = null, options = {}) {
        const { progressTracker } = options;
        const updateGenerationProgress = progressTracker != null ? progressTracker.beginActivity() : () => { };
        const useAltEnvironment = environmentMap === 'neutral';
        if (useAltEnvironment === true) {
            environmentMap = null;
        }
        const environmentMapUrl = deserializeUrl(environmentMap);
        try {
            let skyboxLoads = Promise.resolve(null);
            let environmentMapLoads;
            // If we have a skybox URL, attempt to load it as a cubemap
            if (!!skyboxUrl) {
                skyboxLoads = this.loadSkyboxFromUrl(skyboxUrl, progressTracker);
            }
            if (!!environmentMapUrl) {
                // We have an available environment map URL
                environmentMapLoads =
                    this.loadEnvironmentMapFromUrl(environmentMapUrl, progressTracker);
            }
            else if (!!skyboxUrl) {
                // Fallback to deriving the environment map from an available skybox
                environmentMapLoads =
                    this.loadEnvironmentMapFromUrl(skyboxUrl, progressTracker);
            }
            else {
                // Fallback to generating the environment map
                environmentMapLoads = useAltEnvironment === true ?
                    this.loadGeneratedEnvironmentMapAlt() :
                    this.loadGeneratedEnvironmentMap();
            }
            let [environmentMap, skybox] = await Promise.all([environmentMapLoads, skyboxLoads]);
            if (environmentMap == null) {
                throw new Error('Failed to load environment map.');
            }
            return { environmentMap, skybox };
        }
        finally {
            updateGenerationProgress(1.0);
        }
    }
    addMetadata(texture, url) {
        if (texture == null) {
            return;
        }
        texture.userData = Object.assign(Object.assign({}, userData), ({
            url: url,
        }));
    }
    /**
     * Loads an equirect Texture from a given URL, for use as a skybox.
     */
    loadSkyboxFromUrl(url, progressTracker) {
        if (!this.skyboxCache.has(url)) {
            const progressCallback = progressTracker ? progressTracker.beginActivity() : () => { };
            const skyboxMapLoads = this.load(url, progressCallback);
            this.skyboxCache.set(url, skyboxMapLoads);
        }
        return this.skyboxCache.get(url);
    }
    /**
     * Loads a WebGLRenderTarget from a given URL. The render target in this
     * case will be assumed to be used as an environment map.
     */
    loadEnvironmentMapFromUrl(url, progressTracker) {
        if (!this.environmentMapCache.has(url)) {
            const environmentMapLoads = this.loadSkyboxFromUrl(url, progressTracker).then((equirect) => {
                const cubeUV = this.PMREMGenerator.fromEquirectangular(equirect);
                this.addMetadata(cubeUV.texture, url);
                return cubeUV;
            });
            this.PMREMGenerator.compileEquirectangularShader();
            this.environmentMapCache.set(url, environmentMapLoads);
        }
        return this.environmentMapCache.get(url);
    }
    /**
     * Loads a dynamically generated environment map.
     */
    loadGeneratedEnvironmentMap() {
        if (this.generatedEnvironmentMap == null) {
            const defaultScene = new EnvironmentScene;
            this.generatedEnvironmentMap =
                this.PMREMGenerator.fromScene(defaultScene, GENERATED_SIGMA);
            this.addMetadata(this.generatedEnvironmentMap.texture, null);
        }
        return Promise.resolve(this.generatedEnvironmentMap);
    }
    /**
     * Loads a dynamically generated environment map, designed to be neutral and
     * color-preserving. Shows less contrast around the different sides of the
     * object.
     */
    loadGeneratedEnvironmentMapAlt() {
        if (this.generatedEnvironmentMapAlt == null) {
            const defaultScene = new EnvironmentSceneAlt;
            this.generatedEnvironmentMapAlt =
                this.PMREMGenerator.fromScene(defaultScene, GENERATED_SIGMA);
            this.addMetadata(this.generatedEnvironmentMapAlt.texture, null);
        }
        return Promise.resolve(this.generatedEnvironmentMapAlt);
    }
    async dispose() {
        const allTargetsLoad = [];
        // NOTE(cdata): We would use for-of iteration on the maps here, but
        // IE11 doesn't have the necessary iterator-returning methods. So,
        // disposal of these render targets is kind of convoluted as a result.
        this.environmentMapCache.forEach((targetLoads) => {
            allTargetsLoad.push(targetLoads);
        });
        this.environmentMapCache.clear();
        for (const targetLoads of allTargetsLoad) {
            try {
                const target = await targetLoads;
                target.dispose();
            }
            catch (e) {
                // Suppress errors, so that all render targets will be disposed
            }
        }
        if (this.generatedEnvironmentMap != null) {
            this.generatedEnvironmentMap.dispose();
            this.generatedEnvironmentMap = null;
        }
        if (this.generatedEnvironmentMapAlt != null) {
            this.generatedEnvironmentMapAlt.dispose();
            this.generatedEnvironmentMapAlt = null;
        }
    }
}
//# sourceMappingURL=TextureUtils.js.map