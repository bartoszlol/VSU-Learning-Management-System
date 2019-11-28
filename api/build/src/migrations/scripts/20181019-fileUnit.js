"use strict";
// tslint:disable:no-console
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Unit_1 = require("../../models/units/Unit");
class FileUnitMigration20181019 {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileUnitTypeMissing = yield Unit_1.Unit.find({ __t: 'file', fileUnitType: { $exists: false } });
            for (const unit of fileUnitTypeMissing) {
                try {
                    unit.fileUnitType = 'file';
                    yield unit.save({ validateBeforeSave: false });
                }
                catch (error) {
                    console.log('Could not add "fileUnitType" to unit ' + unit.name + ' error: ' + error);
                }
            }
            return true;
        });
    }
}
module.exports = FileUnitMigration20181019;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20181019-fileUnit.js.map
