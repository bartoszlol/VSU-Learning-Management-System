"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lightbox_service_1 = require("./lightbox.service");
var lightbox_component_1 = require("./lightbox.component");
var lightbox_config_service_1 = require("./lightbox-config.service");
var lightbox_event_service_1 = require("./lightbox-event.service");
var lightbox_overlay_component_1 = require("./lightbox-overlay.component");
var core_1 = require("@angular/core");
var LightboxModule = /** @class */ (function () {
    function LightboxModule() {
    }
    LightboxModule.decorators = [
        { type: core_1.NgModule, args: [{
                    declarations: [lightbox_overlay_component_1.LightboxOverlayComponent, lightbox_component_1.LightboxComponent],
                    providers: [
                        lightbox_service_1.Lightbox,
                        lightbox_config_service_1.LightboxConfig,
                        lightbox_event_service_1.LightboxEvent,
                        lightbox_event_service_1.LightboxWindowRef
                    ],
                    entryComponents: [lightbox_overlay_component_1.LightboxOverlayComponent, lightbox_component_1.LightboxComponent]
                },] },
    ];
    return LightboxModule;
}());
exports.LightboxModule = LightboxModule;
//# sourceMappingURL=lightbox.module.js.map