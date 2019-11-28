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
let WhitelistUser;
exports.WhitelistUser = WhitelistUser;
const whitelistUserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        index: true
    },
    lastName: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        index: true
    },
    uid: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }
}, {
    timestamps: true,
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            ret._id = ret._id.toString();
        }
    }
});
// Prevent duplicates in one course.
whitelistUserSchema.index({ uid: 1, courseId: 1 }, { unique: true });
whitelistUserSchema.methods.exportJSON = function () {
    const obj = this.toObject();
    // remove unwanted informations
    // mongo properties
    delete obj._id;
    delete obj.createdAt;
    delete obj.__v;
    delete obj.updatedAt;
    // custom properties
    delete obj.id;
    return obj;
};
whitelistUserSchema.statics.exportPersonalData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.all((yield WhitelistUser.find({ uid: user.uid })
            .populate('courseId', 'name description -_id'))
            .map((whiteListU) => __awaiter(this, void 0, void 0, function* () {
            const course = yield whiteListU.courseId.exportJSON(true, true);
            const whiteListObj = whiteListU.exportJSON();
            whiteListObj.courseId = course;
            return whiteListObj;
        })));
    });
};
exports.WhitelistUser = WhitelistUser = mongoose.model('WhitelistUser', whitelistUserSchema);

//# sourceMappingURL=../../maps/src/models/WhitelistUser.js.map
