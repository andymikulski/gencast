"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastToUser = CastToUser;
exports.CastToAdmin = CastToAdmin;
exports.CastToGuest = CastToGuest;
function CastToUser(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.id) === "number" && typeof (obj.name) === "string" && typeof (obj.email) === "string" && typeof (obj.isActive) === "boolean") ? obj : null;
}
function CastToAdmin(obj) {
    return (obj !== null && obj !== undefined && CastToUser(obj) !== null && obj.role === "admin") ? obj : null;
}
function CastToGuest(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.getDisplayName) === "function" && typeof (obj.sessionId) === "string") ? obj : null;
}
