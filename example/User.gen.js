"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CastToUser = CastToUser;
exports.CastToAdmin = CastToAdmin;
exports.CastToGuest = CastToGuest;
exports.CastToUserAccount = CastToUserAccount;
exports.CastToAdminAccount = CastToAdminAccount;
const User_1 = require("./User");
function CastToUser(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.id) === "number" && typeof (obj.name) === "string" && typeof (obj.email) === "string" && typeof (obj.isActive) === "boolean") ? obj : null;
}
function CastToAdmin(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.id) === "number" && typeof (obj.name) === "string" && typeof (obj.email) === "string" && typeof (obj.isActive) === "boolean" && obj.role === "admin") ? obj : null;
}
function CastToGuest(obj) {
    return (obj !== null && obj !== undefined && typeof (obj.getDisplayName) === "function" && typeof (obj.sessionId) === "string") ? obj : null;
}
function CastToUserAccount(obj) {
    return (obj instanceof User_1.UserAccount) ? obj : null;
}
function CastToAdminAccount(obj) {
    return (obj instanceof User_1.AdminAccount) ? obj : null;
}
