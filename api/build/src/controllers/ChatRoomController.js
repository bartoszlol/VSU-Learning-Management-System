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
const ChatRoom_1 = require("../models/ChatRoom");
let ChatRoomController = class ChatRoomController {
    /**
     * @api {get} /api/chatRoom get a chat room
     * @apiName getChatRoom
     * @apiGroup ChatRoom
     *
     * @apiParam {string} id: chatRoom ID.
     *
     * @apiSuccess {IChatRoom} a ChatRoom Object.
     *
     * @apiSuccessExample {json} Success-Response:
     *   {
     *         "_id": "5a037e6b60f72236d8e7c857",
     *         "updatedAt": "2017-11-08T22:00:11.693Z",
     *         "createdAt": "2017-11-08T22:00:11.693Z",
     *         "name": "ChatRoom Name",
     *         "description": "ChatRoom Description",
     *         "__v": 0,
     *  }
     *
     */
    getChatRoom(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const chatRoom = yield ChatRoom_1.ChatRoom.findById(id);
            if (!chatRoom) {
                throw new routing_controllers_1.NotFoundError(errorCodes_1.errorCodes.chat.roomNotFound.text);
            }
            return chatRoom.toObject();
        });
    }
};
__decorate([
    routing_controllers_1.Get('/:id([a-fA-F0-9]{24})'),
    __param(0, routing_controllers_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatRoomController.prototype, "getChatRoom", null);
ChatRoomController = __decorate([
    routing_controllers_1.JsonController('/chatRoom'),
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default)
], ChatRoomController);
exports.default = ChatRoomController;

//# sourceMappingURL=../../maps/src/controllers/ChatRoomController.js.map
