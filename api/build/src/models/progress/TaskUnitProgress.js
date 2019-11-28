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
const Unit_1 = require("../units/Unit");
const taskUnitProgressSchema = new mongoose.Schema({
    answers: {
        type: {},
        required: true,
    }
});
exports.taskUnitProgressSchema = taskUnitProgressSchema;
taskUnitProgressSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const localProg = this;
        const taskUnit = yield Unit_1.Unit.findById(localProg.unit);
        localProg.done = true;
        taskUnit.tasks.forEach(question => {
            question.answers.forEach(answer => {
                if (
                // !! is necessary, because value can be undefined
                !localProg.answers[question._id.toString()] ||
                    localProg.answers[question._id.toString()][answer._id.toString()] !== !!answer.value) {
                    localProg.done = false;
                }
            });
        });
        next();
    });
});
taskUnitProgressSchema.methods.exportJSON = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const localProg = this;
        if (localProg.unit) {
            const taskUnit = yield Unit_1.Unit.findById(localProg.unit);
            taskUnit.tasks.forEach(question => {
                delete question._id;
                this.answers = question;
            });
        }
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

//# sourceMappingURL=../../../maps/src/models/progress/TaskUnitProgress.js.map
