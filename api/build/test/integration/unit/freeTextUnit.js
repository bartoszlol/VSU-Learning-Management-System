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
const chai = require("chai");
const chaiHttp = require("chai-http");
const server_1 = require("../../../src/server");
const FixtureLoader_1 = require("../../../fixtures/FixtureLoader");
chai.use(chaiHttp);
const should = chai.should();
const app = new server_1.Server().app;
const BASE_URL = '/api/users';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe('FreeTextUnit', () => {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    describe(`GET ${BASE_URL}`, () => {
        it('should return ???', () => __awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
    });
});

//# sourceMappingURL=../../../maps/test/integration/unit/freeTextUnit.js.map
