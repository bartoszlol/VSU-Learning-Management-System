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
const body_parser_1 = require("body-parser");
const passportLoginMiddleware_1 = require("../security/passportLoginMiddleware");
const EmailService_1 = require("../services/EmailService");
const User_1 = require("../models/User");
const JwtUtils_1 = require("../security/JwtUtils");
const errorCodes = require("../config/errorCodes");
const Course_1 = require("../models/Course");
const main_1 = require("../config/main");
let AuthController = class AuthController {
    /**
     * @api {post} /api/auth/login Login user by responding with a httpOnly JWT cookie and the user's IUserModel data.
     * @apiName PostAuthLogin
     * @apiGroup Auth
     *
     * @apiParam {Request} request Login request (with email and password).
     *
     * @apiSuccess {IUserModel} user Authenticated user.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "user": {
     *             "_id": "5a037e6a60f72236d8e7c813",
     *             "updatedAt": "2018-01-08T19:24:26.522Z",
     *             "createdAt": "2017-11-08T22:00:10.897Z",
     *             "email": "admin@test.local",
     *             "__v": 0,
     *             "isActive": true,
     *             "lastVisitedCourses": [],
     *             "role": "admin",
     *             "profile": {
     *                 "firstName": "Dago",
     *                 "lastName": "Adminman",
     *                 "picture": {}
     *             },
     *             "id": "5a037e6a60f72236d8e7c813"
     *         }
     *     }
     */
    postLogin(request, response) {
        const user = request.user;
        response.cookie('token', JwtUtils_1.JwtUtils.generateToken(user), {
            httpOnly: true,
            sameSite: true,
        });
        response.json({
            user: user.toObject()
        });
        return response;
    }
    /**
     * @api {delete} /api/auth/logout Logout user by clearing the httpOnly token cookie.
     * @apiName AuthLogout
     * @apiGroup Auth
     *
     * @apiSuccessExample {json} Success-Response:
     *      {}
     */
    logout(response) {
        response.clearCookie('token');
        response.json({});
        return response;
    }
    /**
     * @api {post} /api/auth/register Register user
     * @apiName PostAuthRegister
     * @apiGroup Auth
     *
     * @apiParam {IUser} user New user to be registered.
     *
     * @apiError BadRequestError That matriculation number is already in use
     * @apiError BadRequestError That email address is already in use
     * @apiError BadRequestError You can only sign up as student or teacher
     * @apiError BadRequestError You are not allowed to register as teacher
     * @apiError InternalServerError Could not send E-Mail
     */
    postRegister(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield User_1.User.findOne({ $or: [{ email: user.email }, { uid: user.uid }] });
            // If user is not unique, return error
            if (existingUser) {
                if (user.role === 'student' && existingUser.uid === user.uid) {
                    throw new routing_controllers_1.BadRequestError(errorCodes.errorCodes.duplicateUid.code);
                }
                if (existingUser.email === user.email) {
                    throw new routing_controllers_1.BadRequestError(errorCodes.errorCodes.mail.duplicate.code);
                }
            }
            if (user.role !== 'teacher' && user.role !== 'student') {
                throw new routing_controllers_1.BadRequestError('You can only sign up as student or teacher');
            }
            if (user.role === 'teacher' && (typeof user.email !== 'string' || !user.email.match(main_1.default.teacherMailRegex))) {
                throw new routing_controllers_1.BadRequestError(errorCodes.errorCodes.mail.noTeacher.code);
            }
            const newUser = new User_1.User(user);
            const savedUser = yield newUser.save();
            // User can now match a whitelist.
            yield this.addWhitelistedUserToCourses(savedUser);
            try {
                EmailService_1.default.sendActivation(savedUser);
            }
            catch (err) {
                throw new routing_controllers_1.InternalServerError(errorCodes.errorCodes.mail.notSend.code);
            }
        });
    }
    /**
     * @api {post} /api/auth/activate Activate user
     * @apiName PostAuthActivate
     * @apiGroup Auth
     *
     * @apiParam {string} authenticationToken Authentication token.
     *
     * @apiSuccess {Boolean} success Confirmation of activation.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "success": true
     *     }
     *
     * @apiError HttpError 422 - could not activate user
     */
    // TODO If activate user and is in playlist add to course.
    postActivation(authenticationToken) {
        return User_1.User.findOne({ authenticationToken: authenticationToken })
            .then((existingUser) => {
            if (!existingUser) {
                throw new routing_controllers_1.HttpError(422, 'could not activate user');
            }
            existingUser.authenticationToken = undefined;
            existingUser.isActive = true;
            return existingUser.save();
        })
            .then((user) => {
            return { success: true };
        });
    }
    /**
     * @api {post} /api/auth/activationresend Resend Activation
     * @apiName ActivationResend
     * @apiGroup Auth
     *
     * @apiParam {string} lastname lastname of user which activation should be resend.
     * @apiParam {string} uid matriculation number of user which activation should be resend.
     * @apiParam {string} email email the new activation should be sent to.
     *
     * @apiError (BadRequestError) 400 User was not found.
     * @apiError (BadRequestError) 400 That email address is already in use
     * @apiError (BadRequestError) 400 User is already activated.
     * @apiError (HttpError) 503 You can only resend the activation every X minutes. Your next chance is in
     * time left till next try in 'try-after' header in seconds
     * @apiError (InternalServerError) Could not send E-Mail
     */
    activationResend(lastname, uid, email, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ 'profile.lastName': lastname, uid: uid, role: 'student' });
            if (!user) {
                throw new routing_controllers_1.BadRequestError(errorCodes.errorCodes.user.userNotFound.code);
            }
            if (user.isActive) {
                throw new routing_controllers_1.BadRequestError(errorCodes.errorCodes.user.userAlreadyActive.code);
            }
            const timeSinceUpdate = (Date.now() - user.updatedAt.getTime()) / 60000;
            if (timeSinceUpdate < Number(main_1.default.timeTilNextActivationResendMin)) {
                const retryAfter = (Number(main_1.default.timeTilNextActivationResendMin) - timeSinceUpdate) * 60;
                response.set('retry-after', retryAfter.toString());
                throw new routing_controllers_1.HttpError(503, errorCodes.errorCodes.user.retryAfter.code);
            }
            const existingUser = yield User_1.User.findOne({ email: email });
            if (existingUser && existingUser.uid !== uid) {
                throw new routing_controllers_1.BadRequestError(errorCodes.errorCodes.mail.duplicate.code);
            }
            user.authenticationToken = undefined;
            user.email = email;
            const savedUser = yield user.save();
            try {
                yield EmailService_1.default.resendActivation(savedUser);
            }
            catch (err) {
                throw new routing_controllers_1.InternalServerError(err.toString());
            }
        });
    }
    /**
     * @api {post} /api/auth/reset Reset password
     * @apiName PostAuthReset
     * @apiGroup Auth
     *
     * @apiParam {string} resetPasswordToken Authentication token.
     * @apiParam {string} newPassword New password.
     *
     * @apiSuccess {Boolean} success Confirmation of reset.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "success": true
     *     }
     *
     * @apiError HttpError 422 - could not reset users password
     * @apiError ForbiddenError your reset password token is expired
     */
    postPasswordReset(resetPasswordToken, newPassword) {
        return User_1.User.findOne({ resetPasswordToken: resetPasswordToken })
            .then((existingUser) => {
            if (!existingUser) {
                throw new routing_controllers_1.HttpError(422, 'could not reset users password');
            }
            if (existingUser.resetPasswordExpires < new Date()) {
                throw new routing_controllers_1.ForbiddenError('your reset password token is expired');
            }
            existingUser.password = newPassword;
            existingUser.resetPasswordToken = undefined;
            existingUser.resetPasswordExpires = undefined;
            existingUser.markModified('password');
            return existingUser.save();
        })
            .then((savedUser) => {
            return { success: true };
        });
    }
    /**
     * @api {post} /api/auth/requestreset Request password reset
     * @apiName PostAuthRequestReset
     * @apiGroup Auth
     *
     * @apiParam {string} email Email to notify.
     *
     * @apiSuccess {Boolean} success Confirmation of email transmission.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "success": true
     *     }
     *
     * @apiError HttpError 422 - could not reset users password
     * @apiError InternalServerError Could not send E-Mail
     */
    postRequestPasswordReset(email) {
        return User_1.User.findOne({ email: email })
            .then((existingUser) => {
            if (!existingUser) {
                throw new routing_controllers_1.HttpError(422, 'could not reset users password');
            }
            const expires = new Date();
            expires.setTime((new Date()).getTime()
                // Add 24h
                + (24 * 60 * 60 * 1000));
            existingUser.resetPasswordExpires = expires;
            return existingUser.save();
        })
            .then((user) => {
            return EmailService_1.default.sendPasswordReset(user);
        })
            .then(() => {
            return { success: true };
        })
            .catch((err) => {
            throw new routing_controllers_1.InternalServerError('Could not send E-Mail');
        });
    }
    /**
     * Add new user to all whitelisted courses in example after registration.
     * @param {IUser} user
     * @returns {Promise<void>}
     */
    addWhitelistedUserToCourses(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const courses = yield Course_1.Course.find({ enrollType: 'whitelist' }).populate('whitelist');
            yield Promise.all(courses.map((course) => __awaiter(this, void 0, void 0, function* () {
                const userUidIsRegisteredInWhitelist = course.whitelist.findIndex(w => w.uid === user.uid) >= 0;
                const userIsntAlreadyStudentOfCourse = course.students.findIndex(u => u._id === user._id) < 0;
                if (userUidIsRegisteredInWhitelist && userIsntAlreadyStudentOfCourse) {
                    course.students.push(user);
                    yield course.save();
                }
            })));
        });
    }
};
__decorate([
    routing_controllers_1.Post('/login'),
    routing_controllers_1.UseBefore(body_parser_1.json(), passportLoginMiddleware_1.default) // We need body-parser for passport to find the credentials
    ,
    __param(0, routing_controllers_1.Req()), __param(1, routing_controllers_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "postLogin", null);
__decorate([
    routing_controllers_1.Delete('/logout'),
    __param(0, routing_controllers_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    routing_controllers_1.Post('/register'),
    routing_controllers_1.OnUndefined(204),
    __param(0, routing_controllers_1.Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "postRegister", null);
__decorate([
    routing_controllers_1.Post('/activate'),
    __param(0, routing_controllers_1.BodyParam('authenticationToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "postActivation", null);
__decorate([
    routing_controllers_1.Post('/activationresend'),
    routing_controllers_1.OnUndefined(204),
    __param(0, routing_controllers_1.BodyParam('lastname')),
    __param(1, routing_controllers_1.BodyParam('uid')),
    __param(2, routing_controllers_1.BodyParam('email')),
    __param(3, routing_controllers_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "activationResend", null);
__decorate([
    routing_controllers_1.Post('/reset'),
    __param(0, routing_controllers_1.BodyParam('resetPasswordToken')), __param(1, routing_controllers_1.BodyParam('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "postPasswordReset", null);
__decorate([
    routing_controllers_1.Post('/requestreset'),
    __param(0, routing_controllers_1.BodyParam('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "postRequestPasswordReset", null);
AuthController = __decorate([
    routing_controllers_1.JsonController('/auth')
], AuthController);
exports.AuthController = AuthController;

//# sourceMappingURL=../../maps/src/controllers/AuthController.js.map
