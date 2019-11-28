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
const server_1 = require("../../src/server");
const FixtureLoader_1 = require("../../fixtures/FixtureLoader");
const fs = require("fs");
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const expect = chai.expect;
const app = new server_1.Server().app;
const BASE_URL = '/api/about';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe('About', () => __awaiter(this, void 0, void 0, function* () {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    describe(`GET ${BASE_URL}/dependencies`, () => __awaiter(this, void 0, void 0, function* () {
        it('should return a json', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield chai.request(app)
                .get(`${BASE_URL}/dependencies`)
                .catch((err) => err.response);
            expect(result).to.have.status(200);
            expect(result).to.be.json;
            expect(result.body).to.have.property('data');
        }));
        it('should fail when license file does not exist', () => __awaiter(this, void 0, void 0, function* () {
            yield fs.renameSync('nlf-licenses.json', 'nlf-licenses.json.tmp');
            const result = yield chai.request(app)
                .get(`${BASE_URL}/dependencies`)
                .catch((err) => err.response);
            expect(result).to.have.status(500);
            yield fs.renameSync('nlf-licenses.json.tmp', 'nlf-licenses.json');
        }));
    }));
}));

//# sourceMappingURL=../../maps/test/controllers/about.js.map
