/* @license
 * Copyright 2021 Google LLC. All Rights Reserved.
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
/**
 * KHR_materials_variants specification allows duplicated variant names
 * but it makes handling the extension complex.
 * We ensure tha names and make it easier.
 * If you want to export the extension with the original names
 * you are recommended to write GLTFExporter plugin to restore the names.
 *
 * @param variantNames {Array<string>}
 * @return {Array<string>}
 */
const ensureUniqueNames = (variantNames) => {
    const uniqueNames = [];
    const knownNames = new Set();
    for (const name of variantNames) {
        let uniqueName = name;
        let suffix = 0;
        // @TODO: An easy solution.
        //        O(N^2) in the worst scenario where N is variantNames.length.
        //        Fix me if needed.
        while (knownNames.has(uniqueName)) {
            uniqueName = name + '.' + (++suffix);
        }
        knownNames.add(uniqueName);
        uniqueNames.push(uniqueName);
    }
    return uniqueNames;
};
/**
 * Convert mappings array to table object to make handling the extension easier.
 *
 * @param
 *     extensionDef {glTF.meshes[n].primitive.extensions.KHR_materials_variants}
 * @param variantNames {Array<string>} Required to be unique names
 * @return {Map}
 */
const mappingsArrayToTable = (extensionDef, variantNames) => {
    const table = new Map();
    for (const mapping of extensionDef.mappings) {
        for (const variant of mapping.variants) {
            table.set(variantNames[variant], { material: null, gltfMaterialIndex: mapping.material });
        }
    }
    return table;
};
/**
 * @param object {THREE.Object3D}
 * @return {boolean}
 */
const compatibleObject = (object) => {
    return 'material' in object && // easier than (!object.isMesh &&
        // !object.isLine && !object.isPoints)
        object.userData && // just in case
        object.userData.variantMaterials;
};
export default class GLTFMaterialsVariantsExtension {
    constructor(parser) {
        this.parser = parser;
        this.name = 'KHR_materials_variants';
    }
    // Note that the following properties will be overridden even if they are
    // pre-defined
    // - gltf.userData.variants
    // - mesh.userData.variantMaterials
    afterRoot(gltf) {
        const parser = this.parser;
        const json = parser.json;
        if (json.extensions === undefined ||
            json.extensions[this.name] === undefined) {
            return null;
        }
        const extensionDef = json.extensions[this.name];
        const variantsDef = extensionDef.variants || [];
        const variants = ensureUniqueNames(variantsDef.map((v) => v.name));
        for (const scene of gltf.scenes) {
            // Save the variants data under associated mesh.userData
            scene.traverse(object => {
                // The following code can be simplified if parser.associations directly
                // supports meshes.
                const association = parser.associations.get(object);
                if (!association || association.type !== 'nodes') {
                    return;
                }
                const nodeDef = json.nodes[association.index];
                const meshIndex = nodeDef.mesh;
                if (meshIndex === undefined) {
                    return;
                }
                // Two limitations:
                // 1. The nodeDef shouldn't have any objects (camera, light, or
                // nodeDef.extensions object)
                //    other than nodeDef.mesh
                // 2. Other plugins shouldn't change any scene graph hierarchy
                // The following code can cause error if hitting the either or both
                // limitations If parser.associations will directly supports meshes
                // these limitations can be removed
                const meshDef = json.meshes[meshIndex];
                const primitivesDef = meshDef.primitives;
                const meshes = 'isMesh' in object ? [object] : object.children;
                for (let i = 0; i < primitivesDef.length; i++) {
                    const primitiveDef = primitivesDef[i];
                    const extensionsDef = primitiveDef.extensions;
                    if (!extensionsDef || !extensionsDef[this.name]) {
                        continue;
                    }
                    meshes[i].userData.variantMaterials =
                        mappingsArrayToTable(extensionsDef[this.name], variants);
                }
            });
        }
        gltf.userData.variants = variants;
        // @TODO: Adding functions to userData might be problematic
        //        for example when serializing?
        gltf.userData.functions = gltf.userData.functions || {};
        /**
         * @param object {THREE.Mesh}
         * @param variantName {string|null}
         * @return {Promise}
         * @TODO: Support multi materials?
         */
        const switchMaterial = async (object, variantName, onUpdate) => {
            if (!object.userData.originalMaterial) {
                object.userData.originalMaterial = object.material;
            }
            const oldMaterial = object.material;
            let gltfMaterialIndex = null;
            if (variantName === null ||
                !object.userData.variantMaterials.has(variantName)) {
                object.material = object.userData.originalMaterial;
                if (parser.associations.has(object.material)) {
                    gltfMaterialIndex =
                        parser.associations.get(object.material).index;
                }
            }
            else {
                const variantMaterialParam = object.userData.variantMaterials.get(variantName);
                if (variantMaterialParam.material) {
                    object.material = variantMaterialParam.material;
                    if ('gltfMaterialIndex' in variantMaterialParam) {
                        gltfMaterialIndex = variantMaterialParam.gltfMaterialIndex;
                    }
                }
                else {
                    gltfMaterialIndex = variantMaterialParam.gltfMaterialIndex;
                    object.material =
                        await parser.getDependency('material', gltfMaterialIndex);
                    parser.assignFinalMaterial(object);
                    variantMaterialParam.material = object.material;
                }
            }
            if (onUpdate !== null) {
                onUpdate(object, oldMaterial, gltfMaterialIndex);
            }
        };
        /**
         * @param object {THREE.Mesh}
         * @return {Promise}
         */
        const ensureLoadVariants = (object) => {
            const currentMaterial = object.material;
            const variantMaterials = object.userData.variantMaterials;
            const pending = [];
            for (const variantName of variantMaterials.keys()) {
                const variantMaterial = variantMaterials.get(variantName);
                if (variantMaterial.material) {
                    continue;
                }
                const materialIndex = variantMaterial.gltfMaterialIndex;
                pending.push(parser.getDependency('material', materialIndex)
                    .then((material) => {
                    object.material = material;
                    parser.assignFinalMaterial(object);
                    variantMaterials.get(variantName).material =
                        object.material;
                }));
            }
            return Promise.all(pending).then(() => {
                object.material = currentMaterial;
            });
        };
        /**
         * @param object {THREE.Object3D}
         * @param variantName {string|null}
         * @param doTraverse {boolean} Default is true
         * @param onUpdate {function}
         * @return {Promise}
         */
        gltf.userData.functions.selectVariant =
            (object, variantName, doTraverse = true, onUpdate = null) => {
                const pending = [];
                if (doTraverse) {
                    object.traverse((o) => compatibleObject(o) &&
                        pending.push(switchMaterial(o, variantName, onUpdate)));
                }
                else {
                    compatibleObject(object) &&
                        pending.push(switchMaterial(object, variantName, onUpdate));
                }
                return Promise.all(pending);
            };
        /**
         * @param object {THREE.Object3D}
         * @param doTraverse {boolean} Default is true
         * @return {Promise}
         */
        gltf.userData.functions.ensureLoadVariants =
            (object, doTraverse = true) => {
                const pending = [];
                if (doTraverse) {
                    object.traverse((o) => compatibleObject(o) &&
                        pending.push(ensureLoadVariants(o)));
                }
                else {
                    compatibleObject(object) &&
                        pending.push(ensureLoadVariants(object));
                }
                return Promise.all(pending);
            };
        return Promise.resolve();
    }
}
//# sourceMappingURL=VariantMaterialLoaderPlugin.js.map