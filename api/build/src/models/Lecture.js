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
const Unit_1 = require("./units/Unit");
const routing_controllers_1 = require("routing-controllers");
const Course_1 = require("./Course");
const lectureSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    units: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Unit'
        }
    ]
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = ret._id.toString();
        }
    }
});
// Cascade delete
lectureSchema.pre('remove', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const localLecture = this;
        try {
            yield Unit_1.Unit.deleteMany({ '_id': { $in: localLecture.units } }).exec();
        }
        catch (err) {
            throw new Error('Delete Error: ' + err.toString());
        }
    });
});
lectureSchema.methods.exportJSON = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const obj = this.toObject();
        // remove unwanted informations
        // mongo properties
        delete obj._id;
        delete obj.createdAt;
        delete obj.__v;
        delete obj.updatedAt;
        // "populate" lectures
        const units = obj.units;
        obj.units = [];
        for (const unitId of units) {
            const unit = yield Unit_1.Unit.findById(unitId);
            if (unit) {
                const unitExport = yield unit.exportJSON();
                obj.units.push(unitExport);
            }
        }
        return obj;
    });
};
lectureSchema.methods.processUnitsFor = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        this.units = yield Promise.all(this.units.map((unit) => __awaiter(this, void 0, void 0, function* () {
            unit = yield unit.populateUnit();
            return unit.secureData(user);
        })));
        return this;
    });
};
lectureSchema.statics.importJSON = function (lecture, courseId) {
    return __awaiter(this, void 0, void 0, function* () {
        // importTest lectures
        const units = lecture.units;
        lecture.units = [];
        try {
            // Need to disabled this rule because we can't export 'Lecture' BEFORE this function-declaration
            // tslint:disable:no-use-before-declare
            const savedLecture = yield new Lecture(lecture).save();
            const course = yield Course_1.Course.findById(courseId);
            course.lectures.push(savedLecture);
            yield course.save();
            for (const unit of units) {
                yield Unit_1.Unit.schema.statics.importJSON(unit, courseId, savedLecture._id);
            }
            const newLecture = yield Lecture.findById(savedLecture._id);
            return newLecture.toObject();
            // tslint:enable:no-use-before-declare
        }
        catch (err) {
            const newError = new routing_controllers_1.InternalServerError('Failed to import lecture');
            newError.stack += '\nCaused by: ' + err.message + '\n' + err.stack;
            throw newError;
        }
    });
};
const Lecture = mongoose.model('Lecture', lectureSchema);
exports.Lecture = Lecture;

//# sourceMappingURL=../../maps/src/models/Lecture.js.map
