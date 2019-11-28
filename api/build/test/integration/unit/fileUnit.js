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
const BASE_URL = '/api/units';
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe('FileUnit', () => {
    // Before each test we reset the database
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        yield fixtureLoader.load();
    }));
    // FIXME: Add working test!
    // describe(`POST ${BASE_URL}`, () => {
    //   it('should upload a video and return the created unit', async () => {
    //     const course = await FixtureUtils.getRandomCourse();
    //     const courseAdmin = await User.findOne({_id: course.courseAdmin});
    //     const data = {
    //       model: {
    //         _course: course._id.toString(),
    //         name: 'Test Upload',
    //         description: 'This is my test upload.'
    //       },
    //       lectureId: course.lectures[0].toString()
    //     };
    //     const res = await chai.request(app)
    //       .post(BASE_URL)
    //       .field('data', JSON.stringify(data))
    //       .attach('file', fs.readFileSync('fixtures/binaryData/testvideo.mp4'), 'testvideo.mp4')
    //       .set('Cookie', `token=${JwtUtils.generateToken(courseAdmin)}`);
    //     res.status.should.be.equal(200);
    //     res.body.name.should.be.equal('Test Upload');
    //     res.body.description.should.be.equal('This is my test upload.');
    //   });
    // });
});

//# sourceMappingURL=../../../maps/test/integration/unit/fileUnit.js.map
