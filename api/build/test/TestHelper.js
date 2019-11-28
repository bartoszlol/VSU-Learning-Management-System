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
const FixtureLoader_1 = require("../fixtures/FixtureLoader");
const server_1 = require("../src/server");
const JwtUtils_1 = require("../src/security/JwtUtils");
const chai = require("chai");
const chaiHttp = require("chai-http");
class TestHelper {
    constructor(BASE_URL) {
        this.app = new server_1.Server().app;
        this.fixtureLoader = new FixtureLoader_1.FixtureLoader();
        this.baseUrl = BASE_URL;
    }
    static commonChaiSetup() {
        chai.use(chaiHttp);
        return chai;
    }
    resetForNextTest() {
        return __awaiter(this, void 0, void 0, function* () {
            // Before each test we reset the database by reloading the fixtures
            yield this.fixtureLoader.load();
        });
    }
    basicUserGetRequest(user, url, queryOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield chai.request(this.app)
                .get(url)
                .query(queryOptions)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`)
                .catch((err) => err.response);
        });
    }
    basicUserPostRequest(user, url, sendData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield chai.request(this.app)
                .post(url)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`)
                .send(sendData)
                .catch((err) => err.response);
        });
    }
    basicUserPutRequest(user, url, sendData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield chai.request(this.app)
                .put(url)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`)
                .send(sendData)
                .catch((err) => err.response);
        });
    }
    basicUserDeleteRequest(user, url) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield chai.request(this.app)
                .del(url)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(user)}`)
                .catch((err) => err.response);
        });
    }
    commonUserGetRequest(user, urlPostfix, queryOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.basicUserGetRequest(user, this.baseUrl + urlPostfix, queryOptions);
        });
    }
    commonUserPostRequest(user, urlPostfix, sendData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.basicUserPostRequest(user, this.baseUrl + urlPostfix, sendData);
        });
    }
    commonUserPutRequest(user, urlPostfix, sendData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.basicUserPutRequest(user, this.baseUrl + urlPostfix, sendData);
        });
    }
    commonUserDeleteRequest(user, urlPostfix) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.basicUserDeleteRequest(user, this.baseUrl + urlPostfix);
        });
    }
}
exports.TestHelper = TestHelper;

//# sourceMappingURL=../maps/test/TestHelper.js.map
