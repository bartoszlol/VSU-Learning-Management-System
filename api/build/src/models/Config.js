"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const configSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    value: {
        type: String
    }
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            delete ret._id;
        }
    }
});
const Config = mongoose.model('Config', configSchema);
exports.Config = Config;

//# sourceMappingURL=../../maps/src/models/Config.js.map
