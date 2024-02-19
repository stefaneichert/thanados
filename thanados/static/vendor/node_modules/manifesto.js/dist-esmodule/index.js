export * from "./internal";
import { Utils } from "./Utils";
export var loadManifest = function (url) {
    return Utils.loadManifest(url);
};
export var parseManifest = function (manifest, options) {
    return Utils.parseManifest(manifest, options);
};
//# sourceMappingURL=index.js.map