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
const MarkdownIt = require("markdown-it");
const markdownItEmoji = require('markdown-it-emoji');
const MarkdownItDeflist = require('markdown-it-deflist');
const MarkdownItContainer = require('markdown-it-container');
const MarkdownItMark = require('markdown-it-mark');
const MarkdownItAbbr = require('markdown-it-abbr');
const hljs = require('highlight.js');
const md = new MarkdownIt({
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str).value;
            }
            catch (e) {
                console.error(e);
            }
        }
        return ''; // use external default escaping
    }
});
// load MD plugins
md.use(markdownItEmoji);
md.use(MarkdownItDeflist);
// register warning, info, error, success as custom containers
md.use(MarkdownItContainer, 'warning');
md.use(MarkdownItContainer, 'info');
md.use(MarkdownItContainer, 'error');
md.use(MarkdownItContainer, 'success');
md.use(MarkdownItContainer, 'learning-objectives');
md.use(MarkdownItContainer, 'hints');
md.use(MarkdownItContainer, 'assignment');
md.use(MarkdownItContainer, 'question');
md.use(MarkdownItContainer, 'example');
md.use(MarkdownItContainer, 'todo');
md.use(MarkdownItMark);
md.use(MarkdownItAbbr);
const freeTextUnitSchema = new mongoose.Schema({
    markdown: {
        type: String,
    }
});
exports.freeTextUnitSchema = freeTextUnitSchema;
freeTextUnitSchema.methods.getTheme = function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield this.populate('_course', 'freeTextStyle').execPopulate();
        return this._course.freeTextStyle;
    });
};
freeTextUnitSchema.methods.toHtmlForIndividualPDF = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const theme = yield this.getTheme();
        let html = '<div id="pageHeader" style="text-align: center;border-bottom: 1px solid">'
            + md.render(this.name ? this.name : '') + md.render(this.description ? this.description : '') + '</div>';
        html += '<div class="markdown-wrapper ' + theme + '">' + md.render(this.markdown ? this.markdown : '') + '</div>';
        return html;
    });
};
freeTextUnitSchema.methods.toHtmlForSinglePDF = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const theme = yield this.getTheme();
        let html = '';
        html += '<div><h4>' + md.render(this.name ? 'Unit: ' + this.name : '') + '</h4>'
            + '<span>' + md.render(this.description ? 'Description: ' + this.description : '') + '</span></div>';
        html += '<div class="markdown-wrapper ' + theme + '">' + md.render(this.markdown ? this.markdown : '') + '</div>';
        return html;
    });
};
freeTextUnitSchema.methods.toHtmlForSinglePDFSolutions = function () {
    return '';
};

//# sourceMappingURL=../../../maps/src/models/units/FreeTextUnit.js.map
