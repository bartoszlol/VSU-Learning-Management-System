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
const WhitelistUser_1 = require("../models/WhitelistUser");
const errorCodes_1 = require("../config/errorCodes");
const mongoose = require("mongoose");
var ObjectId = mongoose.Types.ObjectId;
const Course_1 = require("../models/Course");
const User_1 = require("../models/User");
let WhitelistController = class WhitelistController {
    /**
     * @api {get} /api/whitelist/check/:whitelist
     *
     *
     * @apiSuccessExample {json} Success-Response:
     *  [
     *    {
     *        "uid": "<uid>",
     *        "exists": true
     *    },
     *    {
     *        "uid": "<non-existing-uid>",
     *        "exists": false
     *    }
     *  ]
     * @apiParam whitelistToCheck
     */
    checkWhitelistForExistingStudents(whitelistToCheck) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(whitelistToCheck.map((uid) => __awaiter(this, void 0, void 0, function* () {
                {
                    return { uid, exists: !!(yield User_1.User.findOne({ uid: uid })) };
                }
            })));
        });
    }
    /**
     * @api {get} /api/whitelist/:id Request whitelist user
     * @apiName GetWhitelistUser
     * @apiGroup Whitelist
     *
     * @apiParam {String} id Whitelist user ID.
     *
     * @apiSuccess {WhitelistUser} whitelistUser Whitelist user.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "__v": 0,
     *         "updatedAt": "2018-03-21T23:22:23.758Z",
     *         "createdAt": "2018-03-21T23:22:23.758Z",
     *         "_id": "5ab2e92fda32ac2ab0f04b78",
     *         "firstName": "max",
     *         "lastName": "mustermann",
     *         "uid": "876543",
     *         "courseId": {...},
     *         "id": "5ab2e92fda32ac2ab0f04b78"
     *     }
     */
    getUser(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const whitelistUser = yield WhitelistUser_1.WhitelistUser.findById(id);
            const course = yield Course_1.Course.findById(whitelistUser.courseId);
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            return whitelistUser.toObject({ virtuals: true });
        });
    }
    /**
     * @api {post} /api/whitelist/ Add whitelist user
     * @apiName PostWhitelistUser
     * @apiGroup Whitelist
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {IWhitelistUser} whitelistUser New whitelist user.
     *
     * @apiSuccess {WhitelistUser} savedWhitelistUser Added whitelist user.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "__v": 0,
     *         "updatedAt": "2018-03-21T23:22:23.758Z",
     *         "createdAt": "2018-03-21T23:22:23.758Z",
     *         "_id": "5ab2e92fda32ac2ab0f04b78",
     *         "firstName": "max",
     *         "lastName": "mustermann",
     *         "uid": "876543",
     *         "courseId": {...},
     *         "id": "5ab2e92fda32ac2ab0f04b78"
     *     }
     *
     * @apiError BadRequestError That matriculation number is already in use for this course.
     */
    addWhitelistUser(whitelistUser, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(whitelistUser.courseId);
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            let savedWhitelistUser;
            try {
                savedWhitelistUser = yield new WhitelistUser_1.WhitelistUser(this.prepareWhitelistUserData(whitelistUser)).save();
            }
            catch (err) {
                throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.whitelist.duplicateWhitelistUser.text);
            }
            yield this.addUserIfFound(whitelistUser);
            return savedWhitelistUser.toObject();
        });
    }
    /**
     * @api {put} /api/whitelist/:id Update whitelist user
     * @apiName PutWhitelistUser
     * @apiGroup Whitelist
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Whitelist user ID.
     * @apiParam {IWhitelistUser} whitelistUser New whitelist user.
     *
     * @apiSuccess {WhitelistUser} updatedWhitelistUser Updated whitelist user.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "__v": 0,
     *         "updatedAt": "2018-03-21T23:24:56.758Z",
     *         "createdAt": "2018-03-21T23:22:23.758Z",
     *         "_id": "5ab2e92fda32ac2ab0f04b78",
     *         "firstName": "maximilian",
     *         "lastName": "mustermann",
     *         "uid": "876543",
     *         "courseId": {...},
     *         "id": "5ab2e92fda32ac2ab0f04b78"
     *     }
     *
     * @apiError BadRequestError That matriculation number is already in use for this course.
     */
    // This route has been disabled since it appears to be unused and insufficiently secured.
    /*
    @Put('/:id')
    @Authorized(['teacher', 'admin'])
    async updateWhitelistUser(@Param('id') id: string, @Body() whitelistUser: IWhitelistUser) {
      let updatedWhitelistUser;
      const foundWhitelistUser = await WhitelistUser.findById(id);
      try {
        updatedWhitelistUser = await WhitelistUser.findOneAndUpdate(
          this.prepareWhitelistUserData(whitelistUser),
          {'new': true});
      } catch (err) {
        throw new BadRequestError(errorCodes.whitelist.duplicateWhitelistUser.text);
      }
      await this.deleteUserIfFound(foundWhitelistUser);
      await this.addUserIfFound(updatedWhitelistUser);
      return updatedWhitelistUser ? updatedWhitelistUser.toObject() : undefined;
    }
    */
    /**
     * @api {delete} /api/whitelist/:id Delete whitelist user
     * @apiName DeleteWhitelistUser
     * @apiGroup Whitelist
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id Whitelist user ID.
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {}
     */
    deleteWhitelistUser(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const whitelistUser = yield WhitelistUser_1.WhitelistUser.findById(id);
            const course = yield Course_1.Course.findById(whitelistUser.courseId);
            if (!course.checkPrivileges(currentUser).userCanEditCourse) {
                throw new routing_controllers_1.ForbiddenError();
            }
            yield WhitelistUser_1.WhitelistUser.deleteOne({ _id: id });
            yield this.deleteUserIfFound(whitelistUser);
            return {};
        });
    }
    deleteUserIfFound(whitelistUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findById(whitelistUser.courseId).populate('students');
            if (course) {
                course.students = course.students.filter(stud => stud.uid.toString() !== whitelistUser.uid);
                yield course.save();
            }
        });
    }
    addUserIfFound(whitelistUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const stud = yield User_1.User.findOne({
                uid: whitelistUser.uid,
                'profile.firstName': { $regex: new RegExp('^' + whitelistUser.firstName.toLowerCase(), 'i') },
                'profile.lastName': { $regex: new RegExp('^' + whitelistUser.lastName.toLowerCase(), 'i') }
            });
            if (stud) {
                const course = yield Course_1.Course.findById(whitelistUser.courseId);
                course.students.push(stud);
                yield course.save();
            }
        });
    }
    prepareWhitelistUserData(whitelistUser) {
        return {
            _id: whitelistUser._id,
            firstName: whitelistUser.firstName,
            lastName: whitelistUser.lastName,
            uid: whitelistUser.uid,
            courseId: new ObjectId(whitelistUser.courseId)
        };
    }
};
__decorate([
    routing_controllers_1.Get('/check/:whitelist'),
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.Param('whitelist')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WhitelistController.prototype, "checkWhitelistForExistingStudents", null);
__decorate([
    routing_controllers_1.Get('/:id'),
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhitelistController.prototype, "getUser", null);
__decorate([
    routing_controllers_1.Post('/'),
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.Body()), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WhitelistController.prototype, "addWhitelistUser", null);
__decorate([
    routing_controllers_1.Delete('/:id'),
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhitelistController.prototype, "deleteWhitelistUser", null);
WhitelistController = __decorate([
    routing_controllers_1.JsonController('/whitelist'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], WhitelistController);
exports.WhitelistController = WhitelistController;

//# sourceMappingURL=../../maps/src/controllers/WhitelistController.js.map
