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
const routing_controllers_1 = require("routing-controllers");
const Config_1 = require("../models/Config");
const passportJwtMiddleware_1 = require("../security/passportJwtMiddleware");
function isPublicConfig(name) {
    return /^legalnotice$|^infoBox$|^privacy$|^downloadMaxFileSize$/.test(name);
}
let ConfigController = class ConfigController {
    findConfig(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = yield Config_1.Config.findOne({ name });
            return config ? config.toObject() : { name, value: '' };
        });
    }
    /**
     * @api {get} /api/config/public/:id Request public config
     * @apiName GetConfigPublic
     * @apiGroup Config
     *
     * @apiParam {String} id Config name (e.g. legalnotice).
     *
     * @apiSuccess {Config} config Public config.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "name": "legalnotice",
     *         "value": "This will show the legalnotice.",
     *         "updatedAt": "2017-11-08T22:00:11.693Z",
     *         "createdAt": "2017-11-08T22:00:11.693Z",
     *         "__v": 0
     *     }
     *
     * @apiError UnauthorizedError
     */
    getPublicConfig(name) {
        if (!isPublicConfig(name)) {
            throw new routing_controllers_1.UnauthorizedError();
        }
        return this.findConfig(name);
    }
    /**
     * @api {put} /api/config/:id Update config
     * @apiName PutConfig
     * @apiGroup Config
     * @apiPermission admin
     *
     * @apiParam {String} id Config name (e.g. legalnotice).
     * @apiParam {Object} data New data (with single 'data' string property).
     *
     * @apiSuccess {Object} result Empty object.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {}
     *
     */
    putConfig(name, value) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Config_1.Config.findOneAndUpdate({ name }, { name, value }, { 'upsert': true, 'new': true });
            return {};
        });
    }
    /**
     * @api {get} /api/config/:id Request config
     * @apiName GetConfig
     * @apiGroup Config
     * @apiPermission admin
     *
     * @apiParam {String} id Config name (e.g. legalnotice).
     *
     * @apiSuccess {Config} config Config.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "name": "legalnotice",
     *         "value": "This will show the legalnotice.",
     *         "updatedAt": "2017-11-08T22:00:11.693Z",
     *         "createdAt": "2017-11-08T22:00:11.693Z",
     *         "__v": 0
     *     }
     *
     */
    getConfig(name) {
        return this.findConfig(name);
    }
};
__decorate([
    routing_controllers_1.Get('/public/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConfigController.prototype, "getPublicConfig", null);
__decorate([
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default),
    routing_controllers_1.Authorized(['admin']),
    routing_controllers_1.Put('/:id'),
    __param(0, routing_controllers_1.Param('id')), __param(1, routing_controllers_1.BodyParam('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "putConfig", null);
__decorate([
    routing_controllers_1.UseBefore(passportJwtMiddleware_1.default),
    routing_controllers_1.Authorized(['admin']),
    routing_controllers_1.Get('/:id'),
    __param(0, routing_controllers_1.Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConfigController.prototype, "getConfig", null);
ConfigController = __decorate([
    routing_controllers_1.JsonController('/config')
], ConfigController);
exports.ConfigController = ConfigController;

//# sourceMappingURL=../../maps/src/controllers/ConfigController.js.map
