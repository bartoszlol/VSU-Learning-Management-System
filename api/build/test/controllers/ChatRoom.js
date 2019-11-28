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
const BASE_URL = '/api/chatRoom';
const expect = TestHelper_1.TestHelper.commonChaiSetup().expect;
const testHelper = new TestHelper_1.TestHelper(BASE_URL);
describe('ChatRoom', () => __awaiter(this, void 0, void 0, function* () {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield testHelper.resetForNextTest();
    }));
    describe(`GET ${BASE_URL} :id`, () => __awaiter(this, void 0, void 0, function* () {
        it('should fail when parameter room invalid', () => __awaiter(this, void 0, void 0, function* () {
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const result = yield testHelper.commonUserGetRequest(admin, '/507f1f77bcf86cd799439011');
            expect(result).to.have.status(404);
        }));
        it('should return chat room', () => __awaiter(this, void 0, void 0, function* () {
            const { roomId } = yield FixtureUtils_1.FixtureUtils.getSimpleChatRoomSetup();
            const admin = yield FixtureUtils_1.FixtureUtils.getRandomAdmin();
            const result = yield testHelper.commonUserGetRequest(admin, '/' + roomId);
            expect(result).to.have.status(200);
            expect(result).to.be.json;
        }));
    }));
}));

//# sourceMappingURL=../../maps/test/controllers/ChatRoom.js.map
