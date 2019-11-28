"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var rxjs_1 = require("rxjs");
exports.LIGHTBOX_EVENT = {
    CHANGE_PAGE: 1,
    CLOSE: 2,
    OPEN: 3
};
var LightboxEvent = /** @class */ (function () {
    function LightboxEvent() {
        this._lightboxEventSource = new rxjs_1.Subject();
        this.lightboxEvent$ = this._lightboxEventSource.asObservable();
    }
    LightboxEvent.prototype.broadcastLightboxEvent = function (event) {
        this._lightboxEventSource.next(event);
    };
    LightboxEvent.decorators = [
        { type: core_1.Injectable },
    ];
    /** @nocollapse */
    LightboxEvent.ctorParameters = function () { return []; };
    return LightboxEvent;
}());
exports.LightboxEvent = LightboxEvent;
function getWindow() {
    return window;
}
var LightboxWindowRef = /** @class */ (function () {
    function LightboxWindowRef() {
    }
    Object.defineProperty(LightboxWindowRef.prototype, "nativeWindow", {
        get: function () {
            return getWindow();
        },
        enumerable: true,
        configurable: true
    });
    LightboxWindowRef.decorators = [
        { type: core_1.Injectable },
    ];
    return LightboxWindowRef;
}());
exports.LightboxWindowRef = LightboxWindowRef;
//# sourceMappingURL=lightbox-event.service.js.map