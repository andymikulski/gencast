"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAccount = exports.UserAccount = void 0;
// Example class to demonstrate class-based casting
class UserAccount {
    constructor(id, username, createdAt) {
        this.id = id;
        this.username = username;
        this.createdAt = createdAt;
    }
    isExpired() {
        return Date.now() - this.createdAt.getTime() > 1000 * 60 * 60 * 24 * 365;
    }
}
exports.UserAccount = UserAccount;
class AdminAccount extends UserAccount {
    constructor(id, username, createdAt, privileges) {
        super(id, username, createdAt);
        this.privileges = privileges;
    }
}
exports.AdminAccount = AdminAccount;
