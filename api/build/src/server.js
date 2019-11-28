"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const routing_controllers_1 = require("routing-controllers");
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const passport = require("passport");
const Raven = require("raven");
const main_1 = require("./config/main");
const passportLoginStrategy_1 = require("./security/passportLoginStrategy");
const passportJwtStrategy_1 = require("./security/passportJwtStrategy");
const passportJwtMiddleware_1 = require("./security/passportJwtMiddleware");
const RoleAuthorization_1 = require("./security/RoleAuthorization");
const CurrentUserDecorator_1 = require("./security/CurrentUserDecorator");
require("./utilities/FilterErrorHandler");
const ChatServer_1 = require("./ChatServer");
if (main_1.default.sentryDsn) {
    Raven.config(main_1.default.sentryDsn, {
        environment: 'api',
        release: '$TRAVIS_COMMIT',
    }).install();
}
/**
 * Root class of your node server.
 * Can be used for basic configurations, for instance starting up the server or registering middleware.
 */
class Server {
    static setupPassport() {
        passport.use(passportLoginStrategy_1.default);
        passport.use(passportJwtStrategy_1.default);
    }
    constructor() {
        // Do not use mpromise
        mongoose.Promise = global.Promise;
        // mongoose.set('debug', true);
        this.app = routing_controllers_1.createExpressServer({
            routePrefix: '/api',
            controllers: [__dirname + '/controllers/*.js'],
            authorizationChecker: RoleAuthorization_1.RoleAuthorization.checkAuthorization,
            currentUserChecker: CurrentUserDecorator_1.CurrentUserDecorator.checkCurrentUser,
        });
        if (main_1.default.sentryDsn) {
            // The request handler must be the first middleware on the app
            this.app.use(Raven.requestHandler());
            // The error handler must be before any other error middleware
            this.app.use(Raven.errorHandler());
        }
        Server.setupPassport();
        this.app.use(passport.initialize());
        // Requires authentication via the passportJwtMiddleware to accesss the static config.uploadFolder (e.g. for images).
        // That means this is not meant for truly public files accessible without login!
        this.app.use('/api/uploads', passportJwtMiddleware_1.default, express.static(main_1.default.uploadFolder));
    }
    start() {
        mongoose.connect(main_1.default.database, main_1.default.databaseOptions);
        this.app.use(morgan('combined'));
        const server = this.app.listen(main_1.default.port, () => {
            process.stdout.write('Server successfully started at port ' + main_1.default.port);
        });
        const chatServer = new ChatServer_1.default(server);
        chatServer.init();
    }
}
exports.Server = Server;
/**
 * For testing mocha will start express itself
 */
if (process.env.NODE_ENV !== 'test') {
    new Server().start();
}

//# sourceMappingURL=../maps/src/server.js.map
