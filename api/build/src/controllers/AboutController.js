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
const fs = require("fs");
let AboutController = class AboutController {
    /**
     * @api {get} /api/about/dependencies Request dependencies
     * @apiName GetAboutDependencies
     * @apiGroup About
     *
     * @apiSuccess {Object[]} data Information about dependencies.
     *
     * @apiSuccessExample {json} Success-Response:
     *     {
     *         "data": [{
     *             "name": "bcrypt",
     *             "version": "1.0.3",
     *             "repository": "https://github.com/kelektiv/node.bcrypt.js",
     *             "license": "MIT",
     *             "devDependency": false
     *         }, {
     *             "name": "express",
     *             "version": "4.16.2",
     *             "repository": "https://github.com/expressjs/express",
     *             "devDependency": false
     *         }, {
     *             "name": "winston",
     *             "version": "2.4.0",
     *             "repository": "https://github.com/winstonjs/winston",
     *             "license": "MIT",
     *             "devDependency": false
     *         }]
     *     }
     *
     * @apiError HttpError 500 - Licensefile not found
     */
    getDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield fs.readFileSync('nlf-licenses.json');
            }
            catch (err) {
                throw new routing_controllers_1.HttpError(500, 'Licensefile not found');
            }
        });
    }
};
__decorate([
    routing_controllers_1.Get('/dependencies'),
    routing_controllers_1.ContentType('application/json'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AboutController.prototype, "getDependencies", null);
AboutController = __decorate([
    routing_controllers_1.JsonController('/about')
], AboutController);
exports.AboutController = AboutController;

//# sourceMappingURL=../../maps/src/controllers/AboutController.js.map
