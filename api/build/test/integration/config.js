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
const server_1 = require("../../src/server");
const FixtureLoader_1 = require("../../fixtures/FixtureLoader");
const chaiHttp = require("chai-http");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const JwtUtils_1 = require("../../src/security/JwtUtils");
chai.use(chaiHttp);
const should = chai.should();
const app = new server_1.Server().app;
const BASE_URL = '/api/config';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe('Config', () => {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    describe(`GET ${BASE_URL}/public/foo`, () => {
        it('should fail (foo)', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .get(`${BASE_URL}/public/foo`)
                .catch(err => err.response);
            res.status.should.be.equal(401);
            res.body.name.should.be.equal('UnauthorizedError');
        }));
        it('should pass (legalnotice)', () => __awaiter(this, void 0, void 0, function* () {
            const res = yield chai.request(app)
                .get(`${BASE_URL}/public/legalnotice`)
                .catch(err => err.response);
            res.status.should.be.equal(200);
            res.body.name.should.be.equal('legalnotice');
        }));
    });
    describe(`PUT ${BASE_URL}/legalnotice`, () => {
        it('should pass', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const res = yield chai.request(app)
                .put(`${BASE_URL}/legalnotice`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`)
                .send({ data: '# Legalnotice' });
            res.status.should.be.equal(200);
        }));
    });
    describe(`GET ${BASE_URL}/foo`, () => {
        it('should pass', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            yield chai.request(app)
                .put(`${BASE_URL}/foo`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`)
                .send({ data: 'bar' });
            const res = yield chai.request(app)
                .get(`${BASE_URL}/foo`)
                .set('Cookie', `token=${JwtUtils_1.JwtUtils.generateToken(admin)}`)
                .catch(err => err.response);
            res.status.should.be.equal(200);
            res.body.value.should.be.equal('bar');
        }));
    });
});

//# sourceMappingURL=../../maps/test/integration/config.js.map
