"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const routing_controllers_1 = require("routing-controllers");
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
const Unit_1 = require("../models/units/Unit");
const Lecture_1 = require("../models/Lecture");
const Course_1 = require("../models/Course");
const main_1 = require("../config/main");
const errorCodes_1 = require("../config/errorCodes");
const fs = require("fs");
const path = require("path");
const File_1 = require("../models/mediaManager/File");
const mongoose = require("mongoose");
const crypto = require("crypto");
const archiver = require("archiver");
const pdf = require('html-pdf');
const phantomjs = require('phantomjs-prebuilt');
const binPath = phantomjs.path;
// Set all routes which should use json to json, the standard is blob streaming data
let DownloadController = class DownloadController {
    constructor() {
        setInterval(this.cleanupCache, main_1.default.timeToLiveCacheValue * 60);
        this.markdownCss = this.readMarkdownCss();
    }
    cleanupCache() {
        const expire = Date.now() - 3600 * 1000;
        const files = fs.readdirSync(main_1.default.tmpFileCacheFolder);
        for (const fileName of files) {
            if (/download_(\w+).zip/.test(fileName) === false) {
                continue;
            }
            const filePath = path.join(main_1.default.tmpFileCacheFolder, fileName);
            const fileStat = fs.statSync(filePath);
            if (fileStat.ctimeMs >= expire) {
                continue;
            }
            fs.unlinkSync(filePath);
        }
    }
    replaceCharInFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9 -]/g, '') // remove special characters
            .replace(/ /g, '-') // replace space by dashes
            .replace(/-+/g, '-');
    }
    calcPackage(pack) {
        return __awaiter(this, void 0, void 0, function* () {
            let localTotalSize = 0;
            const localTooLargeFiles = [];
            for (const lec of pack.lectures) {
                for (const unit of lec.units) {
                    const localUnit = yield Unit_1.Unit
                        .findOne({ _id: unit.unitId })
                        .orFail(new routing_controllers_1.NotFoundError());
                    if (localUnit.__t === 'file') {
                        const fileUnit = localUnit;
                        fileUnit.files.forEach((file, index) => {
                            if (unit.files.indexOf(index) > -1) {
                                if ((file.size / 1024) > main_1.default.maxFileSize) {
                                    localTooLargeFiles.push(file.link);
                                }
                                localTotalSize += (file.size / 1024);
                            }
                        });
                    }
                }
            }
            return { totalSize: localTotalSize, tooLargeFiles: localTooLargeFiles };
        });
    }
    /**
     * @api {get} /api/download/:id Request archived file
     * @apiName GetDownload
     * @apiGroup Download
     *
     * @apiParam {String} id Course name.
     * @apiParam {Response} response Response (input).
     *
     * @apiSuccess {Response} response Response (output).
     *
     * @apiSuccessExample {json} Success-Response:
     *     UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==
     *
     * @apiError NotFoundError File could not be found.
     * @apiError ForbiddenError Invalid id i.e. filename (e.g. '../something').
     */
    getArchivedFile(id, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const tmpFileCacheFolder = path.resolve(main_1.default.tmpFileCacheFolder);
            const filePath = path.join(tmpFileCacheFolder, 'download_' + id + '.zip');
            // Assures that the filePath actually points to a file within the tmpFileCacheFolder.
            // This is because the id parameter could be something like '../forbiddenFile' ('../' via %2E%2E%2F in the URL).
            if (path.dirname(filePath) !== tmpFileCacheFolder) {
                throw new routing_controllers_1.ForbiddenError(errorCodes_1.errorCodes.file.forbiddenPath.code);
            }
            if (!fs.existsSync(filePath)) {
                throw new routing_controllers_1.NotFoundError();
            }
            response.setHeader('Connection', 'keep-alive');
            response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            yield util_1.promisify(response.download.bind(response))(filePath);
            return response;
        });
    }
    createFileHash() {
        return __awaiter(this, void 0, void 0, function* () {
            return crypto.randomBytes(16).toString('hex');
        });
    }
    /**
     * @api {post} /api/download/pdf/individual Post download request individual PDF
     * @apiName PostDownload
     * @apiGroup Download
     *
     * @apiParam {IDownload} data Course data.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {String} hash Hash value.
     *
     * @apiSuccessExample {json} Success-Response:
     *     "da39a3ee5e6b4b0d3255bfef95601890afd80709"
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError
     * @apiError BadRequestError
     */
    postDownloadRequestPDFIndividual(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.lectures.length) {
                throw new routing_controllers_1.BadRequestError();
            }
            const course = yield Course_1.Course
                .findOne({ _id: data.courseName })
                .orFail(new routing_controllers_1.NotFoundError());
            this.userCanExportCourse(course, user);
            const size = yield this.calcPackage(data);
            if (size.totalSize > main_1.default.maxZipSize || size.tooLargeFiles.length !== 0) {
                throw new routing_controllers_1.BadRequestError();
            }
            const hash = yield this.createFileHash();
            const filePath = path.join(path.resolve(main_1.default.tmpFileCacheFolder), 'download_' + hash + '.zip');
            const output = fs.createWriteStream(filePath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
            archive.on('error', (err) => {
                throw err;
            });
            archive.pipe(output);
            let lecCounter = 1;
            for (const lec of data.lectures) {
                const localLecture = yield Lecture_1.Lecture.findOne({ _id: lec.lectureId });
                const lcName = this.replaceCharInFilename(localLecture.name);
                let unitCounter = 1;
                for (const unit of lec.units) {
                    const localUnit = yield Unit_1.Unit
                        .findOne({ _id: unit.unitId })
                        .orFail(new routing_controllers_1.NotFoundError());
                    if (localUnit.__t === 'file') {
                        for (const fileId of unit.files) {
                            const file = yield File_1.File.findById(fileId);
                            archive.file('uploads/' + file.link, { name: lecCounter + '_' + lcName + '/' + unitCounter + '_' + file.name });
                        }
                    }
                    else {
                        const options = {
                            phantomPath: binPath,
                            format: 'A4',
                            border: {
                                left: '1cm',
                                right: '1cm'
                            },
                            footer: {
                                contents: {
                                    default: '<div id="pageFooter">{{page}}/{{pages}}</div>'
                                }
                            }
                        };
                        let html = '<!DOCTYPE html>\n' +
                            '<html>\n' +
                            '  <head>' +
                            '     <style>' +
                            '       #pageHeader {text-align: center;border-bottom: 1px solid;padding-bottom: 5px;}' +
                            '       #pageFooter {text-align: center;border-top: 1px solid;padding-top: 5px;}' +
                            '       html,body {font-family: \'Helvetica\', \'Arial\', sans-serif; font-size: 12px; line-height: 1.5;}' +
                            '       .codeBox {border: 1px solid grey; font-family: Monaco,Menlo,source-code-pro,monospace; padding: 10px}' +
                            '       #firstPage {page-break-after: always;}' +
                            '       .bottomBoxWrapper {height:800px; position: relative}' +
                            '       .bottomBox {position: absolute; bottom: 0;}' + this.markdownCss +
                            '     </style>' +
                            '  </head>';
                        html += yield localUnit.toHtmlForIndividualPDF();
                        html += '</html>';
                        const name = lecCounter + '_' + lcName + '/' + unitCounter + '_' + this.replaceCharInFilename(localUnit.name) + '.pdf';
                        const buffer = yield this.createPdf(html, options);
                        archive.append(buffer, { name });
                    }
                    unitCounter++;
                }
                lecCounter++;
            }
            return new Promise((resolve) => {
                output.on('close', () => resolve(hash));
                archive.finalize();
            });
        });
    }
    /**
     * @api {post} /api/download/pdf/single Post download request single PDF
     * @apiName PostDownload
     * @apiGroup Download
     *
     * @apiParam {IDownload} data Course data.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {String} hash Hash value.
     *
     * @apiSuccessExample {json} Success-Response:
     *     "da39a3ee5e6b4b0d3255bfef95601890afd80709"
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError
     * @apiError BadRequestError
     */
    postDownloadRequestPDFSingle(data, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.lectures.length) {
                throw new routing_controllers_1.BadRequestError();
            }
            const course = yield Course_1.Course
                .findOne({ _id: data.courseName })
                .orFail(new routing_controllers_1.NotFoundError());
            this.userCanExportCourse(course, user);
            const size = yield this.calcPackage(data);
            if (size.totalSize > main_1.default.maxZipSize || size.tooLargeFiles.length !== 0) {
                throw new routing_controllers_1.BadRequestError();
            }
            data.courseName += 'Single';
            const hash = yield this.createFileHash();
            const filePath = path.join(path.resolve(main_1.default.tmpFileCacheFolder), 'download_' + hash + '.zip');
            const output = fs.createWriteStream(filePath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
            archive.on('error', (err) => {
                throw err;
            });
            archive.pipe(output);
            const options = {
                phantomPath: binPath,
                format: 'A4',
                border: {
                    left: '1cm',
                    right: '1cm',
                    top: '0',
                    bottom: '0'
                },
                footer: {
                    contents: {
                        default: '<div id="pageFooter">{{page}}/{{pages}}</div>'
                    }
                },
                header: {
                    contents: '<div id="pageHeader">' + course.name + '</div>',
                    height: '20mm'
                }
            };
            let html = '<!DOCTYPE html>\n' +
                '<html>\n' +
                '  <head>' +
                '     <style>' +
                '       #pageHeader {text-align: center;border-bottom: 1px solid;padding-bottom: 5px;}' +
                '       #pageFooter {text-align: center;border-top: 1px solid;padding-top: 5px;}' +
                '       html, body {font-family: \'Helvetica\', \'Arial\', sans-serif; font-size: 12px; line-height: 1.5;}' +
                '       .codeBox {border: 1px solid grey; font-family: Monaco,Menlo,source-code-pro,monospace; padding: 10px}' +
                '       #firstPage {page-break-after: always;}' +
                '       #nextPage {page-break-before: always;}' +
                '       .bottomBoxWrapper {height:800px; position: relative}' +
                '       .bottomBox {position: absolute; bottom: 0;}' + this.markdownCss +
                '     </style>' +
                '  </head>' +
                '  <body>' +
                '  ';
            let solutions = '<div id="nextPage"><h2><u>Solutions</u></h2>';
            let lecCounter = 1;
            let firstSol = false;
            for (const lec of data.lectures) {
                const localLecture = yield Lecture_1.Lecture.findOne({ _id: lec.lectureId });
                const lcName = this.replaceCharInFilename(localLecture.name);
                let unitCounter = 1;
                let solCounter = 1;
                if (lecCounter > 1) {
                    html += '<div id="nextPage" ><h2>Lecture: ' + localLecture.name + '</h2>';
                }
                else {
                    html += '<div><h2>Lecture: ' + localLecture.name + '</h2>';
                }
                for (const unit of lec.units) {
                    const localUnit = yield Unit_1.Unit
                        .findOne({ _id: unit.unitId })
                        .orFail(new routing_controllers_1.NotFoundError());
                    if (localUnit.__t === 'file') {
                        for (const fileId of unit.files) {
                            const file = yield File_1.File.findById(fileId);
                            archive.file(path.join(main_1.default.uploadFolder, file.link), { name: lecCounter + '_' + lcName + '/' + unitCounter + '_' + file.name });
                        }
                    }
                    else if ((localUnit.__t === 'code-kata' || localUnit.__t === 'task') && lecCounter > 1 && unitCounter > 1) {
                        html += '<div id="nextPage" >' + (yield localUnit.toHtmlForSinglePDF()) + '</div>';
                    }
                    else {
                        html += yield localUnit.toHtmlForSinglePDF();
                    }
                    if (localUnit.__t === 'code-kata' || localUnit.__t === 'task') {
                        if (!firstSol && solCounter === 1) {
                            solutions += '<div><h2>Lecture: ' + localLecture.name + '</h2>';
                            firstSol = true;
                        }
                        else if (solCounter === 1) {
                            solutions += '<div id="nextPage" ><h2>Lecture: ' + localLecture.name + '</h2>';
                        }
                        else {
                            solutions += '<div id="nextPage" >';
                        }
                        solutions += (yield localUnit.toHtmlForSinglePDFSolutions()) + '</div>';
                        solCounter++;
                    }
                    else if (localUnit.__t !== 'file') {
                        solutions += yield localUnit.toHtmlForSinglePDFSolutions();
                    }
                    unitCounter++;
                }
                html += '</div>';
                lecCounter++;
            }
            html += solutions;
            html += '</div></body>' +
                '</html>';
            const name = this.replaceCharInFilename(course.name) + '.pdf';
            const buffer = yield this.createPdf(html, options);
            archive.append(buffer, { name });
            return new Promise((resolve) => {
                output.on('close', () => resolve(hash));
                archive.finalize();
            });
        });
    }
    readMarkdownCss() {
        try {
            return fs.readFileSync(path.resolve(__dirname, '../../styles/md/bundle.css'), 'utf8');
        }
        catch (e) {
            console.error(e);
            return null;
        }
    }
    createPdf(html, options) {
        return new Promise((resolve, reject) => {
            pdf.create(html, options).toBuffer((err, buffer) => {
                if (err) {
                    reject(err);
                }
                resolve(buffer);
            });
        });
    }
    /**
     * @param course
     * @param user
     */
    userCanExportCourse(course, user) {
        if (user.role === 'admin') {
            return true;
        }
        if (mongoose.Types.ObjectId(user._id).equals(course.courseAdmin._id)) {
            return true;
        }
        if (course.students.indexOf(user._id) !== -1) {
            return true;
        }
        if (course.teachers.indexOf(user._id) !== -1) {
            return true;
        }
        throw new routing_controllers_1.ForbiddenError();
    }
    /**
     * @api {delete} /api/download/ Request to clean up the cache.
     * @apiName DeleteCache
     * @apiGroup Download
     * @apiPermission admin
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *      {}
     */
    deleteCache() {
        this.cleanupCache();
        return {};
    }
};
__decorate([
    routing_controllers_1.Get('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DownloadController.prototype, "getArchivedFile", null);
__decorate([
    routing_controllers_1.Post('/pdf/individual'),
    routing_controllers_1.ContentType('application/json'),
    __param(0, routing_controllers_1.Body()), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DownloadController.prototype, "postDownloadRequestPDFIndividual", null);
__decorate([
    routing_controllers_1.Post('/pdf/single'),
    routing_controllers_1.ContentType('application/json'),
    __param(0, routing_controllers_1.Body()), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DownloadController.prototype, "postDownloadRequestPDFSingle", null);
__decorate([
    routing_controllers_1.Delete('/cache'),
    routing_controllers_1.Authorized(['admin']),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DownloadController.prototype, "deleteCache", null);
DownloadController = __decorate([
    routing_controllers_1.Controller('/download'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default),
    __metadata("design:paramtypes", [])
], DownloadController);
exports.DownloadController = DownloadController;

//# sourceMappingURL=../../maps/src/controllers/DownloadController.js.map
