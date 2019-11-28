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
let NotificationSettings;
exports.NotificationSettings = NotificationSettings;
const notificationSettingsSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notificationType: {
        type: String
    },
    emailNotification: {
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
notificationSettingsSchema.methods.exportJson = function () {
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
notificationSettingsSchema.methods.forView = function () {
    return {
        course: ExtractMongoId_1.extractSingleMongoId(this.course),
        notificationType: this.notificationType,
        emailNotification: this.emailNotification
    };
};
notificationSettingsSchema.statics.exportPersonalData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        const notificationSettings = yield NotificationSettings
            .findOne({ 'user': user._id }, 'course notificationType emailNotification')
            .populate('course', 'name description -_id');
        if (!notificationSettings) {
            return null;
        }
        const notificatinSettingsObj = notificationSettings.exportJson();
        notificatinSettingsObj.course = yield notificationSettings.course.exportJSON(true, true);
        return notificatinSettingsObj;
    });
};
exports.NotificationSettings = NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);
// Ugly copy of shared/models/INotificationSettings.ts
exports.API_NOTIFICATION_TYPE_ALL_CHANGES = 'allChanges';
exports.API_NOTIFICATION_TYPE_CHANGES_WITH_RELATIONIONSHIP = 'relatedChanges';
exports.API_NOTIFICATION_TYPE_NONE = 'none';
exports.API_NOTIFICATION_TYPES = [
    exports.API_NOTIFICATION_TYPE_NONE,
    exports.API_NOTIFICATION_TYPE_CHANGES_WITH_RELATIONIONSHIP,
    exports.API_NOTIFICATION_TYPE_ALL_CHANGES
];

//# sourceMappingURL=../../maps/src/models/NotificationSettings.js.map
