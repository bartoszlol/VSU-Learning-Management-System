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
const routing_controllers_1 = require("routing-controllers");
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
const Progress_1 = require("../models/progress/Progress");
const mongoose = require("mongoose");
var ObjectId = mongoose.Types.ObjectId;
const Course_1 = require("../models/Course");
const Unit_1 = require("../models/units/Unit");
let ReportController = class ReportController {
    /**
     * @api {get} /api/report/overview/courses/:id Request course overview
     * @apiName GetCourseOverview
     * @apiGroup Report
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Course ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} course Course with progress stats.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a53c474a347af01b84e54b7",
     *         "name": "Test 101",
     *         "lectures": [{
     *             "_id": "5ab18d7defbc191b10dad856",
     *             "name": "Lecture One",
     *             "units": [{
     *                 "_id": "5ab2b80a6fab4a3ae0cd672d",
     *                 "updatedAt": "2018-03-21T19:56:13.326Z",
     *                 "createdAt": "2018-03-21T19:52:42.716Z",
     *                 "_course": "5a53c474a347af01b84e54b7",
     *                 "progressable": true,
     *                 "weight": 0,
     *                 "name": "Progressable unit",
     *                 "description": null,
     *                 "deadline": "2018-03-21T22:59:00.000Z",
     *                 "__v": 1,
     *                 "__t": "task",
     *                 "tasks": [...],
     *                 "progressData": [{
     *                     "name": "nothing",
     *                     "value": -1
     *                 }, {
     *                     "name": "tried",
     *                     "value": 1
     *                 }, {
     *                     "name": "done",
     *                     "value": 0
     *                 }]
     *             }]
     *         }],
     *         "students": [],
     *         "hasAccessKey": false
     *     }
     *
     * @apiError ForbiddenError You are no admin or teacher for this course.
     */
    getCourseOverview(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const coursePromise = this.createCoursePromise(id);
            const progressPromise = Progress_1.Progress.aggregate([
                { $match: { course: new ObjectId(id) } },
                { $group: { _id: '$unit', progresses: { $push: '$$ROOT' } } }
            ]).exec();
            const [course, unitProgressData] = yield Promise.all([coursePromise, progressPromise]);
            this.checkAccess(course, currentUser);
            const courseObjUnfiltered = course.toObject();
            const courseObj = this.countUnitsAndRemoveEmptyLectures(courseObjUnfiltered, currentUser).courseObj;
            courseObj.lectures.map((lecture) => {
                lecture.units.map((unit) => {
                    const progressStats = this.calculateProgress(unitProgressData, courseObj.students.length, unit);
                    unit.progressData = [
                        { name: 'nothing', value: progressStats.nothing },
                        { name: 'tried', value: progressStats.tried },
                        { name: 'done', value: progressStats.done }
                    ];
                });
            });
            return courseObj;
        });
    }
    /**
     * @api {get} /api/report/result/courses/:id Request course results
     * @apiName GetCourseResult
     * @apiGroup Report
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Course ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object[]} students Students with units and progress stats.
     *
     * @apiSuccessExample {json} Success-Response:
     *     [{
     *         "_id": "5954c62923de070007fad047",
     *         "updatedAt": "2017-06-29T09:19:54.227Z",
     *         "createdAt": "2017-06-29T09:19:37.436Z",
     *         "email": "geli.hda@gmail.com",
     *         "uid": "744961",
     *         "__v": 0,
     *         "isActive": true,
     *         "lastVisitedCourses": [],
     *         "role": "student",
     *         "profile": {
     *             "lastName": "Gerhard Paule",
     *             "firstName": "Von Schröder"
     *         },
     *         "id": "5954c62923de070007fad047",
     *         "progress": {
     *             "units": [],
     *             "stats": [{
     *                 "name": "Progress",
     *                 "series": [{
     *                     "name": "nothing",
     *                     "value": 4
     *                 }, {
     *                     "name": "tried",
     *                     "value": 0
     *                 }, {
     *                     "name": "done",
     *                     "value": 0
     *                 }]
     *             }]
     *         }
     *     }, {
     *         "_id": "59fc9fbc6405b400085564c6",
     *         "updatedAt": "2018-01-25T10:02:48.569Z",
     *         "createdAt": "2017-11-03T16:56:28.167Z",
     *         "email": "mueller.dav+test@gmail.com",
     *         "__v": 0,
     *         "isActive": true,
     *         "lastVisitedCourses": ["597df6d5b7a9c0000616637f", "5a5f3b70b5cbe70006f9befc", "5953e5b868f8c80007898785"],
     *         "role": "admin",
     *         "profile": {
     *             "firstName": "Test12",
     *             "lastName": "Schmidt",
     *             "theme": "default"
     *         },
     *         "id": "59fc9fbc6405b400085564c6",
     *         "progress": {
     *             "units": [],
     *             "stats": [{
     *                 "name": "Progress",
     *                 "series": [{
     *                     "name": "nothing",
     *                     "value": 4
     *                 }, {
     *                     "name": "tried",
     *                     "value": 0
     *                 }, {
     *                     "name": "done",
     *                     "value": 0
     *                 }]
     *             }]
     *         }
     *     }, {
     *         "_id": "597dfde2b7a9c0000616639d",
     *         "updatedAt": "2018-01-25T10:48:21.987Z",
     *         "createdAt": "2017-07-30T15:40:18.912Z",
     *         "email": "mueller.dav+gelistudent@gmail.com",
     *         "uid": "123456",
     *         "__v": 0,
     *         "isActive": true,
     *         "lastVisitedCourses": ["5a5f3b70b5cbe70006f9befc", "597df6d5b7a9c0000616637f", "5a134dcc104f7700067562c0"],
     *         "role": "student",
     *         "profile": {
     *             "firstName": "Davidstudent1",
     *             "lastName": "Müllerstudent2"
     *         },
     *         "id": "597dfde2b7a9c0000616639d",
     *         "progress": {
     *             "units": [],
     *             "stats": [{
     *                 "name": "Progress",
     *                 "series": [{
     *                     "name": "nothing",
     *                     "value": 4
     *                 }, {
     *                     "name": "tried",
     *                     "value": 0
     *                 }, {
     *                     "name": "done",
     *                     "value": 0
     *                 }]
     *             }]
     *         }
     *     }]
     *
     * @apiError ForbiddenError You are no admin or teacher for this course.
     */
    getCourseResults(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const coursePromise = this.createCoursePromise(id);
            const progressPromise = Progress_1.Progress.aggregate([
                { $match: { course: new ObjectId(id) } },
                { $lookup: { from: 'units', localField: 'unit', foreignField: '_id', as: 'unit' } },
                { $group: { _id: '$user', progresses: { $push: '$$ROOT' } } }
            ]).exec();
            const [course, userProgressDataRaw] = yield Promise.all([coursePromise, progressPromise]);
            this.checkAccess(course, currentUser);
            const courseObj = course.toObject();
            const students = courseObj.students;
            const progressableUnits = [];
            courseObj.lectures.forEach((lecture) => {
                lecture.units.forEach((unit) => {
                    if (unit.progressable) {
                        progressableUnits.push(unit);
                    }
                });
            });
            const userProgressData = yield userProgressDataRaw.map((userProgress) => {
                const remappedProgresses = userProgress.progresses.map((progress) => {
                    // Hydrate and toObject are neccessary to transform all ObjectIds to strings
                    let unit = Unit_1.Unit.hydrate(progress.unit.pop()).toObject();
                    unit = Object.assign({}, unit, { progressData: progress });
                    return unit;
                });
                return Object.assign({}, userProgress, { progresses: remappedProgresses });
            });
            const studentsWithUnitsAndProgress = yield students.map((student) => {
                const studentWithUnits = student;
                studentWithUnits.progress = {
                    units: []
                };
                const progressStats = {
                    nothing: 0,
                    tried: 0,
                    done: 0
                };
                const userProgressIndex = userProgressData.findIndex((userProgress) => {
                    return userProgress._id.toString() === student._id;
                });
                if (userProgressIndex > -1) {
                    const userProgressObjects = userProgressData[userProgressIndex];
                    studentWithUnits.progress.units = userProgressObjects.progresses;
                    userProgressData.splice(userProgressIndex, 1);
                    studentWithUnits.progress.units.forEach((studentUnit) => {
                        if (studentUnit.hasOwnProperty('progressData')) {
                            if (studentUnit.progressData.done) {
                                progressStats.done++;
                            }
                            else {
                                progressStats.tried++;
                            }
                        }
                    });
                }
                progressStats.nothing = progressableUnits.length - progressStats.done - progressStats.tried;
                studentWithUnits.progress.stats = [
                    {
                        name: 'Progress',
                        series: [
                            { name: 'nothing', value: progressStats.nothing },
                            { name: 'tried', value: progressStats.tried },
                            { name: 'done', value: progressStats.done }
                        ]
                    },
                ];
                return studentWithUnits;
            });
            return studentsWithUnitsAndProgress;
        });
    }
    createCoursePromise(courseId) {
        return Course_1.Course.findOne({ _id: courseId })
            .select({
            name: 1,
            lectures: 1,
            students: 1
        })
            .populate({
            path: 'lectures',
            populate: {
                path: 'units'
            },
            select: {
                name: 1,
                units: 1
            }
        })
            .populate('students')
            .populate('teachers')
            .populate('courseAdmin')
            .exec();
    }
    /**
     * @api {get} /api/report/details/courses/:courseId/units/:unitId Request unit progress
     * @apiName GetUnitDetails
     * @apiGroup Report
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} courseId Course ID.
     * @apiParam {String} unitId Unit ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} report Unit and students with progress stats.
     *
     * @apiSuccessExample {json} Success-Response:
     *     "summary": {
     *         "_id": "5ab2b80a6fab4a3ae0cd672d",
     *         "updatedAt": "2018-03-21T19:56:13.326Z",
     *         "createdAt": "2018-03-21T19:52:42.716Z",
     *         "_course": "5a53c474a347af01b84e54b7",
     *         "progressable": true,
     *         "weight": 0,
     *         "name": "Progressable unit",
     *         "description": null,
     *         "deadline": "2018-03-21T22:59:00.000Z",
     *         "__v": 1,
     *         "__t": "task",
     *         "tasks": [...],
     *         "progressData": [{
     *             "name": "What's the answer to life and everything?",
     *             "series": [{
     *                 "name": "correct",
     *                 "value": 1
     *             }, {
     *                 "name": "wrong",
     *                 "value": 0
     *             }, {
     *                 "name": "no data",
     *                 "value": 5
     *             }]
     *         }, {
     *             "name": "How are you?",
     *             "series": [{
     *                 "name": "correct",
     *                 "value": 0
     *             }, {
     *                 "name": "wrong",
     *                 "value": 1
     *             }, {
     *                 "name": "no data",
     *                 "value": 5
     *             }]
     *         }, {
     *             "name": "Best questions ever, huh?",
     *             "series": [{
     *                 "name": "correct",
     *                 "value": 1
     *             }, {
     *                 "name": "wrong",
     *                 "value": 0
     *             }, {
     *                 "name": "no data",
     *                 "value": 5
     *             }]
     *         }]
     *     },
     *     "details": [{
     *         "_id": "5954bc9e23de070007fad033",
     *         "updatedAt": "2018-01-25T10:54:35.326Z",
     *         "createdAt": "2017-06-29T08:38:54.864Z",
     *         "email": "max@mustermann.me",
     *         "uid": "12345",
     *         "__v": 0,
     *         "isActive": true,
     *         "lastVisitedCourses": ["597df6d5b7a9c0000616637f", "5a5f3b70b5cbe70006f9befc", "59faf40c772e1300067d2ae6"],
     *         "role": "admin",
     *         "profile": {
     *             "theme": "default",
     *             "lastName": "Mustermann",
     *             "firstName": "Max"
     *         },
     *         "id": "5954bc9e23de070007fad033",
     *         "progress": {
     *             "_id": "5a69b7680146c60006249626",
     *             "done": false,
     *             "updatedAt": "2018-01-25T10:54:32.698Z",
     *             "createdAt": "2018-01-25T10:54:32.698Z",
     *             "unit": "5a460967302ddd0006331075",
     *             "course": "597df6d5b7a9c0000616637f",
     *             "answers": {
     *                 "5a460967302ddd000633106e": {
     *                     "5a460967302ddd0006331070": false,
     *                     "5a460967302ddd000633106f": true
     *                 },
     *                 "5a460967302ddd0006331071": {
     *                     "5a460967302ddd0006331074": false,
     *                     "5a460967302ddd0006331073": false,
     *                     "5a460967302ddd0006331072": true
     *                 }
     *             },
     *             "type": "task-unit-progress",
     *             "user": "5954bc9e23de070007fad033",
     *             "__v": 0,
     *             "__t": "task-unit-progress"
     *         }
     *     }, {
     *         "_id": "5954c62923de070007fad047",
     *         "updatedAt": "2017-06-29T09:19:54.227Z",
     *         "createdAt": "2017-06-29T09:19:37.436Z",
     *         "email": "geli.hda@gmail.com",
     *         "uid": "744961",
     *         "__v": 0,
     *         "isActive": true,
     *         "lastVisitedCourses": [],
     *         "role": "student",
     *         "profile": {
     *             "lastName": "Gerhard Paule",
     *             "firstName": "Von Schröder"
     *         },
     *         "id": "5954c62923de070007fad047"
     *     }]
     *
     * @apiError ForbiddenError You are no admin or teacher for this course.
     */
    getUnitProgress(courseId, unitId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const coursePromise = Course_1.Course.findOne({ _id: courseId })
                .select({ students: 1 })
                .populate('students')
                .exec();
            const unitPromise = Unit_1.Unit.findOne({ _id: unitId }).exec();
            const progressPromise = Progress_1.Progress.find({ 'unit': unitId }).exec();
            const [course, unit, progresses] = yield Promise.all([coursePromise, unitPromise, progressPromise]);
            this.checkAccess(course, currentUser);
            const courseObj = course.toObject();
            const students = courseObj.students;
            const progressObjects = progresses.map((progress) => progress.toObject());
            const unitObjWithProgressStats = yield unit.calculateProgress(students, progressObjects);
            const studentsWithProgress = students.map((student) => {
                const studentWithProgress = student;
                const progressIndex = progressObjects.findIndex((progressObj) => {
                    return progressObj.user === student._id;
                });
                if (progressIndex > -1) {
                    const progressObjForStudent = progressObjects[progressIndex];
                    studentWithProgress.progress = progressObjForStudent;
                    progressObjects.splice(progressIndex, 1);
                }
                return studentWithProgress;
            });
            const report = {
                summary: unitObjWithProgressStats,
                details: studentsWithProgress
            };
            return report;
        });
    }
    /**
     * @api {get} /api/report/overview/users/:id Request user overview
     * @apiName GetUserOverview
     * @apiGroup Report
     *
     * @apiParam {String} id User ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object[]} courses List of courses with progress stats.
     *
     * @apiSuccessExample {json} Success-Response:
     *     [{
     *         "_id": "5a134dcc104f7700067562c0",
     *         "name": "katacourse",
     *         "lectures": [{...}],
     *         "hasAccessKey": false,
     *         "progressData": [{
     *             "name": "nothing",
     *             "value": 1
     *         }, {
     *             "name": "tried",
     *             "value": 0
     *         }, {
     *             "name": "done",
     *             "value": 0
     *         }]
     *     }, {
     *         "_id": "5a1dc725a61d110008f0f69d",
     *         "name": "Am I hidden?",
     *         "lectures": [{...}, {...}],
     *         "hasAccessKey": false,
     *         "progressData": [{
     *             "name": "nothing",
     *             "value": 1
     *         }, {
     *             "name": "tried",
     *             "value": 1
     *         }, {
     *             "name": "done",
     *             "value": 1
     *         }]
     *     }, {
     *         "_id": "5a5f3b70b5cbe70006f9befc",
     *         "name": "Video-Test",
     *         "lectures": [{...}],
     *         "hasAccessKey": false,
     *         "progressData": [{
     *             "name": "nothing",
     *             "value": 0
     *         }, {
     *             "name": "tried",
     *             "value": 1
     *         }, {
     *             "name": "done",
     *             "value": 0
     *         }]
     *     }]
     *
     * @apiError ForbiddenError
     */
    getUserProgress(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            if (id !== currentUser._id.toString()) {
                throw new routing_controllers_1.ForbiddenError();
            }
            const coursesPromise = Course_1.Course.find({ students: new ObjectId(id) })
                .select({
                name: 1
            })
                .populate({
                path: 'lectures',
                populate: {
                    path: 'units'
                },
                select: {
                    name: 1,
                    units: 1
                }
            })
                .exec();
            const courses = yield coursesPromise;
            const courseObjects = courses.map((course) => course.toObject());
            const aggregatedProgressPromise = courseObjects
                .map((courseObj) => { return this.countUnitsAndRemoveEmptyLectures(courseObj, currentUser); })
                .map(({ courseObj, progressableUnitCount, invisibleUnits }) => __awaiter(this, void 0, void 0, function* () {
                const userProgressData = yield Progress_1.Progress.aggregate([
                    { $match: { user: new ObjectId(id), unit: { $nin: invisibleUnits } } },
                    { $group: { _id: '$course', progresses: { $push: '$$ROOT' } } }
                ]).exec();
                const progressStats = yield this.calculateProgress(userProgressData, progressableUnitCount, courseObj);
                courseObj.progressData = [
                    { name: 'not tried', value: progressStats.nothing },
                    { name: 'tried', value: progressStats.tried },
                    { name: 'solved', value: progressStats.done }
                ];
                return yield courseObj;
            }));
            const courseObjectsBeforeFilter = yield Promise.all(aggregatedProgressPromise);
            const courseObjectsWithProgress = yield courseObjectsBeforeFilter.filter((courseObj) => {
                return courseObj.lectures.length > 0;
            });
            return courseObjectsWithProgress;
        });
    }
    checkAccess(course, user) {
        let teacherIndex = -2;
        if (course.teachers) {
            teacherIndex = course.teachers.findIndex((teacher) => {
                return teacher.toString() === user._id;
            });
        }
        if (user.role !== 'admin' && course.courseAdmin._id.toString() !== user._id.toString() && teacherIndex < 0) {
            throw new routing_controllers_1.ForbiddenError('You are no admin or teacher for this course.');
        }
    }
    countUnitsAndRemoveEmptyLectures(courseObj, currentUser) {
        let progressableUnitCount = 0;
        const invisibleUnits = [];
        courseObj.lectures = courseObj.lectures.filter((lecture) => {
            lecture.units = lecture.units.filter((unit) => {
                if (unit.visible === false && currentUser.role === 'student') {
                    invisibleUnits.push(new ObjectId(unit._id));
                }
                if (currentUser.role === 'student') {
                    return unit.progressable && unit.visible;
                }
                else {
                    return unit.progressable;
                }
            });
            progressableUnitCount += lecture.units.length;
            return lecture.units.length > 0;
        });
        return { courseObj, progressableUnitCount, invisibleUnits };
    }
    calculateProgress(progressData, totalCount, doc) {
        const progressStats = {
            nothing: 0,
            tried: 0,
            done: 0
        };
        const progressIndex = progressData.findIndex((progress) => {
            return progress._id.toString() === doc._id.toString();
        });
        if (progressIndex > -1) {
            const unitProgressObj = progressData[progressIndex];
            unitProgressObj.progresses.forEach((progressObj) => {
                if (progressObj.done) {
                    progressStats.done++;
                }
                else {
                    progressStats.tried++;
                }
            });
            progressData.splice(progressIndex, 1);
        }
        progressStats.nothing = totalCount - progressStats.done - progressStats.tried;
        return progressStats;
    }
};
__decorate([
    routing_controllers_1.Get('/overview/courses/:id'),
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getCourseOverview", null);
__decorate([
    routing_controllers_1.Get('/result/courses/:id'),
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getCourseResults", null);
__decorate([
    routing_controllers_1.Get('/details/courses/:courseId/units/:unitId'),
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.Param('courseId')), __param(1, routing_controllers_1.Param('unitId')), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getUnitProgress", null);
__decorate([
    routing_controllers_1.Get('/overview/users/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getUserProgress", null);
ReportController = __decorate([
    routing_controllers_1.JsonController('/report'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], ReportController);
exports.ReportController = ReportController;

//# sourceMappingURL=../../maps/src/controllers/ReportController.js.map
