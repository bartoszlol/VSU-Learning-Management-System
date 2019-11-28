"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const pictureSchema = new mongoose.Schema({
    breakpoints: [{
            type: mongoose.Schema.Types.Mixed
        }],
    mimeType: {
        type: String,
    }
});
exports.pictureSchema = pictureSchema;

//# sourceMappingURL=../../../maps/src/models/mediaManager/Picture.js.map
