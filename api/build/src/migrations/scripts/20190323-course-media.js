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
const Course_1 = require("../../models/Course");
const Directory_1 = require("../../models/mediaManager/Directory");
const File_1 = require("../../models/mediaManager/File");
const ExtractMongoId_1 = require("../../utilities/ExtractMongoId");
function propagateMediaCourse(directory, course) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const fileId of directory.files) {
            const file = yield File_1.File.findById(fileId);
            file._course = course;
            yield file.save();
        }
        for (const subDirectoryId of directory.subDirectories) {
            const subDirectory = yield Directory_1.Directory.findById(subDirectoryId);
            yield propagateMediaCourse(subDirectory, course);
        }
        // Fix the own _course property at the end, so that the migration won't be disabled in case of an error during propagation.
        // (If this were set first, the top-level course directory would be fixed first, whereby the migration won't be
        // triggered on a subsequent run, yet the propagation could technically still fail for subdirectories / files.)
        directory._course = course;
        yield directory.save();
    });
}
class CourseMediaMigration {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('CourseMediaMigration: up was called');
            try {
                const courses = yield Course_1.Course.find();
                yield Promise.all(courses.map((course) => __awaiter(this, void 0, void 0, function* () {
                    const courseMsg = '"' + course.name + '" (' + ExtractMongoId_1.extractSingleMongoId(course._id) + ')';
                    const directory = yield Directory_1.Directory.findById(course.media);
                    if (directory && (ExtractMongoId_1.extractSingleMongoId(directory._course) !== ExtractMongoId_1.extractSingleMongoId(course._id))) {
                        console.log('CourseMediaMigration: Fixing media _course property for course ' + courseMsg + ' ...');
                        yield propagateMediaCourse(directory, course);
                        console.log('CourseMediaMigration: Successfully fixed media _course property for course ' + courseMsg + '!');
                    }
                    else {
                        console.log('CourseMediaMigration: Course ' + courseMsg + ' doesn\'t require fixing.');
                    }
                })));
            }
            catch (error) {
                console.log('CourseMediaMigration: ' + error);
            }
            return true;
        });
    }
}
module.exports = CourseMediaMigration;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20190323-course-media.js.map
