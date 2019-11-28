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
const chai_1 = require("chai");
const Pick_1 = require("../../src/utilities/Pick");
const ExtractMongoId_1 = require("../../src/utilities/ExtractMongoId");
const mongoose_1 = require("mongoose");
const EnsureMongoToObject_1 = require("../../src/utilities/EnsureMongoToObject");
const Course_1 = require("../../src/models/Course");
const FixtureLoader_1 = require("../../fixtures/FixtureLoader");
const fixtureLoader = new FixtureLoader_1.FixtureLoader();
describe('Testing utilities', () => {
    describe('Pick', () => {
        let input;
        beforeEach(function () {
            input = { a: 0, b: 'b', c: [1, 2, 3], d: { e: 'f' }, e: { d: 'c' } };
        });
        it('should pick only certain attributes', () => {
            const result = Pick_1.default.only(['a', 'c'], input);
            chai_1.expect(result).to.eql({ a: 0, c: [1, 2, 3] });
        });
        it('should pick certain attributes as empty containers', () => {
            const result = Pick_1.default.asEmpty(['a', 'c', 'd'], input);
            chai_1.expect(result).to.eql({ c: [], d: {} });
        });
    });
    describe('ExtractMongoId', () => {
        const idAsObjectId = mongoose_1.Types.ObjectId();
        const idDirect = { id: idAsObjectId.toHexString() };
        const idDirect2 = { _id: idAsObjectId.toHexString() };
        const idAsEmbeddedObjectId = { id: idAsObjectId };
        const idAsEmbeddedObjectId2 = { _id: idAsObjectId };
        const idString = new String(idDirect.id); // tslint:disable-line
        const idExpect = idDirect.id;
        const idArray = [
            idAsObjectId, idDirect, idDirect2,
            {},
            idAsEmbeddedObjectId, idAsEmbeddedObjectId2,
            1,
            idString, idExpect // Valid
        ];
        const fallback = 'fallback';
        it('should extract an ID from an ObjectID object', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId(idAsObjectId)).to.eq(idExpect);
        });
        it('should extract an ID from an object with "id" or "_id" string property', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId(idDirect)).to.eq(idExpect);
            chai_1.expect(ExtractMongoId_1.extractMongoId(idDirect2)).to.eq(idExpect);
        });
        it('should extract an ID from an object with "id" or "_id" ObjectID property', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId(idAsEmbeddedObjectId)).to.eq(idExpect);
            chai_1.expect(ExtractMongoId_1.extractMongoId(idAsEmbeddedObjectId2)).to.eq(idExpect);
        });
        it('should return an ID String object as string', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId(idString)).to.eq(idExpect);
        });
        it('should return an ID string without modifications', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId(idExpect)).to.eq(idExpect);
        });
        it('should yield undefined for invalid input', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId({})).to.eq(undefined);
            chai_1.expect(ExtractMongoId_1.extractMongoId(1)).to.eq(undefined);
        });
        it('should return a specified fallback for invalid input', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId({}, fallback)).to.eq(fallback);
            chai_1.expect(ExtractMongoId_1.extractMongoId(1, fallback)).to.eq(fallback);
        });
        it('should only extract ids for valid objects in an array', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId(idArray)).to.eql(Array(7).fill(idExpect));
        });
        it('should extract IDs for valid objects or return fallback values in an array', () => {
            chai_1.expect(ExtractMongoId_1.extractMongoId(idArray, fallback)).to.eql([
                idExpect, idExpect, idExpect,
                fallback,
                idExpect, idExpect,
                fallback,
                idExpect, idExpect // Valid
            ]);
        });
    });
    describe('EnsureMongoToObject', () => {
        // Before each test we reset the database
        beforeEach(() => __awaiter(this, void 0, void 0, function* () {
            yield fixtureLoader.load();
        }));
        it('should return the (ICourse) object without modification', () => __awaiter(this, void 0, void 0, function* () {
            const course = (yield Course_1.Course.findOne()).toObject();
            chai_1.expect(EnsureMongoToObject_1.ensureMongoToObject(course)).to.eql(course);
        }));
        it('should call the mongoose (ICourseModel) toObject function and return the result', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findOne();
            chai_1.expect(EnsureMongoToObject_1.ensureMongoToObject(course)).to.eql(course.toObject());
        }));
        it('should call the mongoose (ICourseModel) toObject function with a transform option and return the result', () => __awaiter(this, void 0, void 0, function* () {
            const course = yield Course_1.Course.findOne();
            const options = {
                transform: (doc, ret) => {
                    ret._id = doc._id.toString() + '-transform-test';
                }
            };
            const expectedResult = course.toObject(options);
            chai_1.expect(expectedResult._id).to.eq(course._id.toString() + '-transform-test');
            chai_1.expect(EnsureMongoToObject_1.ensureMongoToObject(course, options)).to.eql(expectedResult);
        }));
    });
});

//# sourceMappingURL=../../maps/test/unit/utilities.js.map
