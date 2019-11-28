"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// tslint:disable:no-console
const mongoose = require("mongoose");
const Unit_1 = require("../../models/units/Unit");
const ChatRoom_1 = require("../../models/ChatRoom");
class UnitV2Migration {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Unit V2 up was called');
            try {
                const units = yield Unit_1.Unit.find({ 'chatRoom': { $exists: false } });
                yield Promise.all(units.map((unit) => __awaiter(this, void 0, void 0, function* () {
                    const unitObj = unit.toObject();
                    const chatRoom = yield ChatRoom_1.ChatRoom.create({
                        room: {
                            roomType: 'Unit',
                            roomFor: unit._id
                        }
                    });
                    const chatRoomObj = chatRoom.toObject();
                    unitObj.chatRoom = chatRoomObj._id;
                    unitObj._id = mongoose.Types.ObjectId(unitObj._id);
                    yield mongoose.connection.collection('units')
                        .findOneAndReplace({ '_id': unit._id }, unitObj);
                })));
            }
            catch (error) {
                console.log('1: ' + error);
            }
            console.log('Chat rooms have been successfully added to units!');
            return true;
        });
    }
}
module.exports = UnitV2Migration;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20180821-unit.js.map
