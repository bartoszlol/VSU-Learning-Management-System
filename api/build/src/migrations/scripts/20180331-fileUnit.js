"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// tslint:disable:no-console
const mongoose = require("mongoose");
const File_1 = require("../../models/mediaManager/File");
const Course_1 = require("../../models/Course");
const Directory_1 = require("../../models/mediaManager/Directory");
const fs = require("fs");
const unitSchema = new mongoose.Schema({
    _course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    progressable: {
        type: Boolean
    },
    weight: {
        type: Number
    }
}, {
    collection: 'units',
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = doc._id.toString();
            ret._course = ret._course.toString();
        }
    },
});
const Unit = mongoose.model('FileOldUnit', unitSchema);
const fileSchema = new mongoose.Schema({
    files: [
        {
            path: {
                type: String,
            },
            name: {
                type: String,
            },
            alias: {
                type: String,
            },
            size: {
                type: Number
            }
        }
    ],
    fileUnitType: {
        type: String,
        required: true
    }
}, {
    toObject: {
        transform: function (doc, ret) {
            ret._id = ret._id.toString();
            ret.files = ret.files.map((file) => {
                file._id = file._id.toString();
                return file;
            });
            ret._course = ret._course.toString();
        }
    },
});
const FileUnit = mongoose.model('Files', fileSchema);
class FileUnitMigration {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('FileUnit up was called');
            try {
                const courses = yield Course_1.Course.find().exec();
                const directories = {};
                const updatedCoursesMap = {};
                const updatedCourses = yield Promise.all(courses.map((course) => __awaiter(this, void 0, void 0, function* () {
                    const courseObj = course.toObject();
                    const returnObj = {};
                    if (!courseObj.hasOwnProperty('media')) {
                        const directoryObj = {
                            name: courseObj.name,
                            subDirectories: [],
                            files: []
                        };
                        const createdDirectory = yield Directory_1.Directory.create(directoryObj);
                        courseObj.media = createdDirectory._id;
                        const updatedCourse = yield Course_1.Course.findOneAndUpdate({ '_id': courseObj._id }, courseObj, { new: true }).exec();
                        directories[createdDirectory._id] = yield createdDirectory.toObject();
                        updatedCoursesMap[courseObj._id] = yield updatedCourse.toObject();
                        return updatedCourse;
                    }
                    else {
                        const directory = yield Directory_1.Directory.findById(courseObj.media).exec();
                        directories[directory._id] = yield directory.toObject();
                        updatedCoursesMap[courseObj._id] = courseObj;
                        return course;
                    }
                })));
                const fileUnits = yield Unit.find({ '__t': 'file' }).exec();
                const updatedFileUnits = yield Promise.all(fileUnits.map((fileUnit) => __awaiter(this, void 0, void 0, function* () {
                    if (fileUnit._id instanceof mongoose.Types.ObjectId) {
                        const fileUnitObj = fileUnit.toObject();
                        fileUnitObj.files = yield Promise.all(fileUnitObj.files.map((file) => __awaiter(this, void 0, void 0, function* () {
                            if (file instanceof mongoose.Types.ObjectId) {
                                return file;
                            }
                            const oldFile = file;
                            let absolutePath = '';
                            let fileStats = null;
                            try {
                                absolutePath = fs.realpathSync(oldFile.path);
                                fileStats = fs.statSync(oldFile.path);
                            }
                            catch (error) {
                                fileStats = null;
                                absolutePath = '';
                            }
                            if (absolutePath.length === 0) {
                                try {
                                    absolutePath = fs.realpathSync('api/' + oldFile.path);
                                    fileStats = fs.statSync('api/' + oldFile.path);
                                }
                                catch (error) {
                                    return null;
                                }
                            }
                            if (typeof oldFile.size === 'undefined') {
                                oldFile.size = fileStats.size;
                            }
                            const newFile = {
                                physicalPath: absolutePath,
                                name: oldFile.alias,
                                size: oldFile.size,
                                link: oldFile.name,
                                mimeType: 'plain/text'
                            };
                            const createdFile = yield File_1.File.create(newFile);
                            return createdFile._id;
                        })));
                        fileUnitObj.files = yield fileUnitObj.files.filter((element, index, array) => {
                            return (element !== null);
                        });
                        const directoryId = updatedCoursesMap[fileUnitObj._course].media.toString();
                        fileUnitObj._id = mongoose.Types.ObjectId(fileUnitObj._id);
                        fileUnitObj._course = mongoose.Types.ObjectId(fileUnitObj._course);
                        directories[directoryId].files = directories[directoryId].files.concat(fileUnitObj.files);
                        const unitAfterReplace = yield mongoose.connection.collection('units')
                            .findOneAndReplace({ '_id': fileUnit._id }, fileUnitObj);
                        return fileUnitObj;
                    }
                })));
                for (const directoryId of Object.keys(directories)) {
                    const directory = directories[directoryId];
                    const updatedDirectory = yield Directory_1.Directory.findOneAndUpdate({ '_id': directoryId }, directory, { new: true }).exec();
                }
            }
            catch (error) {
                console.log(error);
            }
            return true;
        });
    }
    down() {
        console.log('FileUnit down was called');
    }
}
module.exports = FileUnitMigration;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20180331-fileUnit.js.map
