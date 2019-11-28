"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const Progress_1 = require("../progress/Progress");
const routing_controllers_1 = require("routing-controllers");
const Lecture_1 = require("../Lecture");
const FreeTextUnit_1 = require("./FreeTextUnit");
const CodeKataUnit_1 = require("./CodeKataUnit");
const FileUnit_1 = require("./FileUnit");
const TaskUnit_1 = require("./TaskUnit");
const AssignmentUnit_1 = require("./AssignmentUnit");
const User_1 = require("../User");
const ChatRoom_1 = require("../ChatRoom");
const unitSchema = new mongoose.Schema({
    _course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    progressable: {
        type: Boolean
    },
    weight: {
        type: Number
    },
    type: {
        type: String
    },
    visible: {
        type: Boolean,
        default: false,
    },
    unitCreator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom'
    }
}, {
    collection: 'units',
    timestamps: true,
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            if (ret._id) {
                ret._id = ret._id.toString();
            }
            if (ret._course) {
                ret._course = ret._course.toString();
            }
            if (ret.hasOwnProperty('chatRoom') && ret.chatRoom) {
                ret.chatRoom = ret.chatRoom.toString();
            }
        }
    },
});
unitSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const unit = this;
        if (this.isNew) {
            const chatRoom = yield ChatRoom_1.ChatRoom.create({
                room: {
                    roomType: 'Unit',
                    roomFor: unit
                }
            });
            unit.chatRoom = chatRoom._id;
        }
    });
});
unitSchema.virtual('progressData', {
    ref: 'Progress',
    localField: '_id',
    foreignField: 'unit',
    justOne: true
});
unitSchema.methods.exportJSON = function (onlyBasicData = false) {
    const obj = this.toObject();
    // remove unwanted informations
    // mongo properties
    delete obj._id;
    delete obj.createdAt;
    delete obj.__v;
    delete obj.updatedAt;
    delete obj.unitCreator;
    delete obj.files;
    // custom properties
    delete obj._course;
    if (onlyBasicData) {
        delete obj.id;
        delete obj.progressData;
    }
    return obj;
};
unitSchema.methods.calculateProgress = function () {
    return __awaiter(this, void 0, void 0, function* () {
        return this.toObject();
    });
};
unitSchema.methods.populateUnit = function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.unitCreator) {
            this.unitCreator = yield User_1.User.findById(this.unitCreator);
        }
        return this;
    });
};
unitSchema.methods.secureData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.unitCreator) {
            this.unitCreator = User_1.User.forSafe(this.unitCreator);
        }
        return this;
    });
};
unitSchema.methods.toFile = function () {
    return '';
};
unitSchema.statics.importJSON = function (unit, courseId, lectureId) {
    return __awaiter(this, void 0, void 0, function* () {
        unit._course = courseId;
        try {
            // Need to disabled this rule because we can't export 'Unit' BEFORE this function-declaration
            // tslint:disable:no-use-before-declare
            const savedUnit = yield Unit.create(unit);
            const lecture = yield Lecture_1.Lecture.findById(lectureId);
            lecture.units.push(savedUnit);
            yield lecture.save();
            return savedUnit.toObject();
            // tslint:enable:no-use-before-declare
        }
        catch (err) {
            const newError = new routing_controllers_1.InternalServerError('Failed to import unit of type ' + unit.__t);
            newError.stack += '\nCaused by: ' + err.message + '\n' + err.stack;
            throw newError;
        }
    });
};
// Cascade delete
unitSchema.pre('remove', function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield Progress_1.Progress.remove({ 'unit': this._id }).exec();
        }
        catch (err) {
            throw new Error('Delete Error: ' + err.toString());
        }
    });
});
const Unit = mongoose.model('Unit', unitSchema);
exports.Unit = Unit;
const FreeTextUnit = Unit.discriminator('free-text', FreeTextUnit_1.freeTextUnitSchema);
exports.FreeTextUnit = FreeTextUnit;
const CodeKataUnit = Unit.discriminator('code-kata', CodeKataUnit_1.codeKataSchema);
exports.CodeKataUnit = CodeKataUnit;
const FileUnit = Unit.discriminator('file', FileUnit_1.fileUnitSchema);
exports.FileUnit = FileUnit;
const TaskUnit = Unit.discriminator('task', TaskUnit_1.taskUnitSchema);
exports.TaskUnit = TaskUnit;
const AssignmentUnit = Unit.discriminator('assignment', AssignmentUnit_1.assignmentsSchema);
exports.AssignmentUnit = AssignmentUnit;

//# sourceMappingURL=../../../maps/src/models/units/Unit.js.map
