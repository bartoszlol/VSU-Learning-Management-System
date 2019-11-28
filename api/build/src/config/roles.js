"use strict";
// TODO: It would be preferable to use a common file in the project-wide shared directory instead,
// but currently that won't work inside the back-end (i.e. api/*) due to its current build process.
Object.defineProperty(exports, "__esModule", { value: true });
exports.allRoles = [
    'student',
    // Currently unused / disabled: 'tutor',
    'teacher',
    'admin',
];
exports.default = { all: exports.allRoles };

//# sourceMappingURL=../../maps/src/config/roles.js.map
