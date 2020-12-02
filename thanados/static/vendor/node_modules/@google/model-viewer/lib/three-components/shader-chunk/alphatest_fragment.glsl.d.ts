/**
 * @license MIT
 * @see https://github.com/mrdoob/three.js/blob/dev/LICENSE
 */
export declare const alphaChunk = "\n#ifdef ALPHATEST\n\n    if ( diffuseColor.a < ALPHATEST ) discard;\n    diffuseColor.a = 1.0;\n\n#endif\n";
