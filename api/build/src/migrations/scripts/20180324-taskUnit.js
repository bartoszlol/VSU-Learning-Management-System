"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// tslint:disable:no-console
const mongoose = require("mongoose");
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
    }
}, {
    collection: 'units',
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = doc._id.toString();
            ret._course = ret._course.toString();
        }
    },
});
const Unit = mongoose.model('OldUnitForTask', unitSchema);
const taskSchema = new mongoose.Schema({
    name: {
        type: String
    },
    unitId: {
        type: String
    },
    answers: {
        type: [{
                value: Boolean,
                text: String
            }],
        required: true
    },
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            if (ret.hasOwnProperty('_id')) {
                ret._id = ret._id.toString();
            }
            if (ret.hasOwnProperty('id')) {
                ret.id = ret.id.toString();
            }
            ret.answers = ret.answers.map((answer) => {
                answer._id = answer._id.toString();
                return answer;
            });
        }
    }
});
const Task = mongoose.model('Task', taskSchema);
class TaskUnitMigration {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('TaskUnit up was called');
            try {
                const oldUnits = yield Unit.find({ '__t': 'task' });
                const updatedUnitObjs = yield Promise.all(oldUnits.map((oldUnit) => __awaiter(this, void 0, void 0, function* () {
                    const oldUnitObj = oldUnit.toObject();
                    oldUnitObj.tasks = (yield Promise.all(oldUnitObj.tasks.map((task) => __awaiter(this, void 0, void 0, function* () {
                        if (task instanceof mongoose.Types.ObjectId) {
                            const taskData = yield Task.findById(task).exec();
                            if (taskData === null) {
                                return null;
                            }
                            return taskData.toObject();
                        }
                        else {
                            return task;
                        }
                    }))));
                    return oldUnitObj;
                })));
                const updatedUnits = yield Promise.all(oldUnits.map((oldUnit) => __awaiter(this, void 0, void 0, function* () {
                    const updatedUnitObj = updatedUnitObjs.find((updatedUnit) => {
                        return updatedUnit._id === oldUnit._id.toString();
                    });
                    updatedUnitObj._id = mongoose.Types.ObjectId(updatedUnitObj._id);
                    const unitAfterReplace = yield mongoose.connection.collection('units')
                        .findOneAndReplace({ '_id': oldUnit._id }, updatedUnitObj);
                })));
            }
            catch (error) {
                console.log('1: ' + error);
            }
            console.log('TaskUnit documents successfully migrated!');
            return true;
        });
    }
    down() {
        console.log('TaskUnit down was called');
    }
}
module.exports = TaskUnitMigration;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20180324-taskUnit.js.map
