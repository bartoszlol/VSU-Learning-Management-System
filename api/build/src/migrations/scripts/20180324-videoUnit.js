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
const unitSchema = new mongoose.Schema({
    _course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    progressable: {
        type: Boolean
    },
    weight: {
        type: Number
    }
}, {
    collection: 'units',
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            ret._id = doc._id.toString();
            ret._course = ret._course.toString();
        }
    },
});
const Unit = mongoose.model('VideoUnit', unitSchema);
class VideoUnitMigration {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('VideoUnit up was called');
            try {
                const videoUnits = yield Unit.find({ '__t': 'video' }).exec();
                const updatedFileUnits = yield Promise.all(videoUnits.map((videoUnit) => __awaiter(this, void 0, void 0, function* () {
                    const videoUnitObj = videoUnit.toObject();
                    videoUnitObj.fileUnitType = videoUnitObj.__t;
                    videoUnitObj.__t = 'file';
                    videoUnitObj._id = mongoose.Types.ObjectId(videoUnitObj._id);
                    const unitsAfterReplace = yield mongoose.connection.collection('units')
                        .findOneAndReplace({ '_id': videoUnit._id }, videoUnitObj);
                    return videoUnitObj;
                })));
            }
            catch (error) {
                console.log(error);
            }
            return true;
        });
    }
    down() {
        console.log('VideoUnit down was called');
    }
}
module.exports = VideoUnitMigration;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20180324-videoUnit.js.map
