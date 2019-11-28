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
const ExtractMongoId_1 = require("../utilities/ExtractMongoId");
let Notification;
exports.Notification = Notification;
const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    changedCourse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    changedLecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture'
    },
    changedUnit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    text: {
        required: true,
        type: String
    },
    isOld: {
        type: Boolean
    }
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = ret._id.toString();
        }
    }
});
notificationSchema.methods.exportJSON = function () {
    const obj = this.toObject();
    // remove unwanted informations
    // mongo properties
    delete obj._id;
    delete obj.createdAt;
    delete obj.__v;
    delete obj.updatedAt;
    // custom properties
    return obj;
};
notificationSchema.methods.forView = function () {
    return {
        _id: ExtractMongoId_1.extractSingleMongoId(this),
        changedCourse: ExtractMongoId_1.extractSingleMongoId(this.changedCourse),
        changedLecture: ExtractMongoId_1.extractSingleMongoId(this.changedLecture),
        changedUnit: ExtractMongoId_1.extractSingleMongoId(this.changedUnit),
        text: this.text,
        isOld: this.isOld
    };
};
notificationSchema.statics.exportPersonalData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield Notification.find({ 'user': user._id }, 'text'))
            .map(not => not.exportJSON());
    });
};
exports.Notification = Notification = mongoose.model('Notification', notificationSchema);

//# sourceMappingURL=../../maps/src/models/Notification.js.map
