"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("../config/main");
class APIInfo {
    constructor(status) {
        this.status = status;
        this.nonProductionWarning = main_1.default.nonProductionWarning;
        this.sentryDsn = main_1.default.sentryDsnPublic;
        this.build_timestamp = undefined;
        this.commit_hash = undefined;
        this.teacherMailRegex = main_1.default.teacherMailRegex;
    }
}
exports.APIInfo = APIInfo;

//# sourceMappingURL=../../maps/src/models/APIInfo.js.map
