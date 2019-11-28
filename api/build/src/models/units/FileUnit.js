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
const User_1 = require("../User");
const fileUnitSchema = new mongoose.Schema({
    files: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File'
        }
    ],
    fileUnitType: {
        type: String,
        required: true
    }
});
exports.fileUnitSchema = fileUnitSchema;
fileUnitSchema.methods.populateUnit = function () {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.unitCreator) {
            this.unitCreator = yield User_1.User.findById(this.unitCreator);
        }
        return this.populate('files').execPopulate();
    });
};

//# sourceMappingURL=../../../maps/src/models/units/FileUnit.js.map
