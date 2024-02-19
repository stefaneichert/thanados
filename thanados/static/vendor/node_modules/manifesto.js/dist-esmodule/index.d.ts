export * from "./internal";
import { IIIFResource } from "./IIIFResource";
import { IManifestoOptions } from "./IManifestoOptions";
export declare const loadManifest: (url: string) => Promise<string>;
export declare const parseManifest: (manifest: any, options?: IManifestoOptions | undefined) => IIIFResource | null;
