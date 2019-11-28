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
const File_1 = require("./File");
const mongoose = require("mongoose");
const ExtractMongoId_1 = require("../../utilities/ExtractMongoId");
const directorySchema = new mongoose.Schema({
    _course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    name: {
        type: String,
        required: true
    },
    subDirectories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Directory'
        }
    ],
    files: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File'
        }
    ]
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = ExtractMongoId_1.extractSingleMongoId(ret);
            if (doc.populated('subDirectories') === undefined) {
                ret.subDirectories = ret.subDirectories.map(ExtractMongoId_1.extractSingleMongoId);
            }
            if (doc.populated('files') === undefined) {
                ret.files = ret.files.map(ExtractMongoId_1.extractSingleMongoId);
            }
            delete ret._course;
        }
    },
});
directorySchema.pre('remove', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const localDir = this;
        try {
            for (const subdir of localDir.subDirectories) {
                // linting won't let us use 'Directory' before it is actually declared
                // tslint:disable-next-line:no-use-before-declare
                const model = yield Directory.findById(subdir);
                if (model) {
                    yield model.remove();
                }
            }
            for (const file of localDir.files) {
                const model = yield File_1.File.findById(file);
                if (model) {
                    yield model.remove();
                }
            }
        }
        catch (err) {
            throw new Error('Delete Error: ' + err.toString());
        }
    });
});
const Directory = mongoose.model('Directory', directorySchema);
exports.Directory = Directory;

//# sourceMappingURL=../../../maps/src/models/mediaManager/Directory.js.map
