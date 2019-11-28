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
const MarkdownIt = require('markdown-it');
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
            if (ret.hasOwnProperty('_id') && ret._id !== null) {
                ret._id = ret._id.toString();
            }
            if (ret.hasOwnProperty('id') && ret.id !== null) {
                ret.id = ret.id.toString();
            }
            ret.answers = ret.answers.map((answer) => {
                answer._id = answer._id.toString();
                return answer;
            });
        }
    }
});
const taskUnitSchema = new mongoose.Schema({
    tasks: [taskSchema],
    deadline: {
        type: String
    },
});
exports.taskUnitSchema = taskUnitSchema;
taskUnitSchema.methods.calculateProgress = function (users, progress) {
    return __awaiter(this, void 0, void 0, function* () {
        const unitObj = this.toObject();
        const progressStats = [];
        unitObj.tasks.forEach((question) => {
            const questionStats = {
                name: question.name,
                series: [{
                        name: 'correct',
                        value: 0
                    },
                    {
                        name: 'wrong',
                        value: 0
                    },
                    {
                        name: 'no data',
                        value: users.length
                    }]
            };
            progress.forEach((userProgress) => {
                let correctedAnswered = true;
                question.answers.forEach((answer) => {
                    if (!userProgress.answers[question._id.toString()] ||
                        userProgress.answers[question._id.toString()][answer._id.toString()] !== !!answer.value) {
                        correctedAnswered = false;
                    }
                });
                if (correctedAnswered) {
                    questionStats.series[0].value++;
                }
                else {
                    questionStats.series[1].value++;
                }
                questionStats.series[2].value--;
            });
            progressStats.push(questionStats);
        });
        unitObj.progressData = progressStats;
        return unitObj;
    });
};
taskUnitSchema.methods.toHtmlForIndividualPDF = function () {
    const md = new MarkdownIt({ html: true });
    let html = '<div id="pageHeader" >'
        + md.render(this.name ? this.name : '') + md.render(this.description ? this.description : '') + '</div>';
    let counter = 1;
    html += '<div id="firstPage">';
    for (const task of this.tasks) {
        html += '<div><h5>' + task.name ? md.render(counter + '. ' + task.name) : '' + '</h5></div>';
        counter++;
        for (const answer of task.answers) {
            html += '<div>' + answer.text ? md.render('<input type="checkbox" style="margin-right: 10px">' + answer.text) : '' + '</div>';
        }
    }
    html += '</div><div><h2>Solution</h2></div>';
    counter = 1;
    for (const task of this.tasks) {
        html += '<div><h5>' + task.name ? md.render(counter + '. ' + task.name) : '' + '</h5></div>';
        counter++;
        for (const answer of task.answers) {
            let checked = '';
            if (answer.value === true) {
                checked = 'checked';
            }
            html += '<div>' + answer.text ? md.render('<input type="checkbox" style="margin-right: 10px;" ' + checked + '>' + answer.text) : ''
                + '</div>';
        }
    }
    return html;
};
taskUnitSchema.methods.toHtmlForSinglePDF = function () {
    const md = new MarkdownIt({ html: true });
    let html = '';
    html += '<div><h4>' + md.render(this.name ? 'Unit: ' + this.name : '') + '</h4>'
        + '<span>' + md.render(this.description ? 'Description: ' + this.description : '') + '</span></div>';
    let counter = 1;
    for (const task of this.tasks) {
        html += '<div><h5>' + task.name ? md.render(counter + '. ' + task.name) : '' + '</h5></div>';
        counter++;
        for (const answer of task.answers) {
            html += '<div>' + answer.text ? md.render('<input type="checkbox" style="margin-right: 10px">' + answer.text) : '' + '</div>';
        }
    }
    return html;
};
taskUnitSchema.methods.toHtmlForSinglePDFSolutions = function () {
    const md = new MarkdownIt({ html: true });
    let html = '';
    html += '<div><h4>' + md.render(this.name ? 'Unit: ' + this.name : '') + '</h4></div>';
    let counter = 1;
    for (const task of this.tasks) {
        html += '<div><h5>' + task.name ? md.render(counter + '. ' + task.name) : '' + '</h5></div>';
        counter++;
        for (const answer of task.answers) {
            let checked = '';
            if (answer.value === true) {
                checked = 'checked';
            }
            html += '<div>' + answer.text ? md.render('<input type="checkbox" style="margin-right: 10px;" ' + checked + '>' + answer.text) : ''
                + '</div>';
        }
    }
    return html;
};

//# sourceMappingURL=../../../maps/src/models/units/TaskUnit.js.map
