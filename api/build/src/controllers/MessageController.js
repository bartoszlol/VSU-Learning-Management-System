"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
const routing_controllers_1 = require("routing-controllers");
const errorCodes_1 = require("../config/errorCodes");
const Message_1 = require("../models/Message");
const ChatRoom_1 = require("../models/ChatRoom");
let MessageController = class MessageController {
    assertUserViewAuthForRoomId(currentUser, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!roomId) {
                throw new routing_controllers_1.BadRequestError();
            }
            const room = yield ChatRoom_1.ChatRoom.findById(roomId);
            if (!room) {
                throw new routing_controllers_1.NotFoundError(errorCodes_1.errorCodes.chat.roomNotFound.text);
            }
            if (!(yield room.checkPrivileges(currentUser)).userCanViewMessages) {
                throw new routing_controllers_1.ForbiddenError();
            }
        });
    }
    /**
     * @api {get} /api/message get all messages in a given room
     * @apiName getMessages
     * @apiGroup Message
     *
     * @apiParam {string} room: the room to which the messages belong.
     * @apiParam {number} skip: number of messages to skip. default to 0.
     * @apiParam {number} limit: number of messages to return.
     * @apiParam {number} order: the order in which the messages are ordered. possible values: 1(ascending) or -1(descending). default to -1.
     *
     * @apiSuccess {IMessageDisplay[]} messages in the given room.
     * @apiSuccessExample {json} Success-Response:
     *     [
     *      {
     *        chatName: "student2",
     *        comments: [],
     *        content: "any message",
     *        createdAt: "2018-06-22T21:14:50.924Z",
     *        updatedAt: "2018-06-22T21:14:50.924Z",
     *        room : "5b2d66c84daf0700d5afe7d8",
     *        _id: "5b2d66ca4daf0700d5aff89c"
     *      }
     *     ]
     *
     * @apiError BadRequestError
     * @apiError NotFoundError
     * @apiError ForbiddenError
     */
    getMessages(roomId, skip = 0, limit, order = -1, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assertUserViewAuthForRoomId(currentUser, roomId);
            const messages = yield Message_1.Message.find({ room: roomId }).sort({ createdAt: order }).skip(skip).limit(limit);
            return messages.map((message) => message.forDisplay());
        });
    }
    /**
     * @api {get} /api/message/count get number of messages in a given room
     * @apiName getMessageCount
     * @apiGroup Message
     *
     * @apiParam {string} room: the room to which the messages belong.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *        "count": "45"
     *     }
     *
     * @apiError BadRequestError
     * @apiError NotFoundError
     * @apiError ForbiddenError
     */
    getMessageCount(roomId, currentUser) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assertUserViewAuthForRoomId(currentUser, roomId);
            const count = yield Message_1.Message.countDocuments({ room: roomId });
            return { count };
        });
    }
};
__decorate([
    routing_controllers_1.Get('/'),
    __param(0, routing_controllers_1.QueryParam('room')), __param(1, routing_controllers_1.QueryParam('skip')),
    __param(2, routing_controllers_1.QueryParam('limit')), __param(3, routing_controllers_1.QueryParam('order')),
    __param(4, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getMessages", null);
__decorate([
    routing_controllers_1.Get('/count'),
    __param(0, routing_controllers_1.QueryParam('room')), __param(1, routing_controllers_1.CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessageController.prototype, "getMessageCount", null);
MessageController = __decorate([
    routing_controllers_1.JsonController('/message'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], MessageController);
exports.default = MessageController;

//# sourceMappingURL=../../maps/src/controllers/MessageController.js.map
