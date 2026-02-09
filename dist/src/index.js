"use strict";
/**
 * GenCast - Runtime type casting for TypeScript interfaces
 *
 * This package generates type-safe runtime casting functions based on your TypeScript interfaces.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVSCodeSettings = exports.initConfig = exports.loadConfig = exports.generateCodegen = void 0;
var codegen_1 = require("./codegen");
Object.defineProperty(exports, "generateCodegen", { enumerable: true, get: function () { return codegen_1.generateCodegen; } });
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return codegen_1.loadConfig; } });
Object.defineProperty(exports, "initConfig", { enumerable: true, get: function () { return codegen_1.initConfig; } });
Object.defineProperty(exports, "updateVSCodeSettings", { enumerable: true, get: function () { return codegen_1.updateVSCodeSettings; } });
