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
const CodeKataProgress_1 = require("./CodeKataProgress");
const TaskUnitProgress_1 = require("./TaskUnitProgress");
let Progress;
exports.Progress = Progress;
const progressSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    done: {
        type: Boolean
    },
    type: {
        type: String
    }
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = ret._id.toString();
            if (!doc.populated('course') && ret.course) {
                ret.course = ret.course.toString();
            }
            if (!doc.populated('user') && ret.user) {
                ret.user = ret.user.toString();
            }
            if (!doc.populated('unit') && ret.unit) {
                ret.unit = ret.unit.toString();
            }
        }
    }
});
progressSchema.methods.exportJSON = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const obj = this.toObject();
        // remove unwanted informations
        // mongo properties
        delete obj._id;
        delete obj.createdAt;
        delete obj.__v;
        delete obj.updatedAt;
        // custom properties
        return obj;
    });
};
progressSchema.statics.exportPersonalUserData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        const userProgress = yield Progress.find({ 'user': user._id }, '-user')
            .populate('course', 'name description')
            .populate('unit', 'name description');
        return Promise.all(userProgress.map((prog) => __awaiter(this, void 0, void 0, function* () {
            let progExport;
            switch (prog.__t) {
                case 'task-unit-progress':
                    progExport = yield prog.exportJSON();
                    break;
                default:
                    progExport = yield prog.exportJSON();
            }
            progExport.course = yield prog.course.exportJSON(true, true);
            progExport.unit = yield prog.unit.exportJSON(true);
            return progExport;
        })));
    });
};
exports.Progress = Progress = mongoose.model('Progress', progressSchema);
const CodeKataProgress = Progress.discriminator('codeKata', CodeKataProgress_1.codeKataProgressSchema);
const TaskUnitProgress = Progress.discriminator('task-unit-progress', TaskUnitProgress_1.taskUnitProgressSchema);

//# sourceMappingURL=../../../maps/src/models/progress/Progress.js.map
