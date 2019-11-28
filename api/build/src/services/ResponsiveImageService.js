"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp = require("sharp");
const main_1 = require("../config/main");
const fs = require("fs");
const path = require("path");
const BreakpointSize_1 = require("../models/BreakpointSize");
class ResponsiveImageService {
    /**
     * Takes an image and generates responsive images in the sizes we want to.
     *
     * The images will be saved in the same directory as the original file and we will
     * append the screen-size for which the responsive image is generated.
     *
     * The original file will be removed if we haven't specified an "original" breakpoint.
     *
     * @param originalFile
     * @param {IResponsiveImageData} responsiveImage
     * @returns {Promise<boolean>}
     */
    static generateResponsiveImages(originalFile, responsiveImage) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!responsiveImage.breakpoints) {
                // Cannot generate any responsive images, because there are no breakpoints provided.
                return false;
            }
            const filename = originalFile.filename;
            const directory = originalFile.destination;
            const extension = filename.split('.').pop();
            const filenameWithoutExtension = filename.substring(0, filename.length - extension.length - 1);
            let keepOriginalFile = false;
            for (const breakpoint of responsiveImage.breakpoints) {
                if (breakpoint.screenSize === BreakpointSize_1.BreakpointSize.ORIGINAL) {
                    keepOriginalFile = false;
                    continue;
                }
                const fileNameToSave = filenameWithoutExtension + '_' + breakpoint.screenSize + '.' + extension;
                sharp.cache(false);
                const retinaFileNameToSave = filenameWithoutExtension + '_' + breakpoint.screenSize + '@2x.' + extension;
                let resizeOptions = sharp(originalFile.path);
                let retinaResizeOptions = sharp(originalFile.path);
                if (breakpoint.imageSize.width && breakpoint.imageSize.height) {
                    resizeOptions =
                        resizeOptions.resize(breakpoint.imageSize.width, breakpoint.imageSize.height, { fit: 'cover', withoutEnlargement: true, position: sharp.gravity.center });
                    retinaResizeOptions =
                        retinaResizeOptions
                            .resize(breakpoint.imageSize.width * 2, breakpoint.imageSize.height * 2, { fit: 'cover', withoutEnlargement: true, position: sharp.gravity.center });
                }
                else if (!breakpoint.imageSize.width && breakpoint.imageSize.height) {
                    resizeOptions = resizeOptions.resize(null, breakpoint.imageSize.height, { fit: 'inside', withoutEnlargement: true });
                    retinaResizeOptions = retinaResizeOptions.resize(null, breakpoint.imageSize.height * 2, { fit: 'inside', withoutEnlargement: true });
                }
                else {
                    resizeOptions = resizeOptions.resize(breakpoint.imageSize.width, null, { fit: 'inside', withoutEnlargement: true });
                    retinaResizeOptions = retinaResizeOptions.resize(breakpoint.imageSize.width * 2, null, { fit: 'inside', withoutEnlargement: true });
                }
                yield resizeOptions
                    .toFile(path.join(directory, fileNameToSave));
                yield retinaResizeOptions
                    .toFile(path.join(directory, retinaFileNameToSave));
                const directoryRelative = path.relative(path.dirname(main_1.default.uploadFolder), directory).replace(/\\\\?/g, '/');
                breakpoint.pathToImage = path.join(directoryRelative, fileNameToSave);
                breakpoint.pathToRetinaImage = path.join(directoryRelative, retinaFileNameToSave);
            }
            if (!keepOriginalFile) {
                fs.unlinkSync(originalFile.path);
                responsiveImage.pathToImage = '-';
            }
        });
    }
}
exports.default = ResponsiveImageService;

//# sourceMappingURL=../../maps/src/services/ResponsiveImageService.js.map
