"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-console
const main_1 = require("../config/main");
const mongoose = require("mongoose");
const fs = require('fs');
class MigrationHandler {
    constructor() {
        this.scripts = {};
        mongoose.Promise = global.Promise;
        if (!mongoose.connection.readyState) {
            this.databaseConnection = mongoose.connect(main_1.default.database, main_1.default.databaseOptions);
        }
        fs.readdirSync(__dirname + '/scripts').forEach((file) => {
            try {
                const requiredFile = require('./scripts/' + file);
                const filename = file.split('.')[0];
                this.scripts[filename] = new requiredFile();
            }
            catch (error) {
                console.log('The file ' + file + ' is missing a class definition.');
                console.log(error);
                return false;
            }
        });
    }
    up(scripts) {
        return __awaiter(this, void 0, void 0, function* () {
            const upPromises = [];
            scripts.forEach((script) => {
                if (this.scripts.hasOwnProperty(script)) {
                    upPromises.push(this.scripts[script].up());
                }
                else {
                    console.log('No migration script ' + script + ' was found!');
                }
            });
            return yield Promise.all(upPromises);
        });
    }
    down(scriptName) {
    }
    handleNotFound(script) {
        console.log('The file ' + script + '.js does not exist.');
        return false;
    }
    requireForce(path) {
        try {
            return require(path);
        }
        catch (e) {
            console.log('The file ' + path + '.js does not exist.');
            return false;
        }
    }
}
exports.MigrationHandler = MigrationHandler;

//# sourceMappingURL=../../maps/src/migrations/MigrationHandler.js.map
