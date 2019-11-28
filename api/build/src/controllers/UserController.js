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
const fs = require("fs");
const path = require("path");
const User_1 = require("../models/User");
const util_1 = require("util");
const errorCodes_1 = require("../config/errorCodes");
const sharp = require("sharp");
const main_1 = require("../config/main");
const Course_1 = require("../models/Course");
const EmailService_1 = require("../services/EmailService");
const multer = require('multer');
const uploadOptions = {
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(main_1.default.uploadFolder, 'users'));
        },
        filename: (req, file, cb) => {
            const id = req.params.id;
            const randomness = '-' + (Math.floor(Math.random() * 8999) + 1000);
            const extPos = file.originalname.lastIndexOf('.');
            const ext = (extPos !== -1) ? `.${file.originalname.substr(extPos + 1).toLowerCase()}` : '';
            cb(null, id + randomness + ext);
        }
    }),
};
function escapeRegex(text) {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
let UserController = class UserController {
    /**
     * @api {get} /api/users/ Request all users
     * @apiName GetUsers
     * @apiGroup User
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {User[]} users List of users.
     *
     * @apiSuccessExample {json} Success-Response:
     *     [
     *         {
     *             "_id": "5a037e6a60f72236d8e7c81d",
     *             "updatedAt": "2018-01-08T19:27:49.483Z",
     *             "createdAt": "2017-11-08T22:00:10.899Z",
     *             "uid": "123456",
     *             "email": "student1@test.local",
     *             "__v": 0,
     *             "isActive": true,
     *             "role": "student",
     *             "profile": {
     *                 "firstName": "Tick",
     *                 "lastName": "Studi",
     *                 "picture": {
     *                     "alias": "IMG_20141226_211216.jpg",
     *                     "name": "5a037e6a60f72236d8e7c81d-9558.jpg",
     *                     "path": "uploads\\users\\5a037e6a60f72236d8e7c81d-9558.jpg"
     *                 }
     *             },
     *             "id": "5a037e6a60f72236d8e7c81d"
     *         },
     *         {
     *             "uid": null,
     *             "_id": "5a037e6a60f72236d8e7c815",
     *             "updatedAt": "2017-11-08T22:00:10.898Z",
     *             "createdAt": "2017-11-08T22:00:10.898Z",
     *             "email": "teacher2@test.local",
     *             "__v": 0,
     *             "isActive": true,
     *             "role": "teacher",
     *             "profile": {
     *                 "firstName": "Ober",
     *                 "lastName": "Lehrer"
     *             },
     *             "id": "5a037e6a60f72236d8e7c815"
     *         }
     *     ]
     */
    getUsers(currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const users = yield User_1.User.find();
            return users.map(user => user.forUser(currentUser));
        });
    }
    /**
     * @api {get} /api/users/members/search Request users with certain role and query
     * @apiName SearchUser
     * @apiGroup User
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String="student","teacher"} role User role.
     * @apiParam {String} query Query string.
     * @apiParam {Number} limit Limit.
     *
     * @apiSuccess {Object} result Search result.
     * @apiSuccess {User[]} result.users List of found users.
     * @apiSuccess {Object} result.meta Meta data.
     * @apiSuccess {Number} meta.count Number of users with given role.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "users": [
     *             {
     *                 "_id": "5a037e6a60f72236d8e7c81d",
     *                 "updatedAt": "2018-01-08T19:27:49.483Z",
     *                 "createdAt": "2017-11-08T22:00:10.899Z",
     *                 "uid": "123456",
     *                 "email": "student1@test.local",
     *                 "__v": 0,
     *                 "score": 1.1,
     *                 "isActive": true,
     *                 "role": "student",
     *                 "profile": {
     *                     "firstName": "Tick",
     *                     "lastName": "Studi",
     *                     "picture": {
     *                         "alias": "IMG_20141226_211216.jpg",
     *                         "name": "5a037e6a60f72236d8e7c81d-9558.jpg",
     *                         "path": "uploads\\users\\5a037e6a60f72236d8e7c81d-9558.jpg"
     *                     }
     *                 },
     *                 "id": "5a037e6a60f72236d8e7c81d"
     *             },
     *             {
     *                 "_id": "5a037e6a60f72236d8e7c81f",
     *                 "updatedAt": "2017-11-08T22:00:10.900Z",
     *                 "createdAt": "2017-11-08T22:00:10.900Z",
     *                 "uid": "345678",
     *                 "email": "student3@test.local",
     *                 "__v": 0,
     *                 "score": 1.1,
     *                 "isActive": true,
     *                 "role": "student",
     *                 "profile": {
     *                     "firstName": "Track",
     *                     "lastName": "Studi"
     *                 },
     *                 "id": "5a037e6a60f72236d8e7c81f"
     *             },
     *             {
     *                 "_id": "5a037e6a60f72236d8e7c81e",
     *                 "updatedAt": "2017-11-08T22:00:10.900Z",
     *                 "createdAt": "2017-11-08T22:00:10.900Z",
     *                 "uid": "234567",
     *                 "email": "student2@test.local",
     *                 "__v": 0,
     *                 "score": 1.1,
     *                 "isActive": true,
     *                 "role": "student",
     *                 "profile": {
     *                     "firstName": "Trick",
     *                     "lastName": "Studi"
     *                 },
     *                 "id": "5a037e6a60f72236d8e7c81e"
     *             }
     *         ],
     *         "meta": {
     *             "count": 31
     *         }
     *     }
     *
     * @apiError BadRequestError Method not allowed for this role.
     * @apiError BadRequestError Query was empty.
     */
    searchUser(currentUser, role, query, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (role !== 'student' && role !== 'teacher') {
                throw new routing_controllers_1.BadRequestError('Method not allowed for this role.');
            }
            query = query.trim();
            if (util_1.isNullOrUndefined(query)) {
                throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.query.empty.code);
            }
            const conditions = {};
            const escaped = escapeRegex(query).split(' ');
            conditions.$or = [];
            conditions.$or.push({ $text: { $search: query } });
            escaped.forEach(elem => {
                const re = new RegExp(elem, 'ig');
                conditions.$or.push({ uid: { $regex: re } });
                conditions.$or.push({ email: { $regex: re } });
                conditions.$or.push({ 'profile.firstName': { $regex: re } });
                conditions.$or.push({ 'profile.lastName': { $regex: re } });
            });
            const amountUsers = yield User_1.User.countDocuments({ role: role });
            const users = yield User_1.User.find(conditions, {
                'score': { $meta: 'textScore' }
            })
                .where({ role: role })
                .limit(limit ? limit : Number.MAX_SAFE_INTEGER)
                .sort({ 'score': { $meta: 'textScore' } });
            return {
                users: users.map(user => user.forUser(currentUser)),
                meta: {
                    count: amountUsers
                }
            };
        });
    }
    /**
     * @api {get} /api/users/roles/ Request all user roles
     * @apiName GetUserRoles
     * @apiGroup User
     * @apiPermission admin
     *
     * @apiSuccess {String[]} roles List of user roles.
     *
     * @apiSuccessExample {json} Success-Response:
     *     [
     *         "student",
     *         "teacher",
     *         "admin"
     *     ]
     */
    getRoles() {
        // TODO: Fix any cast
        return User_1.User.schema.path('role').enumValues;
    }
    /**
     * @api {get} /api/users/:id Request user with certain ID
     * @apiName GetUser
     * @apiGroup User
     *
     * @apiParam {String} id User ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {User} user User.
     *
     * @apiError NotFoundError User was not found.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6a60f72236d8e7c81d",
     *         "updatedAt": "2018-01-08T19:27:49.483Z",
     *         "createdAt": "2017-11-08T22:00:10.899Z",
     *         "uid": "123456",
     *         "email": "student1@test.local",
     *         "__v": 0,
     *         "isActive": true,
     *         "role": "student",
     *         "profile": {
     *             "firstName": "Tick",
     *             "lastName": "Studi",
     *             "picture": {
     *                 "alias": "IMG_20141226_211216.jpg",
     *                 "name": "5a037e6a60f72236d8e7c81d-9558.jpg",
     *                 "path": "uploads\\users\\5a037e6a60f72236d8e7c81d-9558.jpg"
     *             }
     *         },
     *         "id": "5a037e6a60f72236d8e7c81d"
     *     }
     */
    getUser(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findById(id).populate('progress');
            if (!user) {
                throw new routing_controllers_1.NotFoundError(`User was not found.`);
            }
            return user.forUser(currentUser);
        });
    }
    /**
     * @api {post} /api/users/picture/:id Add picture to user profile
     * @apiName PostUserPicture
     * @apiGroup User
     *
     * @apiParam {Object} file Uploaded file.
     * @apiParam {String} id User target ID.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {User} user Affected user.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6a60f72236d8e7c81d",
     *         "updatedAt": "2018-01-08T19:27:49.483Z",
     *         "createdAt": "2017-11-08T22:00:10.899Z",
     *         "uid": "123456",
     *         "email": "student1@test.local",
     *         "__v": 0,
     *         "isActive": true,
     *         "role": "student",
     *         "profile": {
     *             "firstName": "Tick",
     *             "lastName": "Studi",
     *             "picture": {
     *                 "alias": "IMG_20141226_211216.jpg",
     *                 "name": "5a037e6a60f72236d8e7c81d-9558.jpg",
     *                 "path": "uploads\\users\\5a037e6a60f72236d8e7c81d-9558.jpg"
     *             }
     *         },
     *         "id": "5a037e6a60f72236d8e7c81d"
     *     }
     *
     * @apiError ForbiddenError Forbidden format of uploaded picture.
     * @apiError ForbiddenError You don't have the authorization to change a user of this role.
     * @apiError BadRequestError
     */
    addUserPicture(file, id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const mimeFamily = file.mimetype.split('/', 1)[0];
            if (mimeFamily !== 'image') {
                throw new routing_controllers_1.ForbiddenError('Forbidden format of uploaded picture: ' + mimeFamily);
            }
            let user = yield User_1.User.findById(id);
            if (!user.checkEditableBy(currentUser).editAllowed) {
                throw new routing_controllers_1.ForbiddenError(errorCodes_1.errorCodes.user.cantChangeUserWithHigherRole.text);
            }
            if (user.profile.picture) {
                const oldPicturePath = user.profile.picture.path;
                if (oldPicturePath && fs.existsSync(oldPicturePath)) {
                    fs.unlinkSync(oldPicturePath);
                }
            }
            const resizedImageBuffer = yield sharp(file.path)
                .resize(main_1.default.maxProfileImageWidth, main_1.default.maxProfileImageHeight, { fit: 'inside', withoutEnlargement: true })
                .toBuffer({ resolveWithObject: true });
            fs.writeFileSync(file.path, resizedImageBuffer.data);
            user.profile.picture = {
                _id: null,
                name: file.filename,
                alias: file.originalname,
                path: path.relative(path.dirname(main_1.default.uploadFolder), file.path).replace(/\\\\?/g, '/'),
                size: resizedImageBuffer.info.size
            };
            try {
                user = yield user.save();
            }
            catch (error) {
                throw new routing_controllers_1.BadRequestError(error);
            }
            return user.forUser(currentUser);
        });
    }
    /**
     * @api {put} /api/users/:id Update user
     * @apiName PutUser
     * @apiGroup User
     * @apiPermission student
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id User target ID.
     * @apiParam {Object} newUser New user data.
     * @apiParam {IUser} currentUser Currently logged in user.
     *
     * @apiSuccess {User} user Updated user.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "_id": "5a037e6a60f72236d8e7c81d",
     *         "updatedAt": "2018-01-08T19:27:49.483Z",
     *         "createdAt": "2017-11-08T22:00:10.899Z",
     *         "uid": "123456",
     *         "email": "student1@test.local",
     *         "__v": 0,
     *         "isActive": true,
     *         "role": "student",
     *         "profile": {
     *             "firstName": "Tick",
     *             "lastName": "Studi",
     *             "picture": {
     *                 "alias": "IMG_20141226_211216.jpg",
     *                 "name": "5a037e6a60f72236d8e7c81d-9558.jpg",
     *                 "path": "uploads\\users\\5a037e6a60f72236d8e7c81d-9558.jpg"
     *             }
     *         },
     *         "id": "5a037e6a60f72236d8e7c81d"
     *     }
     *
     * @apiError BadRequestError Invalid update role.
     * @apiError BadRequestError You can't change your own role.
     * @apiError BadRequestError This email address is already in use.
     * @apiError BadRequestError Invalid current password!
     * @apiError ForbiddenError You don't have the authorization to change a user of this role.
     * @apiError ForbiddenError Only users with admin privileges can change roles.
     * @apiError ForbiddenError Only users with admin privileges can change uids.
     */
    updateUser(id, newUser, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            if (id === currentUser._id && currentUser.role !== newUser.role) {
                throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.user.cantChangeOwnRole.text);
            }
            const oldUser = yield User_1.User.findById(id);
            const { userIsAdmin, editAllowed } = oldUser.checkEditableBy(currentUser);
            if (!editAllowed) {
                throw new routing_controllers_1.ForbiddenError(errorCodes_1.errorCodes.user.cantChangeUserWithHigherRole.text);
            }
            if (oldUser.uid && newUser.uid === null) {
                newUser.uid = oldUser.uid;
            }
            if (oldUser.role && typeof newUser.role === 'undefined') {
                newUser.role = oldUser.role;
            }
            else if (typeof User_1.User.getEditLevelUnsafe(newUser) === 'undefined') {
                throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.user.invalidNewUserRole.text);
            }
            if (!userIsAdmin) {
                if (newUser.role !== oldUser.role) {
                    throw new routing_controllers_1.ForbiddenError(errorCodes_1.errorCodes.user.onlyAdminsCanChangeRoles.text);
                }
                if (newUser.uid !== oldUser.uid) {
                    throw new routing_controllers_1.ForbiddenError(errorCodes_1.errorCodes.user.onlyAdminsCanChangeUids.text);
                }
            }
            if (typeof newUser.password === 'undefined' || newUser.password.length === 0) {
                delete newUser.password;
            }
            else if (!userIsAdmin) {
                const isValidPassword = yield oldUser.isValidPassword(newUser.currentPassword);
                if (!isValidPassword) {
                    throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.user.invalidPassword.text);
                }
            }
            {
                const sameEmail = { $and: [{ 'email': newUser.email }, { '_id': { $ne: newUser._id } }] };
                const users = yield User_1.User.find(sameEmail).limit(1);
                if (users.length > 0) {
                    throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.user.emailAlreadyInUse.text);
                }
            }
            const updatedUser = yield User_1.User.findOneAndUpdate({ _id: id }, newUser, { new: true });
            return updatedUser.forUser(currentUser);
        });
    }
    /**
     * @api {delete} /api/users/:id Delete user
     * @apiName DeleteUser
     * @apiGroup User
     * @apiPermission student
     * @apiPermission teacher
     * @apiPermission admin
     *
     * @apiParam {String} id User ID.
     *
     * @apiSuccess {Boolean} result Confirmation of deletion.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "result": true
     *     }
     *
     * @apiError BadRequestError There are no other users with admin privileges.
     */
    deleteUser(id, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const otherAdmin = yield User_1.User.findOne({ $and: [{ 'role': 'admin' }, { '_id': { $ne: id } }] });
            if (id === currentUser._id && (currentUser.role === 'teacher' || currentUser.role === 'student')) {
                try {
                    EmailService_1.default.sendDeleteRequest(currentUser, otherAdmin);
                }
                catch (err) {
                    throw new routing_controllers_1.InternalServerError(errorCodes_1.errorCodes.mail.notSend.code);
                }
                return { result: true };
            }
            if (id === currentUser._id && currentUser.role === 'admin') {
                if (otherAdmin === null) {
                    throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.user.noOtherAdmins.text);
                }
            }
            else if (id !== currentUser._id && currentUser.role !== 'admin') {
                throw new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.user.cantDeleteOtherUsers.text);
            }
            const user = yield User_1.User.findById(id);
            if (id === currentUser._id) {
                // if user is current user, move ownership to another admin.
                yield Course_1.Course.changeCourseAdminFromUser(user, otherAdmin);
            }
            else {
                // move Courseownerships to active user.
                yield Course_1.Course.changeCourseAdminFromUser(user, currentUser);
            }
            yield user.remove();
            return { result: true };
        });
    }
};
__decorate([
    routing_controllers_1.Get('/'),
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUsers", null);
__decorate([
    routing_controllers_1.Get('/members/search') // members/search because of conflict with /:id
    ,
    routing_controllers_1.Authorized(['teacher', 'admin']),
    __param(0, routing_controllers_1.CurrentUser()), __param(1, routing_controllers_1.QueryParam('role')),
    __param(2, routing_controllers_1.QueryParam('query')), __param(3, routing_controllers_1.QueryParam('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "searchUser", null);
__decorate([
    routing_controllers_1.Authorized(['admin']),
    routing_controllers_1.Get('/roles/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserController.prototype, "getRoles", null);
__decorate([
    routing_controllers_1.Get('/:id([a-fA-F0-9]{24})'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
__decorate([
    routing_controllers_1.Post('/picture/:id'),
    __param(0, routing_controllers_1.UploadedFile('file', { options: uploadOptions })),
    __param(1, routing_controllers_1.Param('id')), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "addUserPicture", null);
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Put('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.Body()), __param(2, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    routing_controllers_1.Authorized(['student', 'teacher', 'admin']),
    routing_controllers_1.Delete('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteUser", null);
UserController = __decorate([
    routing_controllers_1.JsonController('/users'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], UserController);
exports.UserController = UserController;

//# sourceMappingURL=../../maps/src/controllers/UserController.js.map
