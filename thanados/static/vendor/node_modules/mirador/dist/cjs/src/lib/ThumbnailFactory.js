"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ThumbnailFactory = void 0;
exports["default"] = getBestThumbnail;

var _manifesto = require("manifesto.js");

var _MiradorManifest = _interopRequireDefault(require("./MiradorManifest"));

var _MiradorCanvas = _interopRequireDefault(require("./MiradorCanvas"));

var _asArray = _interopRequireDefault(require("./asArray"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/** */
function isLevel0ImageProfile(service) {
  var profile = service.getProfile(); // work around a bug in manifesto with normalized urls that strip # values.

  if (profile.endsWith('#level1') || profile.endsWith('#level2')) return false; // support IIIF v3-style profiles

  if (profile === 'level0') return true;
  return _manifesto.Utils.isLevel0ImageProfile(profile);
}
/** */


function isLevel2ImageProfile(service) {
  var profile = service.getProfile(); // work around a bug in manifesto with normalized urls that strip # values.

  if (profile.endsWith('#level0') || profile.endsWith('#level1')) return false; // support IIIF v3-style profiles

  if (profile === 'level2') return true;
  return _manifesto.Utils.isLevel2ImageProfile(profile);
}
/** */


function iiifv3ImageServiceType(service) {
  var type = service.getProperty('type') || [];
  return (0, _asArray["default"])(type).some(function (v) {
    return v.startsWith('ImageService');
  });
}
/** */


function iiifImageService(resource) {
  var service = resource && resource.getServices().find(function (s) {
    return iiifv3ImageServiceType(s) || _manifesto.Utils.isImageProfile(s.getProfile());
  });
  if (!service) return undefined;
  return service;
}
/** */


var ThumbnailFactory = /*#__PURE__*/function () {
  /** */
  function ThumbnailFactory(resource) {
    var iiifOpts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, ThumbnailFactory);

    this.resource = resource;
    this.iiifOpts = iiifOpts;
  }
  /** */


  _createClass(ThumbnailFactory, [{
    key: "iiifThumbnailUrl",
    value:
    /**
     * Determines the appropriate thumbnail to use to represent an Image Resource.
     * @param {Object} resource The Image Resource from which to derive a thumbnail
     * @return {Object} The thumbnail URL and any spatial dimensions that can be determined
     */
    function iiifThumbnailUrl(resource) {
      var size;
      var width;
      var height;
      var minDimension = 120;
      var maxHeight = minDimension;
      var maxWidth = minDimension;
      var _this$iiifOpts = this.iiifOpts,
          requestedMaxHeight = _this$iiifOpts.maxHeight,
          requestedMaxWidth = _this$iiifOpts.maxWidth;
      if (requestedMaxHeight) maxHeight = Math.max(requestedMaxHeight, minDimension);
      if (requestedMaxWidth) maxWidth = Math.max(requestedMaxWidth, minDimension);
      var service = iiifImageService(resource);
      if (!service) return ThumbnailFactory.staticImageUrl(resource);
      var aspectRatio = resource.getWidth() && resource.getHeight() && resource.getWidth() / resource.getHeight();
      var target = requestedMaxWidth && requestedMaxHeight ? requestedMaxWidth * requestedMaxHeight : maxHeight * maxWidth;
      var closestSize = ThumbnailFactory.selectBestImageSize(service, target);

      if (closestSize) {
        // Embedded service advertises an appropriate size
        width = closestSize.width;
        height = closestSize.height;
        size = "".concat(width, ",").concat(height);
      } else if (isLevel0ImageProfile(service)) {
        /** Bail if the best available size is the full size.. maybe we'll get lucky with the @id */
        if (!service.getProperty('height') && !service.getProperty('width')) {
          return ThumbnailFactory.staticImageUrl(resource);
        }
      } else if (requestedMaxHeight && requestedMaxWidth) {
        // IIIF level 2, no problem.
        if (isLevel2ImageProfile(service)) {
          size = "!".concat(maxWidth, ",").concat(maxHeight);
          width = maxWidth;
          height = maxHeight;
          if (aspectRatio && aspectRatio > 1) height = Math.round(maxWidth / aspectRatio);
          if (aspectRatio && aspectRatio < 1) width = Math.round(maxHeight * aspectRatio);
        } else if (maxWidth / maxHeight < aspectRatio) {
          size = "".concat(maxWidth, ",");
          width = maxWidth;
          if (aspectRatio) height = Math.round(maxWidth / aspectRatio);
        } else {
          size = ",".concat(maxHeight);
          height = maxHeight;
          if (aspectRatio) width = Math.round(maxHeight * aspectRatio);
        }
      } else if (requestedMaxHeight && !requestedMaxWidth) {
        size = ",".concat(maxHeight);
        height = maxHeight;
        if (aspectRatio) width = Math.round(maxHeight * aspectRatio);
      } else if (!requestedMaxHeight && requestedMaxWidth) {
        size = "".concat(maxWidth, ",");
        width = maxWidth;
        if (aspectRatio) height = Math.round(maxWidth / aspectRatio);
      } else {
        size = ",".concat(minDimension);
        height = minDimension;
        if (aspectRatio) width = Math.round(height * aspectRatio);
      }

      var region = 'full';

      var quality = _manifesto.Utils.getImageQuality(service.getProfile());

      var id = service.id.replace(/\/+$/, '');
      var format = this.getFormat(service);
      return {
        height: height,
        url: [id, region, size, 0, "".concat(quality, ".").concat(format)].join('/'),
        width: width
      };
    }
    /**
     * Figure out what format thumbnail to use by looking at the preferred formats
     * on offer, and selecting a format shared in common with the application's
     * preferred format list.
     *
     * Fall back to jpg, which is required to work for all IIIF services.
     */

  }, {
    key: "getFormat",
    value: function getFormat(service) {
      var _this$iiifOpts$prefer = this.iiifOpts.preferredFormats,
          preferredFormats = _this$iiifOpts$prefer === void 0 ? [] : _this$iiifOpts$prefer;
      var servicePreferredFormats = service.getProperty('preferredFormats');
      if (!servicePreferredFormats) return 'jpg';
      var filteredFormats = servicePreferredFormats.filter(function (value) {
        return preferredFormats.includes(value);
      }); // this is a format found in common between the preferred formats of the service
      // and the application

      if (filteredFormats[0]) return filteredFormats[0]; // IIIF Image API guarantees jpg support; if it wasn't provided by the service
      // but the application is fine with it, we might as well try it.

      if (!servicePreferredFormats.includes('jpg') && preferredFormats.includes('jpg')) {
        return 'jpg';
      } // there were no formats in common, and the application didn't want jpg... so
      // just trust that the IIIF service is advertising something useful?


      if (servicePreferredFormats[0]) return servicePreferredFormats[0]; // JPG support is guaranteed by the spec, so it's a good worst-case fallback

      return 'jpg';
    }
    /**
     * Determines the content resource from which to derive a thumbnail to represent a given resource.
     * This method is recursive.
     * @param {Object} resource A IIIF resource to derive a thumbnail from
     * @return {Object|undefined} The Image Resource to derive a thumbnail from, or undefined
     * if no appropriate resource exists
     */

  }, {
    key: "getSourceContentResource",
    value: function getSourceContentResource(resource) {
      var thumbnail = resource.getThumbnail(); // Any resource type may have a thumbnail

      if (thumbnail) {
        if (typeof thumbnail.__jsonld === 'string') return thumbnail.__jsonld; // Prefer an image's ImageService over its image's thumbnail
        // Note that Collection, Manifest, and Canvas don't have `getType()`

        if (!resource.isCollection() && !resource.isManifest() && !resource.isCanvas()) {
          if (resource.getType() === 'image' && iiifImageService(resource) && !iiifImageService(thumbnail)) {
            return resource;
          }
        }

        return thumbnail;
      }

      if (resource.isCollection()) {
        var firstManifest = resource.getManifests()[0];
        if (firstManifest) return this.getSourceContentResource(firstManifest);
        return undefined;
      }

      if (resource.isManifest()) {
        var miradorManifest = new _MiradorManifest["default"](resource);
        var canvas = miradorManifest.startCanvas || miradorManifest.canvasAt(0);
        if (canvas) return this.getSourceContentResource(canvas);
        return undefined;
      }

      if (resource.isCanvas()) {
        var image = ThumbnailFactory.getPreferredImage(resource);
        if (image) return this.getSourceContentResource(image);
        return undefined;
      }

      if (resource.getType() === 'image') {
        return resource;
      }

      return undefined;
    }
    /**
     * Gets a thumbnail representing the resource.
     * @return {Object|undefined} A thumbnail representing the resource, or undefined if none could
     * be determined
     */

  }, {
    key: "get",
    value: function get() {
      if (!this.resource) return undefined; // Determine which content resource we should use to derive a thumbnail

      var sourceContentResource = this.getSourceContentResource(this.resource);
      if (!sourceContentResource) return undefined; // Special treatment for external resources

      if (typeof sourceContentResource === 'string') return {
        url: sourceContentResource
      };
      return this.iiifThumbnailUrl(sourceContentResource);
    }
  }], [{
    key: "staticImageUrl",
    value: function staticImageUrl(resource) {
      return {
        height: resource.getProperty('height'),
        url: resource.id,
        width: resource.getProperty('width')
      };
    }
    /**
     * Selects the image resource that is representative of the given canvas.
     * @param {Object} canvas A Manifesto Canvas
     * @return {Object} A Manifesto Image Resource
     */

  }, {
    key: "getPreferredImage",
    value: function getPreferredImage(canvas) {
      var miradorCanvas = new _MiradorCanvas["default"](canvas);
      return miradorCanvas.iiifImageResources[0] || miradorCanvas.imageResource;
    }
    /**
     * Chooses the best available image size based on a target area (w x h) value.
     * @param {Object} service A IIIF Image API service that has a `sizes` array
     * @param {Number} targetArea The target area value to compare potential sizes against
     * @return {Object|undefined} The best size, or undefined if none are acceptable
     */

  }, {
    key: "selectBestImageSize",
    value: function selectBestImageSize(service, targetArea) {
      var sizes = (0, _asArray["default"])(service.getProperty('sizes'));
      var closestSize = {
        "default": true,
        height: service.getProperty('height') || Number.MAX_SAFE_INTEGER,
        width: service.getProperty('width') || Number.MAX_SAFE_INTEGER
      };
      /** Compare the total image area to our target */

      var imageFitness = function imageFitness(test) {
        return test.width * test.height - targetArea;
      };
      /** Look for the size that's just bigger than we prefer... */


      closestSize = sizes.reduce(function (best, test) {
        var score = imageFitness(test);
        if (score < 0) return best;
        return Math.abs(score) < Math.abs(imageFitness(best)) ? test : best;
      }, closestSize);
      /** .... but not "too" big; we'd rather scale up an image than download too much */

      if (closestSize.width * closestSize.height > targetArea * 6) {
        closestSize = sizes.reduce(function (best, test) {
          return Math.abs(imageFitness(test)) < Math.abs(imageFitness(best)) ? test : best;
        }, closestSize);
      }

      if (closestSize["default"]) return undefined;
      return closestSize;
    }
  }]);

  return ThumbnailFactory;
}();
/** */


exports.ThumbnailFactory = ThumbnailFactory;

function getBestThumbnail(resource, iiifOpts) {
  return new ThumbnailFactory(resource, iiifOpts).get();
}