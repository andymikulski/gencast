"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Comprehensive test for all type alias features
var Types_gen_1 = require("./Types.gen");
console.log('Testing Primitive and String Literal Type Casts\n');
// Test 1: Valid ID (number)
var validID = 123;
var id = (0, Types_gen_1.CastToID)(validID);
if (id === 123) {
    console.log('✅ Test 1 passed: Valid number cast to ID');
    console.log("   ID: ".concat(id));
}
else {
    console.log('❌ Test 1 failed: Valid number was rejected');
}
// Test 2: Invalid ID (string instead of number)
var invalidID = "not-a-number";
var invalidIDResult = (0, Types_gen_1.CastToID)(invalidID);
if (invalidIDResult === null) {
    console.log('✅ Test 2 passed: Invalid ID (string) correctly rejected');
}
else {
    console.log('❌ Test 2 failed: Invalid ID was incorrectly accepted');
}
// Test 3: Valid Username (string)
var validUsername = "john_doe";
var username = (0, Types_gen_1.CastToUsername)(validUsername);
if (username === "john_doe") {
    console.log('✅ Test 3 passed: Valid string cast to Username');
    console.log("   Username: ".concat(username));
}
else {
    console.log('❌ Test 3 failed: Valid string was rejected');
}
// Test 4: Invalid Username (number instead of string)
var invalidUsername = 123;
var invalidUsernameResult = (0, Types_gen_1.CastToUsername)(invalidUsername);
if (invalidUsernameResult === null) {
    console.log('✅ Test 4 passed: Invalid Username (number) correctly rejected');
}
else {
    console.log('❌ Test 4 failed: Invalid Username was incorrectly accepted');
}
// Test 5: Valid IsActive (boolean - true)
var validIsActiveTrue = true;
var isActiveTrue = (0, Types_gen_1.CastToIsActive)(validIsActiveTrue);
if (isActiveTrue === true) {
    console.log('✅ Test 5 passed: Valid boolean (true) cast to IsActive');
}
else {
    console.log('❌ Test 5 failed: Valid boolean (true) was rejected');
}
// Test 6: Valid IsActive (boolean - false)
var validIsActiveFalse = false;
var isActiveFalse = (0, Types_gen_1.CastToIsActive)(validIsActiveFalse);
if (isActiveFalse === false) {
    console.log('✅ Test 6 passed: Valid boolean (false) cast to IsActive');
}
else {
    console.log('❌ Test 6 failed: Valid boolean (false) was rejected');
}
// Test 7: Invalid IsActive (string instead of boolean)
var invalidIsActive = "true";
var invalidIsActiveResult = (0, Types_gen_1.CastToIsActive)(invalidIsActive);
if (invalidIsActiveResult === null) {
    console.log('✅ Test 7 passed: Invalid IsActive (string) correctly rejected');
}
else {
    console.log('❌ Test 7 failed: Invalid IsActive was incorrectly accepted');
}
// Test 8: Valid Status - "active"
var validStatusActive = "active";
var statusActive = (0, Types_gen_1.CastToStatus)(validStatusActive);
if (statusActive === "active") {
    console.log('✅ Test 8 passed: Valid Status "active"');
}
else {
    console.log('❌ Test 8 failed: Valid Status "active" was rejected');
}
// Test 9: Valid Status - "inactive"
var validStatusInactive = "inactive";
var statusInactive = (0, Types_gen_1.CastToStatus)(validStatusInactive);
if (statusInactive === "inactive") {
    console.log('✅ Test 9 passed: Valid Status "inactive"');
}
else {
    console.log('❌ Test 9 failed: Valid Status "inactive" was rejected');
}
// Test 10: Valid Status - "pending"
var validStatusPending = "pending";
var statusPending = (0, Types_gen_1.CastToStatus)(validStatusPending);
if (statusPending === "pending") {
    console.log('✅ Test 10 passed: Valid Status "pending"');
}
else {
    console.log('❌ Test 10 failed: Valid Status "pending" was rejected');
}
// Test 11: Invalid Status (not one of the allowed values)
var invalidStatus = "invalid-status";
var invalidStatusResult = (0, Types_gen_1.CastToStatus)(invalidStatus);
if (invalidStatusResult === null) {
    console.log('✅ Test 11 passed: Invalid Status correctly rejected');
}
else {
    console.log('❌ Test 11 failed: Invalid Status was incorrectly accepted');
}
// Test 12: Invalid Status (number instead of string)
var invalidStatusNumber = 123;
var invalidStatusNumberResult = (0, Types_gen_1.CastToStatus)(invalidStatusNumber);
if (invalidStatusNumberResult === null) {
    console.log('✅ Test 12 passed: Invalid Status (number) correctly rejected');
}
else {
    console.log('❌ Test 12 failed: Invalid Status (number) was incorrectly accepted');
}
// Test 13: Object types still work
var validPoint = { x: 10, y: 20 };
var point = (0, Types_gen_1.CastToPoint)(validPoint);
if (point && point.x === 10 && point.y === 20) {
    console.log('✅ Test 13 passed: Object type casts still work');
    console.log("   Point: (".concat(point.x, ", ").concat(point.y, ")"));
}
else {
    console.log('❌ Test 13 failed: Object type cast failed');
}
console.log('\n🎉 All primitive and string literal type tests completed!');
