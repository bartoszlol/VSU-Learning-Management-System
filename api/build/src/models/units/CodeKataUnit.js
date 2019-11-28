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
const routing_controllers_1 = require("routing-controllers");
const MarkdownIt = require('markdown-it');
const codeKataSchema = new mongoose.Schema({
    definition: {
        type: String,
        required: [true, 'A Kata must contain a definition area']
    },
    code: {
        type: String,
        required: [true, 'A Kata must contain a code area']
    },
    test: {
        type: String,
        required: [true, 'A Kata must contain a test area']
    },
    deadline: {
        type: String
    },
});
exports.codeKataSchema = codeKataSchema;
codeKataSchema.methods.secureData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        if (user.role === 'student') {
            this.code = null;
        }
        return this;
    });
};
function splitCodeAreas(next) {
    const codeKataUnit = this;
    if (codeKataUnit.definition !== undefined || codeKataUnit.test !== undefined || codeKataUnit.code === undefined) {
        return next();
    }
    const separator = '\/\/#+';
    const firstSeparator = findFirstIndexOf(codeKataUnit.code, separator);
    const lastSeparator = findLastIndexOf(codeKataUnit.code, separator);
    codeKataUnit.definition = codeKataUnit.code.substring(0, firstSeparator).trim();
    codeKataUnit.test = codeKataUnit.code.substring(lastSeparator, codeKataUnit.code.length).trim();
    codeKataUnit.code = codeKataUnit.code.substring(firstSeparator, lastSeparator).trim();
    codeKataUnit.code = codeKataUnit.code.slice(codeKataUnit.code.search('\n')).trim();
    codeKataUnit.test = codeKataUnit.test.slice(codeKataUnit.test.search('\n')).trim();
    next();
}
function findFirstIndexOf(source, value) {
    return source.search(value);
}
function findLastIndexOf(source, value) {
    const regex = new RegExp(value, '');
    let i = -1;
    // limit execution time (prevent deadlocks)
    let j = 10;
    while (j > 0) {
        j--;
        const result = regex.exec(source.slice(++i));
        if (result != null) {
            i += result.index;
        }
        else {
            i--;
            break;
        }
    }
    return i;
}
function validateTestArea(testArea) {
    if (!testArea.match(new RegExp('function(.|\t)*validate\\(\\)(.|\n|\t)*{(.|\n|\t)*}', 'gmi'))) {
        throw new routing_controllers_1.BadRequestError('The test section must contain a validate function');
    }
    if (!testArea.match(new RegExp('function(.|\t)*validate\\(\\)(.|\n|\t)*{(.|\n|\t)*return(.|\n|\t)*}', 'gmi'))) {
        throw new routing_controllers_1.BadRequestError('The validate function must return something');
    }
    if (!testArea.match(new RegExp('validate\\(\\);', 'gmi'))) {
        throw new routing_controllers_1.BadRequestError('The test section must call the validate function');
    }
    return true;
}
codeKataSchema.pre('validate', splitCodeAreas);
codeKataSchema.path('test').validate(validateTestArea);
codeKataSchema.methods.toHtmlForIndividualPDF = function () {
    const md = new MarkdownIt({ html: true });
    let html = '<div id="pageHeader">'
        + md.render(this.name ? this.name : '') + md.render(this.description ? this.description : '') + '</div>';
    html += '<div id="firstPage" class="bottomBoxWrapper">';
    html += '<h5>Task</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.definition ? this.definition : '') + '</div>') + '</div>';
    html += '<h5>Code</h5>';
    html += '<div class="bottomBox"><h3>Validation</h3>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.test ? this.test : '') + '</div>') + '</div>';
    html += '</div>';
    html += '</div ><div><h2>Solution</h2></div>';
    html += '<h5>Task</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.definition ? this.definition : '') + '</div>') + '</div>';
    html += '<h5>Code</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.code ? this.code : '') + '</div>') + '</div>';
    html += '<h5>Validation</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.test ? this.test : '') + '</div>') + '</div>';
    return html;
};
codeKataSchema.methods.toHtmlForSinglePDF = function () {
    const md = new MarkdownIt({ html: true });
    let html = '<div class="bottomBoxWrapper">';
    html += '<div><h4>' + md.render(this.name ? 'Unit: ' + this.name : '') + '</h4>'
        + '<span>' + md.render(this.description ? 'Description: ' + this.description : '') + '</span></div>';
    html += '<h5>Task</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.definition ? this.definition : '') + '</div>') + '</div>';
    html += '<h5>Code</h5>';
    html += '<div class="bottomBox"><h5>Validation</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.test ? this.test : '') + '</div>') + '</div>';
    html += '</div></div>';
    return html;
};
codeKataSchema.methods.toHtmlForSinglePDFSolutions = function () {
    const md = new MarkdownIt({ html: true });
    let html = '';
    html += '<div><h4>' + md.render(this.name ? this.name : '') + '</h4></div>';
    html += '<h5>Task</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.definition ? this.definition : '') + '</div>') + '</div>';
    html += '<h5>Code</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.code ? this.code : '') + '</div>') + '</div>';
    html += '<h5>Validation</h5>';
    html += '<div>' + md.render('<div class="codeBox">' + md.render(this.test ? this.test : '') + '</div>') + '</div>';
    return html;
};

//# sourceMappingURL=../../../maps/src/models/units/CodeKataUnit.js.map
