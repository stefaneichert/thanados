import { ViewingHint, Behavior, ViewingDirection } from "@iiif/vocabulary/dist-commonjs";
import { Canvas, IManifestoOptions, IIIFResource, ManifestType, Range, Sequence, TreeNode } from "./internal";
export declare class Manifest extends IIIFResource {
    index: number;
    private _allRanges;
    items: Sequence[];
    private _topRanges;
    constructor(jsonld?: any, options?: IManifestoOptions);
    /** @deprecated Use getAccompanyingCanvas instead */
    getPosterCanvas(): Canvas | null;
    getAccompanyingCanvas(): Canvas | null;
    getBehavior(): Behavior | null;
    getDefaultTree(): TreeNode;
    private _getTopRanges;
    getTopRanges(): Range[];
    private _getRangeById;
    private _parseRanges;
    getAllRanges(): Range[];
    getRangeById(id: string): Range | null;
    getRangeByPath(path: string): Range | null;
    getSequences(): Sequence[];
    getSequenceByIndex(sequenceIndex: number): Sequence;
    getTotalSequences(): number;
    getManifestType(): ManifestType;
    isMultiSequence(): boolean;
    isPagingEnabled(): boolean;
    getViewingDirection(): ViewingDirection | null;
    getViewingHint(): ViewingHint | null;
}
