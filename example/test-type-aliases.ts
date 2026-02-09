// Test file to verify type alias casting works correctly
import { CastToPoint, CastToCalculator, CastToPoint3D, CastToUser, CastToResult } from './Types.gen';

console.log('Testing Type Alias Casts\n');

// Test 1: Valid Point
const validPoint: any = { x: 10, y: 20 };
const point = CastToPoint(validPoint);
if (point) {
  console.log('✅ Test 1 passed: Valid Point');
  console.log(`   Point: (${point.x}, ${point.y})`);
} else {
  console.log('❌ Test 1 failed: Valid Point was rejected');
}

// Test 2: Invalid Point (missing y)
const invalidPoint: any = { x: 10 };
const invalidPointResult = CastToPoint(invalidPoint);
if (invalidPointResult === null) {
  console.log('✅ Test 2 passed: Invalid Point correctly rejected');
} else {
  console.log('❌ Test 2 failed: Invalid Point was incorrectly accepted');
}

// Test 3: Valid Calculator
const validCalculator: any = {
  add: (a: number, b: number) => a + b,
  multiply: (a: number, b: number) => a * b
};
const calculator = CastToCalculator(validCalculator);
if (calculator) {
  console.log('✅ Test 3 passed: Valid Calculator');
  console.log(`   Calculator add(2, 3) = ${calculator.add(2, 3)}`);
} else {
  console.log('❌ Test 3 failed: Valid Calculator was rejected');
}

// Test 4: Valid Point3D (intersection type)
const validPoint3D: any = { x: 10, y: 20, z: 30 };
const point3D = CastToPoint3D(validPoint3D);
if (point3D) {
  console.log('✅ Test 4 passed: Valid Point3D');
  console.log(`   Point3D: (${point3D.x}, ${point3D.y}, ${point3D.z})`);
} else {
  console.log('❌ Test 4 failed: Valid Point3D was rejected');
}

// Test 5: Invalid Point3D (missing z)
const invalidPoint3D: any = { x: 10, y: 20 };
const invalidPoint3DResult = CastToPoint3D(invalidPoint3D);
if (invalidPoint3DResult === null) {
  console.log('✅ Test 5 passed: Invalid Point3D correctly rejected');
} else {
  console.log('❌ Test 5 failed: Invalid Point3D was incorrectly accepted');
}

// Test 6: Valid User with string literal union
const validUser: any = {
  id: 1,
  name: 'John Doe',
  status: 'active',
  location: { x: 10, y: 20 }
};
const user = CastToUser(validUser);
if (user) {
  console.log('✅ Test 6 passed: Valid User');
  console.log(`   User: ${user.name} (${user.status})`);
} else {
  console.log('❌ Test 6 failed: Valid User was rejected');
}

// Test 7: Invalid User (invalid status)
const invalidUser: any = {
  id: 1,
  name: 'John Doe',
  status: 'invalid-status',
  location: { x: 10, y: 20 }
};
const invalidUserResult = CastToUser(invalidUser);
if (invalidUserResult === null) {
  console.log('✅ Test 7 passed: Invalid User status correctly rejected');
} else {
  console.log('❌ Test 7 failed: Invalid User status was incorrectly accepted');
}

// Test 8: Valid Result (success case)
const validResultSuccess: any = {
  success: true,
  data: 'some data'
};
const resultSuccess = CastToResult(validResultSuccess);
if (resultSuccess) {
  console.log('✅ Test 8 passed: Valid Result (success)');
} else {
  console.log('❌ Test 8 failed: Valid Result (success) was rejected');
}

// Test 9: Valid Result (error case)
const validResultError: any = {
  success: false,
  error: 'some error'
};
const resultError = CastToResult(validResultError);
if (resultError) {
  console.log('✅ Test 9 passed: Valid Result (error)');
} else {
  console.log('❌ Test 9 failed: Valid Result (error) was rejected');
}

console.log('\nAll type alias tests completed!');
