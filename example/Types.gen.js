"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastToPoint = CastToPoint;
exports.CastToCalculator = CastToCalculator;
exports.CastToPoint3D = CastToPoint3D;
exports.CastToUser = CastToUser;
exports.CastToResult = CastToResult;
exports.CastToID = CastToID;
exports.CastToUsername = CastToUsername;
exports.CastToIsActive = CastToIsActive;
exports.CastToStatus = CastToStatus;
function CastToPoint(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.x) === "number" && typeof (obj.y) === "number") ? obj : null;
}
function CastToCalculator(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.add) === "function" && typeof (obj.multiply) === "function") ? obj : null;
}
function CastToPoint3D(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.x) === "number" && typeof (obj.y) === "number" && typeof (obj.z) === "number") ? obj : null;
}
function CastToUser(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.id) === "number" && typeof (obj.name) === "string" && (obj.status === "active" || obj.status === "inactive" || obj.status === "pending") && typeof (obj.location) !== "undefined") ? obj : null;
}
function CastToResult(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.success) === "boolean") ? obj : null;
}
function CastToID(obj) {
    return (typeof (obj) === "number") ? obj : null;
}
function CastToUsername(obj) {
    return (typeof (obj) === "string") ? obj : null;
}
function CastToIsActive(obj) {
    return (typeof (obj) === "boolean") ? obj : null;
}
function CastToStatus(obj) {
    return (obj === "active" || obj === "inactive" || obj === "pending") ? obj : null;
}
