"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
let FilterErrorHandler = class FilterErrorHandler {
    error(error, request, response, next) {
        if (error && error.httpCode && error.httpCode !== 500) {
            // We want all HttpErrors to not further propagate, so that they will not be logged or reported to Sentry
            next(null);
            return;
        }
        next(error);
    }
};
FilterErrorHandler = __decorate([
    routing_controllers_1.Middleware({ type: 'after' })
], FilterErrorHandler);
exports.FilterErrorHandler = FilterErrorHandler;

//# sourceMappingURL=../../maps/src/utilities/FilterErrorHandler.js.map
