"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastToGun = CastToGun;
function CastToGun(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.caliber) === "number" && typeof (obj.manufacturer) === "string" && typeof (obj.ammoCapacity) === "number") ? obj : null;
}
