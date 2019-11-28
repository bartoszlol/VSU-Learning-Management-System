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
var NotificationController_1;
const routing_controllers_1 = require("routing-controllers");
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
const NotificationSettings_1 = require("../models/NotificationSettings");
const Notification_1 = require("../models/Notification");
const Course_1 = require("../models/Course");
const Lecture_1 = require("../models/Lecture");
const Unit_1 = require("../models/units/Unit");
const User_1 = require("../models/User");
const EmailService_1 = require("../services/EmailService");
const errorCodes_1 = require("../config/errorCodes");
let NotificationController = NotificationController_1 = class NotificationController {
    static resolveTarget(targetId, targetType, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            let course;
            let lecture;
            let unit;
            switch (targetType) {
                case 'course':
                    course = yield Course_1.Course.findById(targetId).orFail(new routing_controllers_1.NotFoundError());
                    break;
                case 'lecture':
                    lecture = yield Lecture_1.Lecture.findById(targetId).orFail(new routing_controllers_1.NotFoundError());
                    course = yield Course_1.Course.findOne({ lectures: targetId })
                        .orFail(new routing_controllers_1.InternalServerError(errorCodes_1.errorCodes.notification.missingCourseOfLecture.text));
                    break;
                case 'unit':
                    unit = yield Unit_1.Unit.findById(targetId).orFail(new routing_controllers_1.NotFoundError());
                    course = yield Course_1.Course.findById(unit._course)
                        .orFail(new routing_controllers_1.InternalServerError(errorCodes_1.errorCodes.notification.missingCourseOfUnit.text));
                    break;
                default:
                    throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.notification.invalidTargetType.text);
            }
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            return { course, lecture, unit };
        });
    }
    /**
     * @api {post} /api/notification/ Create notifications
     * @apiName PostNotifications
     * @apiGroup Notification
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} targetId Target id of the changed course, lecture or unit.
     * @apiParam {String} targetType Which type the targetId represents: Either 'course', 'lecture' or 'unit'.
     * @apiParam {String} text Message that the new notification(s) will contain.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {}
     *
     * @apiError NotFoundError Did not find the targetId of targetType.
     * @apiError BadRequestError Invalid targetType.
     * @apiError ForbiddenError The teacher doesn't have access to the corresponding course.
     * @apiError InternalServerError No course was found for a given existing lecture.
     * @apiError InternalServerError No course was found for a given existing unit.
     */
    createNotifications(targetId, targetType, text, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const { course, lecture, unit } = yield NotificationController_1.resolveTarget(targetId, targetType, currentUser);
            yield Promise.all(course.students.map((student) => __awaiter(this, void 0, void 0, function* () {
                if (yield this.shouldCreateNotification(student, course, unit)) {
                    yield this.createNotification(student, text, course, lecture, unit);
                }
            })));
            return {};
        });
    }
    /**
     * @api {post} /api/notification/user/:id Create notification for user
     * @apiName PostNotification
     * @apiGroup Notification
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id ID of the user that the new notification is assigned/sent to.
     * @apiParam {String} targetId Target id of the changed course, lecture or unit.
     * @apiParam {String} targetType Which type the targetId represents: Either 'course', 'lecture', 'unit' or 'text'.
     *                               The 'text' type only uses the 'text' parameter while ignoring the 'targetId'.
     * @apiParam {String} text Message that the new notification(s) will contain.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {}
     *
     * @apiError NotFoundError Did not find the targetId of targetType.
     * @apiError BadRequestError Invalid targetType.
     * @apiError ForbiddenError The teacher doesn't have access to the corresponding course (if targetType isn't 'text'-only).
     * @apiError InternalServerError No course was found for a given existing lecture.
     * @apiError InternalServerError No course was found for a given existing unit.
     */
    createNotificationForStudent(userId, targetId, targetType, text, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            if (targetType === 'text' && !text) {
                throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.notification.textOnlyWithoutText.text);
            }
            const { course, lecture, unit } = targetType === 'text'
                ? { course: undefined, lecture: undefined, unit: undefined }
                : yield NotificationController_1.resolveTarget(targetId, targetType, currentUser);
            const user = yield User_1.User.findById(userId).orFail(new routing_controllers_1.NotFoundError(errorCodes_1.errorCodes.notification.targetUserNotFound.text));
            if (yield this.shouldCreateNotification(user, course, unit)) {
                yield this.createNotification(user, text, course, lecture, unit);
            }
            return {};
        });
    }
    shouldCreateNotification(user, changedCourse, changedUnit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!changedCourse && !changedUnit) {
                // The notificaiton does not depend on any unit/course. We can create a notification.
                return true;
            }
            if (!changedUnit) {
                return !(yield Notification_1.Notification.findOne({ user, changedCourse }));
            }
            return !(yield Notification_1.Notification.findOne({ user, changedUnit }));
        });
    }
    createNotification(user, text, changedCourse, changedLecture, changedUnit) {
        return __awaiter(this, void 0, void 0, function* () {
            // create no notification if course is not active
            if (changedCourse && !changedCourse.active) {
                return;
            }
            // create no notification for unit if unit is invisible
            if (changedUnit && !changedUnit.visible) {
                return;
            }
            const notification = new Notification_1.Notification();
            notification.user = user;
            notification.text = text;
            notification.isOld = false;
            if (changedCourse) {
                notification.changedCourse = changedCourse;
                const settings = yield this.getOrCreateSettings(user, changedCourse);
                if (settings.notificationType === NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES) {
                    if (changedLecture) {
                        notification.changedLecture = changedLecture;
                    }
                    if (changedUnit) {
                        notification.changedUnit = changedUnit;
                    }
                    if (settings.emailNotification) {
                        yield this.sendNotificationMail(user, 'you received new notifications for the course ' + changedCourse.name + '.');
                    }
                }
            }
            return yield notification.save();
        });
    }
    getOrCreateSettings(user, changedCourse) {
        return __awaiter(this, void 0, void 0, function* () {
            let settings = yield NotificationSettings_1.NotificationSettings.findOne({ 'user': user, 'course': changedCourse });
            if (settings === undefined || settings === null) {
                settings = yield new NotificationSettings_1.NotificationSettings({
                    user: user,
                    course: changedCourse,
                    notificationType: NotificationSettings_1.API_NOTIFICATION_TYPE_ALL_CHANGES,
                    emailNotification: false
                }).save();
            }
            return settings;
        });
    }
    sendNotificationMail(user, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {};
            user = yield User_1.User.findById(user);
            message.to = user.profile.firstName + ' ' + user.profile.lastName + '<' + user.email + '>';
            message.subject = 'Geli informs: you have new notifications :)';
            message.text = 'Hello ' + user.profile.firstName + ', \n\n' +
                +text + '\n' + 'Please check your notifications in geli.\n' +
                'Your GELI Team.';
            message.html = '<p>Hello ' + user.profile.firstName + ',</p><br>' +
                '<p>' + text + '<br>Please check your notifications in geli.</p><br>' +
                '<p>Your GELI Team.</p>';
            yield EmailService_1.default.sendFreeFormMail(message);
        });
    }
    /**
     * @api {get} /api/notification/ Get own notifications
     * @apiName GetNotifications
     * @apiGroup Notification
     * @apiPermission student
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiSuccess {INotificationView[]} notifications List of notifications.
     *
     * @apiSuccessExample {json} Success-Response:
     *     [{
     *         "_id": "5ab2fbe464efe60006cef0b1",
     *         "changedCourse": "5c0fb47d8d583532143c68a7",
     *         "changedLecture": "5bdb49f11a09bb3ca8ce0a10",
     *         "changedUnit": "5be0691ee3859d38308dab18",
     *         "text": "Course ProblemSolver has an updated text unit.",
     *         "isOld": false
     *     }, {
     *         "_id": "5ab2fc7b64efe60006cef0bb",
     *         "changedCourse": "5be0691ee3859d38308dab19",
     *         "changedLecture": "5bdb49ef1a09bb3ca8ce0a01",
     *         "changedUnit": "5bdb49f11a09bb3ca8ce0a12",
     *         "text": "Course katacourse has an updated unit.",
     *         "isOld": false
     *     }]
     */
    getNotifications(currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const notifications = yield Notification_1.Notification.find({ user: currentUser });
            return notifications.map(notification => notification.forView());
        });
    }
    /**
     * @api {delete} /api/notification/:id Delete notification
     * @apiName DeleteNotification
     * @apiGroup Notification
     * @apiPermission student
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Notification ID.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {}
     *
     * @apiError NotFoundError Notification could not be found.
     */
    deleteNotification(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const notification = yield Notification_1.Notification.findOne({ _id: id, user: currentUser }).orFail(new routing_controllers_1.NotFoundError());
            yield notification.remove();
            return {};
        });
    }
};
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/'),
    __param(0, routing_controllers_1.BodyParam('targetId', { required: true })),
    __param(1, routing_controllers_1.BodyParam('targetType', { required: true })),
    __param(2, routing_controllers_1.BodyParam('text', { required: true })),
    __param(3, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createNotifications", null);
__decorate([
    routing_controllers_1.Authorized(['teacher', 'admin']),
    routing_controllers_1.Post('/user/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __param(1, routing_controllers_1.BodyParam('targetId', { required: false })),
    __param(2, routing_controllers_1.BodyParam('targetType', { required: true })),
    __param(3, routing_controllers_1.BodyParam('text', { required: false })),
    __param(4, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createNotificationForStudent", null);
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Get('/'),
    __param(0, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getNotifications", null);
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Delete('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "deleteNotification", null);
NotificationController = NotificationController_1 = __decorate([
    routing_controllers_1.JsonController('/notification'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], NotificationController);
exports.NotificationController = NotificationController;

//# sourceMappingURL=../../maps/src/controllers/NotificationController.js.map
