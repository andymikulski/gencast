"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test file to verify preferReuseCastFunctions works correctly
var Pistol_gen_1 = require("./Pistol.gen");
var User_gen_1 = require("./User.gen");
// Test 1: Valid pistol (extends gun)
var validPistol = {
    caliber: 9,
    manufacturer: 'Glock',
    ammoCapacity: 15,
    hasManualSafety: true,
    gripType: 'polymer'
};
var pistol = (0, Pistol_gen_1.CastToPistol)(validPistol);
if (pistol) {
    console.log('✅ Test 1 passed: Valid pistol cast successfully');
    console.log("   Pistol: ".concat(pistol.manufacturer, " ").concat(pistol.caliber, "mm, capacity: ").concat(pistol.ammoCapacity));
}
else {
    console.log('❌ Test 1 failed: Valid pistol was rejected');
}
// Test 2: Invalid pistol (missing gun properties)
var invalidPistol = {
    hasManualSafety: true,
    gripType: 'polymer'
    // Missing: caliber, manufacturer, ammoCapacity
};
var invalidPistolResult = (0, Pistol_gen_1.CastToPistol)(invalidPistol);
if (invalidPistolResult === null) {
    console.log('✅ Test 2 passed: Invalid pistol correctly rejected');
}
else {
    console.log('❌ Test 2 failed: Invalid pistol was incorrectly accepted');
}
// Test 3: Valid admin (extends user from same file)
var validAdmin = {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    isActive: true,
    role: 'admin',
    permissions: ['read', 'write', 'delete']
};
var admin = (0, User_gen_1.CastToAdmin)(validAdmin);
if (admin) {
    console.log('✅ Test 3 passed: Valid admin cast successfully');
    console.log("   Admin: ".concat(admin.name, " (").concat(admin.email, ")"));
}
else {
    console.log('❌ Test 3 failed: Valid admin was rejected');
}
// Test 4: Invalid admin (missing user properties)
var invalidAdmin = {
    role: 'admin',
    permissions: ['read', 'write', 'delete']
    // Missing: id, name, email, isActive
};
var invalidAdminResult = (0, User_gen_1.CastToAdmin)(invalidAdmin);
if (invalidAdminResult === null) {
    console.log('✅ Test 4 passed: Invalid admin correctly rejected');
}
else {
    console.log('❌ Test 4 failed: Invalid admin was incorrectly accepted');
}
console.log('\nAll tests completed!');
