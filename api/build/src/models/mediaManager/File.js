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
const mongoose = require("mongoose");
const fs = require("fs");
const Unit_1 = require("../units/Unit");
const Picture_1 = require("./Picture");
const { promisify } = require('util');
const fileSchema = new mongoose.Schema({
    _course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    name: {
        type: String,
        required: true
    },
    physicalPath: {
        type: String
    },
    link: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
    },
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            if (ret._id) {
                ret._id = ret._id.toString();
            }
            delete ret._course;
            delete ret.physicalPath;
            return ret;
        }
    },
});
fileSchema.pre('remove', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const localFile = this;
        try {
            if (fs.existsSync(localFile.physicalPath)) {
                yield promisify(fs.unlink)(localFile.physicalPath);
            }
            if (this.__t === 'Picture') {
                const localPicture = this;
                if (localPicture.breakpoints) {
                    for (const breakpoint of localPicture.breakpoints) {
                        if (breakpoint.pathToImage && breakpoint.pathToImage !== '-'
                            && fs.existsSync(breakpoint.pathToImage)) {
                            yield promisify(fs.unlink)(breakpoint.pathToImage);
                        }
                        if (breakpoint.pathToRetinaImage && breakpoint.pathToRetinaImage !== '-'
                            && fs.existsSync(breakpoint.pathToRetinaImage)) {
                            yield promisify(fs.unlink)(breakpoint.pathToRetinaImage);
                        }
                    }
                }
            }
            const units2Check = yield Unit_1.FileUnit.find({ files: { $in: [localFile._id] } });
            Promise.all(units2Check.map((unit) => __awaiter(this, void 0, void 0, function* () {
                const index = unit.files.indexOf(localFile._id);
                if (index > -1) {
                    unit.files.splice(index, 1);
                    yield unit.save();
                }
            })));
        }
        catch (err) {
            throw new Error('Delete Error: ' + err.toString());
        }
    });
});
const File = mongoose.model('File', fileSchema);
exports.File = File;
const Picture = File.discriminator('Picture', Picture_1.pictureSchema);
exports.Picture = Picture;

//# sourceMappingURL=../../../maps/src/models/mediaManager/File.js.map
