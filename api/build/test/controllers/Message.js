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
const TestHelper_1 = require("../TestHelper");
const FixtureUtils_1 = require("../../fixtures/FixtureUtils");
const User_1 = require("../../src/models/User");
const BASE_URL = '/api/message';
const expect = TestHelper_1.TestHelper.commonChaiSetup().expect;
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
function testMissingRoom(urlPostfix = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
        const result = yield testHelper.commonUserGetRequest(admin, urlPostfix);
        expect(result).to.have.status(400);
    });
}
function testSuccess(urlPostfix = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const { roomId } = yield FixtureUtils_1.FixtureUtils.getSimpleChatRoomSetup();
        const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
        const result = yield testHelper.commonUserGetRequest(admin, urlPostfix, { room: roomId });
        expect(result).to.have.status(200);
        expect(result).to.be.json;
        return result;
    });
}
function testAccessDenial(urlPostfix = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const { course, roomId } = yield FixtureUtils_1.FixtureUtils.getSimpleChatRoomSetup();
        const student = yield User_1.User.findOne({ role: 'student', _id: { $nin: course.students } });
        const result = yield testHelper.commonUserGetRequest(student, urlPostfix, { room: roomId });
        expect(result).to.have.status(403);
    });
}
describe('Message', () => __awaiter(this, void 0, void 0, function* () {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`GET ${BASE_URL}`, () => __awaiter(this, void 0, void 0, function* () {
        it('should fail when parameter room missing', () => __awaiter(this, void 0, void 0, function* () {
            yield testMissingRoom();
        }));
        it('should return messages for chat room', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield testSuccess();
            expect(result.body).to.be.an('array');
        }));
        it('should deny access to chat room messages if unauthorized', () => __awaiter(this, void 0, void 0, function* () {
            yield testAccessDenial();
        }));
    }));
    describe(`GET ${BASE_URL}/count`, () => __awaiter(this, void 0, void 0, function* () {
        it('should fail when parameter room missing', () => __awaiter(this, void 0, void 0, function* () {
            yield testMissingRoom('/count');
        }));
        it('should return message count for chat room', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield testSuccess('/count');
            expect(result.body).to.have.property('count');
        }));
        it('should deny access to chat room message count if unauthorized', () => __awaiter(this, void 0, void 0, function* () {
            yield testAccessDenial('/count');
        }));
    }));
}));

//# sourceMappingURL=../../maps/test/controllers/Message.js.map
