"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test file to verify type alias casting works correctly
var Types_gen_1 = require("./Types.gen");
console.log('Testing Type Alias Casts\n');
// Test 1: Valid Point
var validPoint = { x: 10, y: 20 };
var point = (0, Types_gen_1.CastToPoint)(validPoint);
if (point) {
    console.log('✅ Test 1 passed: Valid Point');
    console.log("   Point: (".concat(point.x, ", ").concat(point.y, ")"));
}
else {
    console.log('❌ Test 1 failed: Valid Point was rejected');
}
// Test 2: Invalid Point (missing y)
var invalidPoint = { x: 10 };
var invalidPointResult = (0, Types_gen_1.CastToPoint)(invalidPoint);
if (invalidPointResult === null) {
    console.log('✅ Test 2 passed: Invalid Point correctly rejected');
}
else {
    console.log('❌ Test 2 failed: Invalid Point was incorrectly accepted');
}
// Test 3: Valid Calculator
var validCalculator = {
    add: function (a, b) { return a + b; },
    multiply: function (a, b) { return a * b; }
};
var calculator = (0, Types_gen_1.CastToCalculator)(validCalculator);
if (calculator) {
    console.log('✅ Test 3 passed: Valid Calculator');
    console.log("   Calculator add(2, 3) = ".concat(calculator.add(2, 3)));
}
else {
    console.log('❌ Test 3 failed: Valid Calculator was rejected');
}
// Test 4: Valid Point3D (intersection type)
var validPoint3D = { x: 10, y: 20, z: 30 };
var point3D = (0, Types_gen_1.CastToPoint3D)(validPoint3D);
if (point3D) {
    console.log('✅ Test 4 passed: Valid Point3D');
    console.log("   Point3D: (".concat(point3D.x, ", ").concat(point3D.y, ", ").concat(point3D.z, ")"));
}
else {
    console.log('❌ Test 4 failed: Valid Point3D was rejected');
}
// Test 5: Invalid Point3D (missing z)
var invalidPoint3D = { x: 10, y: 20 };
var invalidPoint3DResult = (0, Types_gen_1.CastToPoint3D)(invalidPoint3D);
if (invalidPoint3DResult === null) {
    console.log('✅ Test 5 passed: Invalid Point3D correctly rejected');
}
else {
    console.log('❌ Test 5 failed: Invalid Point3D was incorrectly accepted');
}
// Test 6: Valid User with string literal union
var validUser = {
    id: 1,
    name: 'John Doe',
    status: 'active',
    location: { x: 10, y: 20 }
};
var user = (0, Types_gen_1.CastToUser)(validUser);
if (user) {
    console.log('✅ Test 6 passed: Valid User');
    console.log("   User: ".concat(user.name, " (").concat(user.status, ")"));
}
else {
    console.log('❌ Test 6 failed: Valid User was rejected');
}
// Test 7: Invalid User (invalid status)
var invalidUser = {
    id: 1,
    name: 'John Doe',
    status: 'invalid-status',
    location: { x: 10, y: 20 }
};
var invalidUserResult = (0, Types_gen_1.CastToUser)(invalidUser);
if (invalidUserResult === null) {
    console.log('✅ Test 7 passed: Invalid User status correctly rejected');
}
else {
    console.log('❌ Test 7 failed: Invalid User status was incorrectly accepted');
}
// Test 8: Valid Result (success case)
var validResultSuccess = {
    success: true,
    data: 'some data'
};
var resultSuccess = (0, Types_gen_1.CastToResult)(validResultSuccess);
if (resultSuccess) {
    console.log('✅ Test 8 passed: Valid Result (success)');
}
else {
    console.log('❌ Test 8 failed: Valid Result (success) was rejected');
}
// Test 9: Valid Result (error case)
var validResultError = {
    success: false,
    error: 'some error'
};
var resultError = (0, Types_gen_1.CastToResult)(validResultError);
if (resultError) {
    console.log('✅ Test 9 passed: Valid Result (error)');
}
else {
    console.log('❌ Test 9 failed: Valid Result (error) was rejected');
}
console.log('\nAll type alias tests completed!');
