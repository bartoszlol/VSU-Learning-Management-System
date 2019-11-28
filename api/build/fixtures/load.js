"use strict";
// tslint:disable:no-console
Object.defineProperty(exports, "__esModule", { value: true });
const FixtureLoader_1 = require("./FixtureLoader");
const mongoose = require("mongoose");
new FixtureLoader_1.FixtureLoader()
    .load()
    .then(() => console.log('Fixtures loaded'))
    .catch((error) => console.error('Error loading fixtures', error))
    .then(() => mongoose.disconnect());

//# sourceMappingURL=../maps/fixtures/load.js.map
