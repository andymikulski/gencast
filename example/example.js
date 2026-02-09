"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("./User");
const User_gen_1 = require("./User.gen");
// Example 1: Valid user object
const userData = {
    id: 123,
    name: "John Doe",
    email: "john@example.com",
    isActive: true
};
const user = (0, User_gen_1.CastToUser)(userData);
if (user) {
    console.log(`✓ Valid user: ${user.name}`);
}
else {
    console.log('✗ Invalid user data');
}
// Example 2: Invalid user object (missing email)
const invalidUserData = {
    id: 456,
    name: "Jane Doe",
    isActive: true
    // email is missing!
};
const invalidUser = (0, User_gen_1.CastToUser)(invalidUserData);
if (invalidUser) {
    console.log(`✓ Valid user: ${invalidUser.name}`);
}
else {
    console.log('✗ Invalid user data - missing required fields');
}
// Example 3: Admin user
const adminData = {
    id: 789,
    name: "Admin User",
    email: "admin@example.com",
    isActive: true,
    role: "admin",
    permissions: ["read", "write", "delete"]
};
const admin = (0, User_gen_1.CastToAdmin)(adminData);
if (admin) {
    console.log(`✓ Valid admin with ${admin.permissions.length} permissions`);
}
else {
    console.log('✗ Invalid admin data');
}
// Example 4: Guest with method
const guestData = {
    sessionId: "abc123",
    getDisplayName: function () { return "Guest User"; }
};
const guest = (0, User_gen_1.CastToGuest)(guestData);
if (guest) {
    console.log(`✓ Valid guest: ${guest.getDisplayName()}`);
}
else {
    console.log('✗ Invalid guest data');
}
// Example 5: Class-based casting with instanceof (requires generateClassCasts: true)
const userAccount = new User_1.UserAccount(1, "johndoe", new Date());
const plainObject = { id: 2, username: "janedoe", createdAt: new Date() };
const castedUserAccount = (0, User_gen_1.CastToUserAccount)(userAccount);
if (castedUserAccount) {
    console.log(`✓ Valid UserAccount instance: ${castedUserAccount.username}`);
}
else {
    console.log('✗ Invalid UserAccount');
}
const castedPlainObject = (0, User_gen_1.CastToUserAccount)(plainObject);
if (castedPlainObject) {
    console.log(`✓ Plain object passed as UserAccount`);
}
else {
    console.log('✗ Plain object rejected - not an instance of UserAccount (instanceof check)');
}
// Example 6: Admin class instance
const adminAccount = new User_1.AdminAccount(3, "admin", new Date(), ["manage_users", "view_logs"]);
const castedAdmin = (0, User_gen_1.CastToAdminAccount)(adminAccount);
if (castedAdmin) {
    console.log(`✓ Valid AdminAccount with ${castedAdmin.privileges.length} privileges`);
}
else {
    console.log('✗ Invalid AdminAccount');
}
