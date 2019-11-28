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
const errorCodes_1 = require("../config/errorCodes");
const main_1 = require("../config/main");
const Course_1 = require("../models/Course");
const WhitelistUser_1 = require("../models/WhitelistUser");
const EmailService_1 = require("../services/EmailService");
const multer = require('multer');
const NotificationSettings_1 = require("../models/NotificationSettings");
const fs = require("fs");
const path = require("path");
const ResponsiveImageService_1 = require("../services/ResponsiveImageService");
const File_1 = require("../models/mediaManager/File");
const coursePictureUploadOptions = {
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(main_1.default.uploadFolder, 'courses'));
        },
        filename: (req, file, cb) => {
            const id = req.params.id;
            const extPos = file.originalname.lastIndexOf('.');
            const ext = (extPos !== -1) ? `.${file.originalname.substr(extPos + 1).toLowerCase()}` : '';
            cb(null, id + '_' + new Date().getTime().toString() + ext);
        }
    }),
};
let CourseController = class CourseController {
    /**
     * @api {get} /api/courses/ Request courses of current user
     * @apiName GetCourses
     * @apiGroup Course
     *
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {ICourseDashboard[]} courses List of ICourseDashboard objects.
     *
     * @apiSuccessExample {json} Success-Response:
     *     [
     *         {
     *             "_id": "5ad0f9b56ff514268c5adc8c",
     *             "name": "Inactive Test",
     *             "active": false,
     *             "description": "An inactive course.",
     *             "enrollType": "free",
     *             "userCanEditCourse": true,
     *             "userCanViewCourse": true,
     *             "userIsCourseAdmin": true,
     *             "userIsCourseTeacher": false,
     *             "userIsCourseMember": true
     *         },
     *         {
     *             "_id": "5ad0f9b56ff514268c5adc8d",
     *             "name": "Access key test",
     *             "active": true,
     *             "description": "This course is used to test the access key course enroll type.",
     *             "enrollType": "accesskey",
     *             "userCanEditCourse": true,
     *             "userCanViewCourse": true,
     *             "userIsCourseAdmin": false,
     *             "userIsCourseTeacher": true,
     *             "userIsCourseMember": true
     *         },
     *         {
     *             "_id": "5ad0f9b56ff514268c5adc8e",
     *             "name": "Advanced web development",
     *             "active": true,
     *             "description": "Learn all the things! Angular, Node, Express, MongoDB, TypeScript ...",
     *             "enrollType": "free",
     *             "userCanEditCourse": false,
     *             "userCanViewCourse": false,
     *             "userIsCourseAdmin": false,
     *             "userIsCourseTeacher": false,
     *             "userIsCourseMember": false
     *         }
     *     ]
     */
    getCourses(currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const whitelistUsers = yield WhitelistUser_1.WhitelistUser.find({ uid: currentUser.uid });
            const conditions = this.userReadConditions(currentUser);
            if (conditions.$or) {
                // Everyone is allowed to see free courses in overview
                conditions.$or.push({ enrollType: 'free' });
                conditions.$or.push({ enrollType: 'accesskey' });
                conditions.$or.push({ enrollType: 'whitelist', whitelist: { $elemMatch: { $in: whitelistUsers } } });
            }
            const courses = yield Course_1.Course.find(conditions);
            return yield Promise.all(courses.map((course) => __awaiter(this, void 0, void 0, function* () {
                return course.forDashboard(currentUser);
            })));
        });
    }
    /**
     * @api {get} /api/courses/:id Request view information for a specific course
     * @apiName GetCourseView
     * @apiGroup Course
     *
     * @apiParam {String} id Course ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {ICourseView} course ICourseView object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5ad0f9b56ff514268c5adc8d",
     *         "name": "Access key test",
     *         "description": "This course is used to test the access key course enroll type.",
     *         "lectures": [
     *             {
     *                 "units": [
     *                     {
     *                         "__t": "free-text",
     *                         "_id": "5ad0f9b56ff514268c5adc99",
     *                         "updatedAt": "2018-04-13T18:40:53.305Z",
     *                         "createdAt": "2018-04-13T18:40:53.305Z",
     *                         "name": "What is the purpose of this course fixture?",
     *                         "description": "",
     *                         "markdown": "To test the 'accesskey' enrollType.",
     *                         "_course": "5ad0f9b56ff514268c5adc8d",
     *                         "__v": 0
     *                     }
     *                 ],
     *                 "_id": "5ad0f9b56ff514268c5adc92",
     *                 "updatedAt": "2018-04-13T18:40:53.316Z",
     *                 "createdAt": "2018-04-13T18:40:53.284Z",
     *                 "name": "Documentation",
     *                 "description": "Documents the course fixture.",
     *                 "__v": 1
     *             }
     *         ]
     *     }
     *
     * @apiError NotFoundError Includes implicit authorization check. (In getCourse helper method.)
     * @apiError ForbiddenError (Redundant) Authorization check.
     */
    getCourseView(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield this.getCourse(id, currentUser);
            // This is currently a redundant check, because userReadConditions in getCourse above already restricts access!
            // (I.e. just in case future changes break something.)
            if (!course.checkPrivileges(currentUser).userCanViewCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            yield course.populateLecturesFor(currentUser)
                .populate('courseAdmin')
                .populate('teachers')
                .execPopulate();
            yield course.processLecturesFor(currentUser);
            return course.forView(currentUser);
        });
    }
    /**
     * @api {get} /api/courses/:id/edit Request edit information for a specific course
     * @apiName GetCourseEdit
     * @apiGroup Course
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Course ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {ICourse} course ICourse object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "teachers": [
     *             {
     *                 "profile": {
     *                     "lastName": "Teachman",
     *                     "firstName": "Daniel"
     *                 },
     *                 "role": "teacher",
     *                 "lastVisitedCourses": [
     *                     "5ad0f9b56ff514268c5adc8d",
     *                     "5ad0f9b56ff514268c5adc8b",
     *                     "5ad0f9b56ff514268c5adc8c",
     *                     "5ad2c3ba94e45c0c8493da06",
     *                     "5ad7a43f943190432c5af597",
     *                     "5ad0f9b56ff514268c5adc90"
     *                 ],
     *                 "isActive": true,
     *                 "_id": "5ad0f9b56ff514268c5adc7e",
     *                 "updatedAt": "2018-04-21T23:52:03.424Z",
     *                 "createdAt": "2018-04-13T18:40:53.189Z",
     *                 "email": "teacher1@test.local",
     *                 "__v": 0,
     *                 "id": "5ad0f9b56ff514268c5adc7e"
     *             }
     *         ],
     *         "students": [
     *             {
     *                 "profile": {
     *                     "firstName": "Fabienne",
     *                     "lastName": "Wiedenroth"
     *                 },
     *                 "role": "student",
     *                 "lastVisitedCourses": [],
     *                 "isActive": true,
     *                 "_id": "5ad0f9b56ff514268c5adc64",
     *                 "updatedAt": "2018-04-13T18:40:53.108Z",
     *                 "createdAt": "2018-04-13T18:40:53.108Z",
     *                 "uid": "469952",
     *                 "email": "student5@test.local",
     *                 "__v": 0,
     *                 "id": "5ad0f9b56ff514268c5adc64"
     *             },
     *             {
     *                 "profile": {
     *                     "firstName": "Clemens",
     *                     "lastName": "TillmannsEdit",
     *                     "theme": "night"
     *                 },
     *                 "role": "student",
     *                 "lastVisitedCourses": [
     *                     "5ad0f9b56ff514268c5adc8b",
     *                     "5ad0f9b56ff514268c5adc8d",
     *                     "5ad0f9b56ff514268c5adc8e"
     *                 ],
     *                 "isActive": true,
     *                 "_id": "5ad0f9b56ff514268c5adc76",
     *                 "updatedAt": "2018-04-13T22:22:17.046Z",
     *                 "createdAt": "2018-04-13T18:40:53.163Z",
     *                 "uid": "970531",
     *                 "email": "edit@test.local",
     *                 "__v": 0,
     *                 "id": "5ad0f9b56ff514268c5adc76"
     *             }
     *         ],
     *         "lectures": [
     *             {
     *                 "units": [
     *                     {
     *                         "__t": "free-text",
     *                         "_id": "5ad0f9b56ff514268c5adc99",
     *                         "updatedAt": "2018-04-13T18:40:53.305Z",
     *                         "createdAt": "2018-04-13T18:40:53.305Z",
     *                         "name": "What is course fixture for?",
     *                         "description": "",
     *                         "markdown": "To test the 'accesskey' enrollType.",
     *                         "_course": "5ad0f9b56ff514268c5adc8d",
     *                         "__v": 0
     *                     }
     *                 ],
     *                 "_id": "5ad0f9b56ff514268c5adc92",
     *                 "updatedAt": "2018-04-13T18:40:53.316Z",
     *                 "createdAt": "2018-04-13T18:40:53.284Z",
     *                 "name": "Documentation",
     *                 "description": "Documents the course fixture.",
     *                 "__v": 1
     *             }
     *         ],
     *         "enrollType": "accesskey",
     *         "whitelist": [],
     *         "_id": "5ad0f9b56ff514268c5adc8d",
     *         "updatedAt": "2018-04-21T02:45:15.877Z",
     *         "createdAt": "2018-04-13T18:40:53.279Z",
     *         "name": "Access key test",
     *         "description": "This course is used to test the access key course enroll type.",
     *         "active": true,
     *         "accessKey": "accessKey1234",
     *         "courseAdmin": {
     *             "profile": {
     *                 "firstName": "Ober",
     *                 "lastName": "Lehrer"
     *             },
     *             "role": "teacher",
     *             "lastVisitedCourses": [],
     *             "isActive": true,
     *             "_id": "5ad0f9b56ff514268c5adc7f",
     *             "updatedAt": "2018-04-13T18:40:53.192Z",
     *             "createdAt": "2018-04-13T18:40:53.192Z",
     *             "email": "teacher2@test.local",
     *             "__v": 0,
     *             "id": "5ad0f9b56ff514268c5adc7f"
     *         },
     *         "__v": 6,
     *         "media": {
     *             "subDirectories": [],
     *             "files": [],
     *             "_id": "5ad2569171d8982ad0761451",
     *             "updatedAt": "2018-04-14T19:29:21.296Z",
     *             "createdAt": "2018-04-14T19:29:21.296Z",
     *             "name": "Access key test",
     *             "__v": 0
     *         },
     *         "hasAccessKey": true
     *     }
     *
     * @apiError NotFoundError Includes implicit authorization check. (In getCourse helper method.)
     * @apiError ForbiddenError (Redundant) Authorization check.
     */
    getCourseEdit(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield this.getCourse(id, currentUser);
            // This is currently a redundant check, because userReadConditions in getCourse and @Authorized already restrict access!
            // (I.e. just in case future changes break something.)
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            yield course.populateLecturesFor(currentUser)
                .populate('media')
                .populate('courseAdmin')
                .populate('teachers')
                .populate('students')
                .populate('whitelist')
                .populate('image')
                .execPopulate();
            yield course.processLecturesFor(currentUser);
            return course.toObject({ currentUser });
        });
    }
    userReadConditions(currentUser) {
        const conditions = {};
        if (currentUser.role === 'admin') {
            return conditions;
        }
        conditions.$or = [];
        if (currentUser.role === 'student') {
            conditions.active = true;
            conditions.$or.push({ students: currentUser._id });
        }
        else {
            conditions.$or.push({ teachers: currentUser._id });
            conditions.$or.push({ courseAdmin: currentUser._id });
        }
        return conditions;
    }
    getCourse(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findOne(Object.assign({}, this.userReadConditions(currentUser), { _id: id }));
            if (!course) {
                throw new routing_controllers_1.NotFoundError();
            }
            return course;
        });
    }
    /**
     * @api {post} /api/courses/ Add course
     * @apiName PostCourse
     * @apiGroup Course
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {ICourse} course New course data.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Course} course Added course.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6b60f72236d8e7c83d",
     *         "updatedAt": "2017-11-08T22:00:11.869Z",
     *         "createdAt": "2017-11-08T22:00:11.263Z",
     *         "name": "Introduction to web development",
     *         "description": "Whether you're just getting started with Web development or are just expanding your horizons...",
     *         "courseAdmin": {
     *             "_id": "5a037e6a60f72236d8e7c815",
     *             "updatedAt": "2017-11-08T22:00:10.898Z",
     *             "createdAt": "2017-11-08T22:00:10.898Z",
     *             "email": "teacher2@test.local",
     *             "isActive": true,
     *             "role": "teacher",
     *             "profile": {
     *                 "firstName": "Ober",
     *                 "lastName": "Lehrer"
     *             },
     *             "id": "5a037e6a60f72236d8e7c815"
     *         },
     *         "active": true,
     *         "__v": 1,
     *         "whitelist": [],
     *         "enrollType": "free",
     *         "lectures": [],
     *         "students": [],
     *         "teachers": [],
     *         "id": "5a037e6b60f72236d8e7c83d",
     *         "hasAccessKey": false
     *     }
     *
     * @apiError BadRequestError Course name already in use.
     */
    addCourse(course, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            // Note that this might technically have a race condition, but it should never matter because the new course ids remain unique.
            // If a strict version is deemed important, see mongoose Model.findOneAndUpdate for a potential approach.
            const existingCourse = yield Course_1.Course.findOne({ name: course.name });
            if (existingCourse) {
                throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.course.duplicateName.code);
            }
            course.courseAdmin = currentUser;
            const newCourse = new Course_1.Course(course);
            yield newCourse.save();
            return newCourse.toObject();
        });
    }
    /**
     * @api {post} /api/courses/mail Send mail to selected users
     * @apiName PostCourseMail
     * @apiGroup Course
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {Object} mailData Mail data.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} freeFormMail Information about sent email.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "accepted": ["geli.hda@gmail.com"],
     *         "rejected": [],
     *         "envelopeTime": 5,
     *         "messageTime": 4,
     *         "messageSize": 874,
     *         "response": "250 ok:  Message 11936348 accepted",
     *         "envelope": {
     *             "from": "staging.geli.fbi@h-da.de",
     *             "to": ["geli.hda@gmail.com"]
     *         },
     *         "messageId": "<f70858d7-d9f4-3f5b-a833-d94d2a440b33@h-da.de>"
     *     }
     */
    sendMailToSelectedUsers(mailData, currentUser) {
        return EmailService_1.default.sendFreeFormMail(Object.assign({}, mailData, { replyTo: `${currentUser.profile.firstName} ${currentUser.profile.lastName}<${currentUser.email}>` }));
    }
    /**
     * @api {post} /api/courses/:id/enroll Enroll current student in course
     * @apiName PostCourseEnroll
     * @apiGroup Course
     * @apiPermission student
     *
     * @apiParam {String} id Course ID.
     * @apiParam {Object} data Data (with access key).
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *      {}
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError Not allowed to join, you are not on whitelist.
     * @apiError ForbiddenError Incorrect or missing access key.
     */
    enrollStudent(id, data, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(id);
            if (!course) {
                throw new routing_controllers_1.NotFoundError();
            }
            if (course.enrollType === 'whitelist') {
                const wUsers = yield WhitelistUser_1.WhitelistUser.find().where({ courseId: course._id });
                if (wUsers.filter(e => e.uid === currentUser.uid).length < 1) {
                    throw new routing_controllers_1.ForbiddenError(errorCodes_1.errorCodes.course.notOnWhitelist.code);
                }
            }
            else if (course.accessKey && course.accessKey !== data.accessKey) {
                throw new routing_controllers_1.ForbiddenError(errorCodes_1.errorCodes.course.accessKey.code);
            }
            if (course.students.indexOf(currentUser._id) < 0) {
                course.students.push(currentUser);
                yield new NotificationSettings_1.NotificationSettings({
                    'user': currentUser,
                    'course': course,
                    'notificationType': NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES,
                    'emailNotification': false
                }).save();
                yield course.save();
            }
            return {};
        });
    }
    /**
     * @api {post} /api/courses/:id/leave Sign out current student from course
     * @apiName PostCourseLeave
     * @apiGroup Course
     * @apiPermission student
     *
     * @apiParam {String} id Course ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *      {}
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError
     */
    leaveStudent(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(id);
            if (!course) {
                throw new routing_controllers_1.NotFoundError();
            }
            const index = course.students.indexOf(currentUser._id);
            if (index >= 0) {
                course.students.splice(index, 1);
                yield NotificationSettings_1.NotificationSettings.findOne({ 'user': currentUser, 'course': course }).remove();
                yield course.save();
                return {};
            }
            else {
                // This equals an implicit !course.checkPrivileges(currentUser).userIsCourseStudent check.
                throw new routing_controllers_1.ForbiddenError();
            }
        });
    }
    /**
     * @api {post} /api/courses/:id/whitelist Whitelist students for course
     * @apiName PostCourseWhitelist
     * @apiGroup Course
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Course ID.
     * @apiParam {Object} file Uploaded file.
     *
     * @apiSuccess {Object} result Returns the new whitelist length.
     *
     * @apiSuccessExample {json} Success-Response:
     *    {
     *      newlength: 10
     *    }
     *
     * @apiError HttpError UID is not a number 1.
     * @apiError ForbiddenError Unauthorized user.
     */
    whitelistStudents(id, whitelist, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(id);
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            if (!whitelist || whitelist.length === 0) {
                throw new routing_controllers_1.BadRequestError();
            }
            if (course.whitelist.length > 0) {
                for (const wuser of course.whitelist) {
                    const whitelistUser = yield WhitelistUser_1.WhitelistUser.findById(wuser);
                    if (whitelistUser) {
                        yield whitelistUser.remove();
                    }
                }
            }
            course.whitelist = [];
            for (const whiteListUser of whitelist) {
                const wUser = new WhitelistUser_1.WhitelistUser();
                wUser.firstName = whiteListUser.firstName;
                wUser.lastName = whiteListUser.lastName;
                wUser.uid = whiteListUser.uid;
                wUser.courseId = course._id;
                yield wUser.save();
                course.whitelist.push(wUser._id);
            }
            yield course.save();
            return whitelist;
        });
    }
    /**
     * @api {put} /api/courses/:id Update course
     * @apiName PutCourse
     * @apiGroup Course
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Course ID.
     * @apiParam {ICourse} course New course data.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} result ID and name of the course.
     *
     * @apiSuccessExample {json} Success-Response:
     *    {
     *      _id: "5a037e6b60f72236d8e7c83d",
     *      name: "Introduction to web development"
     *    }
     *
     * @apiError NotFoundError Can't find the course. (Includes implicit authorization check.)
     */
    updateCourse(id, course, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const conditions = { _id: id };
            if (currentUser.role !== 'admin') {
                conditions.$or = [
                    { teachers: currentUser._id },
                    { courseAdmin: currentUser._id }
                ];
            }
            const updatedCourse = yield Course_1.Course.findOneAndUpdate(conditions, course, { 'new': true });
            if (updatedCourse) {
                return { _id: updatedCourse.id, name: updatedCourse.name };
            }
            else {
                throw new routing_controllers_1.NotFoundError();
            }
        });
    }
    /**
     * @api {delete} /api/courses/:id Delete course
     * @apiName DeleteCourse
     * @apiGroup Course
     *
     * @apiParam {String} id Course ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *      {}
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError
     */
    deleteCourse(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(id);
            if (!course) {
                throw new routing_controllers_1.NotFoundError();
            }
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            yield course.remove();
            return {};
        });
    }
    /**
     * @api {delete} /api/courses/picture/:id Delete course picture
     * @apiName DeleteCoursePicture
     * @apiGroup Course
     *
     * @apiParam {String} id Course ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *      {}
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError
     */
    deleteCoursePicture(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(id).orFail(new routing_controllers_1.NotFoundError());
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            if (!course.image) {
                throw new routing_controllers_1.NotFoundError();
            }
            const picture = yield File_1.Picture.findById(course.image);
            if (picture) {
                picture.remove();
            }
            yield Course_1.Course.updateOne({ _id: id }, { $unset: { image: 1 } });
            return {};
        });
    }
    /**
     * @api {post} /api/courses/picture/:id Add course picture
     * @apiName AddCoursePicture
     * @apiGroup Course
     *
     * @apiParam {String} id Course ID.
     * @apiParam responsiveImageDataRaw Image as data object.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {Object} Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *   {
     *     "breakpoints":[
     *       {
     *         "screenSize":0,
     *         "imageSize":{
     *           "width":284,
     *           "height":190
     *         },
     *         "pathToImage":"uploads/courses/5c0fa2770315e73d6c7babfe_1544542544919_0.jpg",
     *         "pathToRetinaImage":"uploads/courses/5c0fa2770315e73d6c7babfe_1544542544919_0@2x.jpg"
     *       }
     *     ],
     *     "_id":"5c0fd95871707a3a888ae70a",
     *     "__t":"Picture",
     *     "name":"5c0fa2770315e73d6c7babfe_1544542544919.jpg",
     *     "link":"-",
     *     "size":0,
     *     "mimeType":"image/jpeg",
     *     "createdAt":"2018-12-11T15:35:52.423Z",
     *     "updatedAt":"2018-12-11T15:35:52.423Z",
     *     "__v":0
     *   }
     *
     * @apiError NotFoundError
     * @apiError ForbiddenError
     */
    addCoursePicture(file, id, responsiveImageDataRaw, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            // Remove the old picture if the course already has one.
            const course = yield Course_1.Course.findById(id).orFail(new routing_controllers_1.NotFoundError());
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            const mimeFamily = file.mimetype.split('/', 1)[0];
            if (mimeFamily !== 'image') {
                // Remove the file if the type was not correct.
                yield fs.unlinkSync(file.path);
                throw new routing_controllers_1.BadRequestError('Forbidden format of uploaded picture: ' + mimeFamily);
            }
            const picture = yield File_1.Picture.findById(course.image);
            if (picture) {
                picture.remove();
            }
            const responsiveImageData = JSON.parse(responsiveImageDataRaw.imageData);
            yield ResponsiveImageService_1.default.generateResponsiveImages(file, responsiveImageData);
            const image = new File_1.Picture({
                name: file.filename,
                physicalPath: responsiveImageData.pathToImage,
                link: responsiveImageData.pathToImage,
                size: 0,
                mimeType: file.mimetype,
                breakpoints: responsiveImageData.breakpoints
            });
            yield image.save();
            course.image = image;
            yield course.save();
            return image.toObject();
        });
    }
};
__decorate([
    routing_controllers_1.Get('/'),
    __param(0, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "getCourses", null);
__decorate([
    routing_controllers_1.Get('/:id([a-fA-F0-9]{24})'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "getCourseView", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Get('/:id([a-fA-F0-9]{24})/edit'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "getCourseEdit", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/'),
    __param(0, routing_controllers_1.Body()), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "addCourse", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/mail'),
    __param(0, routing_controllers_1.Body()), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CourseController.prototype, "sendMailToSelectedUsers", null);
__decorate([
    routing_controllers_1.Authorized(['student']),
    routing_controllers_1.Post('/:id/enroll'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "enrollStudent", null);
__decorate([
    routing_controllers_1.Authorized(['student']),
    routing_controllers_1.Post('/:id/leave'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "leaveStudent", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/:id/whitelist'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.Body()),
    __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "whitelistStudents", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Put('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "updateCourse", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Delete('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "deleteCourse", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Delete('/picture/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "deleteCoursePicture", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/picture/:id'),
    __param(0, routing_controllers_1.UploadedFile('file', { options: coursePictureUploadOptions })),
    __param(1, routing_controllers_1.Param('id')),
    __param(2, routing_controllers_1.Body()),
    __param(3, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], CourseController.prototype, "addCoursePicture", null);
CourseController = __decorate([
    routing_controllers_1.JsonController('/courses'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], CourseController);
exports.CourseController = CourseController;

//# sourceMappingURL=../../maps/src/controllers/CourseController.js.map
