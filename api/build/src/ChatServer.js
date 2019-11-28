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
const socketIo = require("socket.io");
const SocketIOEvent_1 = require("./models/SocketIOEvent");
const Message_1 = require("./models/Message");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const main_1 = require("./config/main");
const errorCodes_1 = require("./config/errorCodes");
const User_1 = require("./models/User");
const ChatRoom_1 = require("./models/ChatRoom");
const SocketIOMessage_1 = require("./models/SocketIOMessage");
const routing_controllers_1 = require("routing-controllers");
const ExtractMongoId_1 = require("./utilities/ExtractMongoId");
const Raven = require("raven");
class ChatServer {
    constructor(server) {
        this.io = socketIo(server, { path: '/chat' });
        this.io.use((socket, next) => {
            // ATM this and the passportJwtStrategyFactory are the only users of the 'cookie' package.
            const token = cookie.parse(socket.handshake.headers.cookie).token;
            const roomId = socket.handshake.query.room;
            jwt.verify(token, main_1.default.secret, (err, decoded) => __awaiter(this, void 0, void 0, function* () {
                const [user, room] = yield Promise.all([
                    User_1.User.findById(decoded._id).exec(),
                    ChatRoom_1.ChatRoom.findById(roomId).exec()
                ]);
                if (err || !user || !room) {
                    next(new routing_controllers_1.UnauthorizedError());
                    return;
                }
                const privileges = yield room.checkPrivileges(user);
                if (!(privileges.userCanViewMessages && privileges.userCanPostMessages)) {
                    next(new routing_controllers_1.ForbiddenError());
                    return;
                }
                socket.chatName = yield this.obtainChatName(user, roomId);
                socket.userId = decoded._id;
                next();
            }));
        });
    }
    obtainChatName(user, roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            const lastMessage = yield Message_1.Message.findOne({ room: roomId, author: user }).sort({ createdAt: -1 });
            if (lastMessage) {
                return lastMessage.chatName;
            }
            else {
                // Note: We probably should improve the random name generation, especially for better readability.
                return user.role + Date.now();
            }
        });
    }
    init() {
        this.io.on(SocketIOEvent_1.SocketIOEvent.CONNECT, (socket) => {
            const userId = socket.userId;
            const roomId = socket.handshake.query.room;
            const chatName = socket.chatName;
            socket.join(roomId);
            socket.on(SocketIOEvent_1.SocketIOEvent.MESSAGE, (message) => this.onMessage(message, userId, roomId, chatName));
        });
    }
    onMessage(socketIOMessagePost, userId, roomId, chatName) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                _id: undefined,
                content: socketIOMessagePost.content,
                author: userId,
                room: roomId,
                chatName,
                comments: []
            };
            const socketIOMessage = {
                meta: socketIOMessagePost.meta,
                message
            };
            if (socketIOMessagePost.meta.type === SocketIOMessage_1.SocketIOMessageType.COMMENT) {
                let foundMessage = yield Message_1.Message.findById(socketIOMessagePost.meta.parent);
                if (!foundMessage) {
                    process.stdout.write(errorCodes_1.errorCodes.chat.parentNotFound.text);
                    Raven.captureException(new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.chat.parentNotFound.code));
                    return;
                }
                if (ExtractMongoId_1.extractMongoId(foundMessage.room) !== roomId) {
                    process.stdout.write(errorCodes_1.errorCodes.chat.badParent.text);
                    Raven.captureException(new routing_controllers_1.BadRequestError(errorCodes_1.errorCodes.chat.badParent.code));
                    return;
                }
                foundMessage.comments.push(message);
                foundMessage = yield foundMessage.save();
                socketIOMessage.message = foundMessage.comments.pop().forDisplay();
                this.io.in(roomId).emit(SocketIOEvent_1.SocketIOEvent.MESSAGE, socketIOMessage);
            }
            else {
                let newMessage = new Message_1.Message(message);
                newMessage = yield newMessage.save();
                socketIOMessage.message = newMessage.forDisplay();
                this.io.in(roomId).emit(SocketIOEvent_1.SocketIOEvent.MESSAGE, socketIOMessage);
            }
        });
    }
}
exports.default = ChatServer;

//# sourceMappingURL=../maps/src/ChatServer.js.map
