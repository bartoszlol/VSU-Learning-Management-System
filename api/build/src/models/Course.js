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
const User_1 = require("./User");
const Lecture_1 = require("./Lecture");
const routing_controllers_1 = require("routing-controllers");
const Directory_1 = require("./mediaManager/Directory");
const ExtractMongoId_1 = require("../utilities/ExtractMongoId");
const ChatRoom_1 = require("./ChatRoom");
const File_1 = require("./mediaManager/File");
let Course;
exports.Course = Course;
const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    active: {
        type: Boolean
    },
    description: {
        type: String
    },
    courseAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    media: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Directory'
    },
    teachers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    lectures: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lecture'
        }
    ],
    accessKey: {
        type: String
    },
    enrollType: {
        type: String,
        enum: ['free', 'whitelist', 'accesskey'],
        default: 'free'
    },
    whitelist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WhitelistUser'
        }
    ],
    image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Picture'
    },
    chatRooms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatRoom'
        }
    ],
    freeTextStyle: {
        type: String,
        enum: ['', 'theme1', 'theme2', 'theme3', 'theme4'],
        default: ''
    },
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret, { currentUser }) {
            if (ret.hasOwnProperty('_id') && ret._id !== null) {
                ret._id = ret._id.toString();
            }
            ret.courseAdmin = ExtractMongoId_1.extractSingleMongoId(ret.courseAdmin);
            ret.hasAccessKey = false;
            if (ret.accessKey) {
                ret.hasAccessKey = true;
            }
            if (currentUser !== undefined) {
                if (doc.populated('teachers') !== undefined) {
                    ret.teachers = doc.teachers.map((user) => user.forUser(currentUser));
                }
                if (doc.populated('students') !== undefined) {
                    ret.students = doc.students.map((user) => user.forUser(currentUser));
                }
            }
            if (ret.chatRooms) {
                ret.chatRooms = ret.chatRooms.map(ExtractMongoId_1.extractSingleMongoId);
            }
        }
    }
});
courseSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const course = this;
        if (this.isNew) {
            const chatRoom = yield ChatRoom_1.ChatRoom.create({
                name: 'General',
                description: 'This is a general chat for the course ' + course.name,
                room: {
                    roomType: 'Course',
                    roomFor: course
                }
            });
            course.chatRooms.push(chatRoom._id);
            Object.assign(this, course);
        }
    });
});
// Cascade delete
courseSchema.pre('remove', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const localCourse = this;
        try {
            const dic = yield Directory_1.Directory.findById(localCourse.media);
            if (dic) {
                yield dic.remove();
            }
            for (const lec of localCourse.lectures) {
                const lecDoc = yield Lecture_1.Lecture.findById(lec);
                yield lecDoc.remove();
            }
            if (localCourse.image) {
                const picture = yield File_1.Picture.findById(localCourse.image);
                yield picture.remove();
            }
        }
        catch (error) {
            throw new Error('Delete Error: ' + error.toString());
        }
    });
});
courseSchema.methods.exportJSON = function (sanitize = true, onlyBasicData = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const obj = this.toObject();
        // remove unwanted informations
        // mongo properties
        delete obj._id;
        delete obj.createdAt;
        delete obj.__v;
        delete obj.updatedAt;
        // custom properties
        if (sanitize) {
            delete obj.accessKey;
            delete obj.active;
            delete obj.whitelist;
            delete obj.students;
            delete obj.courseAdmin;
            delete obj.teachers;
            delete obj.media;
            delete obj.chatRooms;
            delete obj.freeTextStyle;
        }
        if (onlyBasicData) {
            delete obj.id;
            delete obj.hasAccessKey;
            return obj;
        }
        // "populate" lectures
        const lectures = obj.lectures;
        obj.lectures = [];
        for (const lectureId of lectures) {
            const lecture = yield Lecture_1.Lecture.findById(lectureId);
            if (lecture) {
                const lectureExport = yield lecture.exportJSON();
                obj.lectures.push(lectureExport);
            }
        }
        if (obj.image) {
            const imageId = obj.image;
            obj.image = yield File_1.Picture.findById(imageId);
        }
        return obj;
    });
};
courseSchema.statics.importJSON = function (course, admin, active) {
    return __awaiter(this, void 0, void 0, function* () {
        // set Admin
        course.courseAdmin = admin;
        // course shouldn't be visible for students after import
        // until active flag is explicitly set (e.g. fixtures)
        course.active = (active === true);
        // importTest lectures
        const lectures = course.lectures;
        course.lectures = [];
        try {
            // Need to disabled this rule because we can't export 'Course' BEFORE this function-declaration
            // tslint:disable:no-use-before-declare
            const origName = course.name;
            let isCourseDuplicated = false;
            let i = 0;
            do {
                // 1. Duplicate -> 'name (copy)', 2. Duplicate -> 'name (copy 2)', 3. Duplicate -> 'name (copy 3)', ...
                course.name = origName + ((i > 0) ? ' (copy' + ((i > 1) ? ' ' + i : '') + ')' : '');
                isCourseDuplicated = (yield Course.findOne({ name: course.name })) !== null;
                i++;
            } while (isCourseDuplicated);
            const savedCourse = yield new Course(course).save();
            for (const lecture of lectures) {
                yield Lecture_1.Lecture.schema.statics.importJSON(lecture, savedCourse._id);
            }
            const newCourse = yield Course.findById(savedCourse._id);
            return newCourse.toObject();
            // tslint:enable:no-use-before-declare
        }
        catch (err) {
            const newError = new routing_controllers_1.InternalServerError('Failed to import course');
            newError.stack += '\nCaused by: ' + err.message + '\n' + err.stack;
            throw newError;
        }
    });
};
courseSchema.statics.exportPersonalData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        const conditions = {};
        conditions.$or = [];
        conditions.$or.push({ students: user._id });
        conditions.$or.push({ teachers: user._id });
        conditions.$or.push({ courseAdmin: user._id });
        const courses = yield Course.find(conditions, 'name description -_id');
        return Promise.all(courses.map((course) => __awaiter(this, void 0, void 0, function* () {
            return yield course.exportJSON(true, true);
        })));
    });
};
courseSchema.statics.changeCourseAdminFromUser = function (userFrom, userTo) {
    return __awaiter(this, void 0, void 0, function* () {
        return Course.updateMany({ courseAdmin: userFrom._id }, { courseAdmin: userTo._id });
    });
};
courseSchema.methods.checkPrivileges = function (user) {
    const _a = User_1.User.checkPrivileges(user), { userIsAdmin } = _a, userIs = __rest(_a, ["userIsAdmin"]);
    const userId = ExtractMongoId_1.extractSingleMongoId(user);
    const courseAdminId = ExtractMongoId_1.extractSingleMongoId(this.courseAdmin);
    const userIsCourseAdmin = userId === courseAdminId;
    const userIsCourseTeacher = this.teachers.some((teacher) => userId === ExtractMongoId_1.extractSingleMongoId(teacher));
    const userIsCourseStudent = this.students.some((student) => userId === ExtractMongoId_1.extractSingleMongoId(student));
    const userIsCourseMember = userIsCourseAdmin || userIsCourseTeacher || userIsCourseStudent;
    const userCanEditCourse = userIsAdmin || userIsCourseAdmin || userIsCourseTeacher;
    const userCanViewCourse = (this.active && userIsCourseStudent) || userCanEditCourse;
    return Object.assign({ userIsAdmin }, userIs, { courseAdminId,
        userIsCourseAdmin, userIsCourseTeacher, userIsCourseStudent, userIsCourseMember,
        userCanEditCourse, userCanViewCourse });
};
/**
 * Modifies the Course data to be used by the courses dashboard.
 *
 * @param {IUser} user
 * @returns {Promise<ICourseDashboard>}
 */
courseSchema.methods.forDashboard = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, active, description, enrollType } = this;
        const picture = yield File_1.Picture.findById(this.image);
        const image = picture && picture.toObject();
        const { userCanEditCourse, userCanViewCourse, userIsCourseAdmin, userIsCourseTeacher, userIsCourseMember } = this.checkPrivileges(user);
        return {
            // As in ICourse:
            _id: ExtractMongoId_1.extractSingleMongoId(this),
            name, active, description, enrollType, image,
            // Special properties for the dashboard:
            userCanEditCourse, userCanViewCourse, userIsCourseAdmin, userIsCourseTeacher, userIsCourseMember
        };
    });
};
courseSchema.methods.forView = function (user) {
    const { name, description, courseAdmin, teachers, lectures, chatRooms, freeTextStyle, active } = this;
    const userCanEditCourse = this.checkPrivileges(user).userCanEditCourse;
    return {
        _id: ExtractMongoId_1.extractSingleMongoId(this),
        name, description,
        active,
        courseAdmin: User_1.User.forCourseView(courseAdmin),
        teachers: teachers.map((teacher) => User_1.User.forCourseView(teacher)),
        lectures: lectures.map((lecture) => lecture.toObject()),
        chatRooms: chatRooms.map(ExtractMongoId_1.extractSingleMongoId),
        freeTextStyle,
        userCanEditCourse
    };
};
courseSchema.methods.populateLecturesFor = function (user) {
    const isTeacherOrAdmin = (user.role === 'teacher' || user.role === 'admin');
    return this.populate({
        path: 'lectures',
        populate: {
            path: 'units',
            virtuals: true,
            match: { $or: [{ visible: undefined }, { visible: true }, { visible: !isTeacherOrAdmin }] },
            populate: {
                path: 'progressData',
                match: { user: { $eq: user._id } }
            }
        }
    });
};
courseSchema.methods.processLecturesFor = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        this.lectures = yield Promise.all(this.lectures.map((lecture) => __awaiter(this, void 0, void 0, function* () {
            return yield lecture.processUnitsFor(user);
        })));
        return this;
    });
};
exports.Course = Course = mongoose.model('Course', courseSchema);

//# sourceMappingURL=../../maps/src/models/Course.js.map
