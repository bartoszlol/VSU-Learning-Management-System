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
const File_1 = require("../mediaManager/File");
const User_1 = require("../User");
const assignmentsSchema = new mongoose.Schema({
    assignments: [{
            files: [{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'File'
                }],
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            submitted: {
                type: Boolean
            },
            checked: {
                type: Number
            },
            submittedDate: {
                type: Date
            }
        }],
    deadline: {
        type: String
    }
});
exports.assignmentsSchema = assignmentsSchema;
assignmentsSchema.pre('save', function () {
    const localUnit = this;
    if (localUnit.assignments === null) {
        localUnit.assignments = [];
    }
});
assignmentsSchema.methods.secureData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.assignments.length) {
            if (user.role === 'student') {
                let assignmentToUse;
                for (const assignment of this.assignments) {
                    if (assignment.user._id.toString() === user._id) {
                        assignmentToUse = assignment;
                        if (assignmentToUse.files) {
                            assignmentToUse.files = yield Promise.all(assignmentToUse.files.map((file) => __awaiter(this, void 0, void 0, function* () {
                                return yield File_1.File.findById(file);
                            })));
                        }
                    }
                }
                this.assignments = [];
                if (assignmentToUse) {
                    this.assignments.push(assignmentToUse);
                }
            }
            else {
                for (const assignment of this.assignments) {
                    assignment.files = yield Promise.all(assignment.files.map((file) => __awaiter(this, void 0, void 0, function* () {
                        return yield File_1.File.findById(file);
                    })));
                    assignment.user = yield User_1.User.findById(assignment.user._id);
                }
            }
        }
        return this;
    });
};

//# sourceMappingURL=../../../maps/src/models/units/AssignmentUnit.js.map
