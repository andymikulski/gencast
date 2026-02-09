"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAccount = exports.UserAccount = void 0;
// Example class to demonstrate class-based casting
var UserAccount = /** @class */ (function () {
    function UserAccount(id, username, createdAt) {
        this.id = id;
        this.username = username;
        this.createdAt = createdAt;
    }
    UserAccount.prototype.isExpired = function () {
        return Date.now() - this.createdAt.getTime() > 1000 * 60 * 60 * 24 * 365;
    };
    return UserAccount;
}());
exports.UserAccount = UserAccount;
var AdminAccount = /** @class */ (function (_super) {
    __extends(AdminAccount, _super);
    function AdminAccount(id, username, createdAt, privileges) {
        var _this = _super.call(this, id, username, createdAt) || this;
        _this.privileges = privileges;
        return _this;
    }
    return AdminAccount;
}(UserAccount));
exports.AdminAccount = AdminAccount;
