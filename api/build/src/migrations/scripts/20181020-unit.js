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
class UnitMigration20181020 {
    up() {
        return __awaiter(this, void 0, void 0, function* () {
            const noVisibleField = yield Unit_1.Unit.find({ visible: { $exists: false } });
            for (const unit of noVisibleField) {
                try {
                    unit.visible = true;
                    yield unit.save();
                }
                catch (error) {
                    console.log('Could not add "visible" to unit ' + unit.name + ' error: ' + error);
                }
            }
            return true;
        });
    }
}
module.exports = UnitMigration20181020;

//# sourceMappingURL=../../../maps/src/migrations/scripts/20181020-unit.js.map
