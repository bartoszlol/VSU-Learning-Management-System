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
const ExtractMongoId_1 = require("../utilities/ExtractMongoId");
let Message;
exports.Message = Message;
const messageSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    chatName: {
        type: String,
    },
    content: {
        type: 'string',
        required: true
    },
    visible: {
        type: Boolean,
        default: true,
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'ChatRoom'
    },
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = ret._id.toString();
            ret.author = ret.author.toString();
            if (ret.hasOwnProperty('room') && ret.room) {
                ret.room = ret.room.toString();
            }
            delete ret.visible;
        }
    }
});
messageSchema.add({ comments: [messageSchema] });
messageSchema.methods.exportJSON = function () {
    const obj = this.toObject();
    // remove unwanted informations
    // mongo properties
    delete obj._id;
    delete obj.createdAt;
    delete obj.__v;
    delete obj.updatedAt;
    // custom properties
    return obj;
};
messageSchema.methods.forDisplay = function () {
    const { _id, content, room, chatName, comments, updatedAt, createdAt } = this;
    return {
        _id: ExtractMongoId_1.extractMongoId(_id),
        content,
        room: ExtractMongoId_1.extractMongoId(room),
        chatName,
        comments: comments.map((comment) => comment.forDisplay()),
        updatedAt,
        createdAt,
    };
};
messageSchema.statics.exportPersonalData = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield Message.find({ 'author': user._id }).sort({ room: 1, createdAt: 1 }).select('-comments'))
            .map(messages => messages.exportJSON());
    });
};
exports.Message = Message = mongoose.model('Message', messageSchema);

//# sourceMappingURL=../../maps/src/models/Message.js.map
