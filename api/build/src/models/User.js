"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const util_1 = require("util");
const validator_1 = require("validator");
const errorCodes_1 = require("../config/errorCodes");
const roles_1 = require("../config/roles");
const ExtractMongoId_1 = require("../utilities/ExtractMongoId");
const EnsureMongoToObject_1 = require("../utilities/EnsureMongoToObject");
const Course_1 = require("./Course");
const NotificationSettings_1 = require("./NotificationSettings");
const Notification_1 = require("./Notification");
const WhitelistUser_1 = require("./WhitelistUser");
const Progress_1 = require("./progress/Progress");
const fs = require("fs");
let User;
exports.User = User;
const userSchema = new mongoose.Schema({
    uid: {
        type: String,
        lowercase: true,
        unique: true,
        sparse: true,
        index: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true,
        validate: [{ validator: (value) => validator_1.isEmail(value), msg: 'Invalid email.' }],
        index: true
    },
    password: {
        type: String,
        required: true,
        validate: new RegExp(errorCodes_1.errorCodes.password.regex.regex)
    },
    profile: {
        firstName: {
            type: String,
            index: true,
            maxlength: 64
        },
        lastName: {
            type: String,
            index: true,
            maxlength: 64
        },
        picture: {
            path: { type: String },
            name: { type: String },
            alias: { type: String }
        },
        theme: { type: String }
    },
    role: {
        type: String,
        'enum': roles_1.allRoles,
        'default': 'student'
    },
    lastVisitedCourses: [{
            type: String
        }],
    authenticationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isActive: { type: Boolean, 'default': false },
    updatedAt: { type: Date, required: true, default: Date.now }
}, {
    timestamps: true,
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            ret._id = ret._id.toString();
            delete ret.password;
        }
    }
});
userSchema.index({
    uid: 'text',
    email: 'text',
    'profile.firstName': 'text',
    'profile.lastName': 'text'
}, { name: 'user_combined' });
function hashPassword(next) {
    const user = this, SALT_FACTOR = 5;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.hash(user.password, SALT_FACTOR)
        .then((hash) => {
        user.password = hash;
    })
        .then(() => next())
        .catch(next);
}
function generateActivationToken(next) {
    // check if user wasn't activated by the creator
    if (!this.isActive && util_1.isNullOrUndefined(this.authenticationToken)) {
        // set new authenticationToken
        this.authenticationToken = generateSecureToken();
    }
    next();
}
function generatePasswordResetToken(next) {
    // check if passwordReset is requested -> (resetPasswordExpires is set)
    if (!util_1.isNullOrUndefined(this.resetPasswordExpires) && util_1.isNullOrUndefined(this.resetPasswordToken)) {
        this.resetPasswordToken = generateSecureToken();
    }
    next();
}
// returns random 64 byte long base64 encoded Token
// maybe this could be shortened
function generateSecureToken() {
    return crypto.randomBytes(64).toString('base64');
}
function removeEmptyUid(next) {
    if (this.uid != null && this.uid.length === 0) {
        this.uid = undefined;
    }
    next();
}
// Pre-save of user to database, hash password if password is modified or new
userSchema.pre('save', hashPassword);
userSchema.pre('save', generateActivationToken);
userSchema.pre('save', generatePasswordResetToken);
userSchema.pre('save', removeEmptyUid);
// TODO: Move shared code of save and findOneAndUpdate hook to one function
userSchema.pre('findOneAndUpdate', function (next) {
    const SALT_FACTOR = 5;
    const newPassword = this.getUpdate().password;
    if (typeof newPassword !== 'undefined') {
        bcrypt.hash(newPassword, SALT_FACTOR)
            .then((hash) => {
            this.findOneAndUpdate({}, { password: hash });
        })
            .then(() => next())
            .catch(next);
    }
    else {
        next();
    }
});
// delete all user data
userSchema.pre('remove', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const localUser = this;
        try {
            const promises = [];
            // notifications
            promises.push(Notification_1.Notification.deleteMany({ user: localUser._id }));
            // notificationsettings
            promises.push(NotificationSettings_1.NotificationSettings.deleteMany({ user: localUser._id }));
            // whitelists
            promises.push(WhitelistUser_1.WhitelistUser.deleteMany({ uid: localUser.uid }));
            // remove user form courses
            promises.push(Course_1.Course.updateMany({ $or: [
                    { students: localUser._id },
                    { teachers: localUser._id }
                ] }, { $pull: {
                    'students': localUser._id,
                    'teachers': localUser._id
                }
            }));
            // progress
            promises.push(Progress_1.Progress.deleteMany({ user: localUser._id }));
            // image
            const path = localUser.profile.picture.path;
            if (path && fs.existsSync(path)) {
                fs.unlinkSync(path);
            }
            yield Promise.all(promises);
        }
        catch (e) {
            throw new Error('Delete Error: ' + e.toString());
        }
    });
});
// Method to compare password for login
userSchema.methods.isValidPassword = function (candidatePassword) {
    if (typeof candidatePassword === 'undefined') {
        candidatePassword = '';
    }
    return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.checkPrivileges = function () {
    return User.checkPrivileges(this);
};
userSchema.methods.checkEditUser = function (targetUser) {
    return User.checkEditUser(this, targetUser);
};
userSchema.methods.checkEditableBy = function (currentUser) {
    return User.checkEditUser(currentUser, this);
};
userSchema.methods.forSafe = function () {
    return User.forSafe(this);
};
userSchema.methods.forTeacher = function () {
    return User.forTeacher(this);
};
userSchema.methods.forCourseView = function () {
    return User.forCourseView(this);
};
userSchema.methods.forUser = function (otherUser) {
    return User.forUser(this, otherUser);
};
userSchema.methods.exportPersonalData = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield this.populate({
            path: 'lastVisitedCourses',
            model: Course_1.Course,
            select: 'name description -_id teachers'
        })
            .execPopulate();
        const lastVisitedCourses = yield Promise.all(this.lastVisitedCourses.map((course) => __awaiter(this, void 0, void 0, function* () {
            return yield course.exportJSON(true, true);
        })));
        const obj = this.toObject();
        obj.lastVisitedCourses = lastVisitedCourses;
        // remove unwanted informations
        // mongo properties
        delete obj._id;
        delete obj.createdAt;
        delete obj.__v;
        delete obj.updatedAt;
        delete obj.id;
        // custom properties
        return obj;
    });
};
userSchema.methods.getCourses = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const localUser = this;
        return Course_1.Course.find({ courseAdmin: localUser._id });
    });
};
// The idea behind the editLevels is to only allow updates if the currentUser "has a higher level" than the target.
// (Or when the currentUser is an admin or targets itself.)
const editLevels = {
    student: 0,
    teacher: 0,
    admin: 2,
};
userSchema.statics.getEditLevel = function (user) {
    return editLevels[user.role];
};
userSchema.statics.getEditLevelUnsafe = function (user) {
    return editLevels[user.role];
};
userSchema.statics.checkPrivileges = function (user) {
    const userIsAdmin = user.role === 'admin';
    const userIsTeacher = user.role === 'teacher';
    const userIsStudent = user.role === 'student';
    // NOTE: The 'tutor' role is currently unused / disabled.
    // const userIsTutor: boolean = user.role === 'tutor';
    const userEditLevel = User.getEditLevel(user);
    return { userIsAdmin, userIsTeacher, userIsStudent, userEditLevel };
};
userSchema.statics.checkEditUser = function (currentUser, targetUser) {
    const _a = User.checkPrivileges(currentUser), { userIsAdmin } = _a, userIs = __rest(_a, ["userIsAdmin"]);
    const currentEditLevel = User.getEditLevel(currentUser);
    const targetEditLevel = User.getEditLevel(targetUser);
    const editSelf = ExtractMongoId_1.extractMongoId(currentUser._id) === ExtractMongoId_1.extractMongoId(targetUser._id);
    const editLevelHigher = currentEditLevel > targetEditLevel;
    // Note that editAllowed only means authorization to edit SOME (herein unspecified) properties.
    // If false, it serves as a definite indicator that absolutely NO edit access is to be granted,
    // but if true, it by itself is not enough information to know what exactly is allowed.
    // (I.e. it DOES NOT mean unrestricted editing capabilties.)
    const editAllowed = userIsAdmin || editSelf || editLevelHigher;
    return Object.assign({ userIsAdmin }, userIs, { currentEditLevel, targetEditLevel,
        editSelf, editLevelHigher,
        editAllowed });
};
userSchema.statics.forSafe = function (user) {
    const { profile: { firstName, lastName } } = user;
    const result = {
        _id: ExtractMongoId_1.extractMongoId(user._id),
        profile: { firstName, lastName }
    };
    const picture = EnsureMongoToObject_1.ensureMongoToObject(user.profile.picture);
    if (Object.keys(picture).length) {
        result.profile.picture = picture;
    }
    return result;
};
userSchema.statics.forTeacher = function (user) {
    const { uid, email } = user;
    return Object.assign({}, User.forSafe(user), { uid, email });
};
userSchema.statics.forCourseView = function (user) {
    const { email } = user;
    return Object.assign({}, User.forSafe(user), { email });
};
userSchema.statics.forUser = function (user, otherUser) {
    const { userIsTeacher, userIsAdmin } = User.checkPrivileges(otherUser);
    const isSelf = ExtractMongoId_1.extractMongoId(user._id) === ExtractMongoId_1.extractMongoId(otherUser._id);
    if (isSelf || userIsAdmin) {
        return EnsureMongoToObject_1.ensureMongoToObject(user);
    }
    else if (userIsTeacher) {
        return User.forTeacher(user);
    }
    else {
        return User.forSafe(user);
    }
};
exports.User = User = mongoose.model('User', userSchema);

//# sourceMappingURL=../../maps/src/models/User.js.map
