// Test file to verify preferReuseCastFunctions works correctly
import { CastToPistol } from './Pistol.gen';
import { CastToAdmin } from './User.gen';

// Test 1: Valid pistol (extends gun)
const validPistol: any = {
  caliber: 9,
  manufacturer: 'Glock',
  ammoCapacity: 15,
  hasManualSafety: true,
  gripType: 'polymer'
};

const pistol = CastToPistol(validPistol);
if (pistol) {
  console.log('✅ Test 1 passed: Valid pistol cast successfully');
  console.log(`   Pistol: ${pistol.manufacturer} ${pistol.caliber}mm, capacity: ${pistol.ammoCapacity}`);
} else {
  console.log('❌ Test 1 failed: Valid pistol was rejected');
}

// Test 2: Invalid pistol (missing gun properties)
const invalidPistol: any = {
  hasManualSafety: true,
  gripType: 'polymer'
  // Missing: caliber, manufacturer, ammoCapacity
};

const invalidPistolResult = CastToPistol(invalidPistol);
if (invalidPistolResult === null) {
  console.log('✅ Test 2 passed: Invalid pistol correctly rejected');
} else {
  console.log('❌ Test 2 failed: Invalid pistol was incorrectly accepted');
}

// Test 3: Valid admin (extends user from same file)
const validAdmin: any = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  isActive: true,
  role: 'admin',
  permissions: ['read', 'write', 'delete']
};

const admin = CastToAdmin(validAdmin);
if (admin) {
  console.log('✅ Test 3 passed: Valid admin cast successfully');
  console.log(`   Admin: ${admin.name} (${admin.email})`);
} else {
  console.log('❌ Test 3 failed: Valid admin was rejected');
}

// Test 4: Invalid admin (missing user properties)
const invalidAdmin: any = {
  role: 'admin',
  permissions: ['read', 'write', 'delete']
  // Missing: id, name, email, isActive
};

const invalidAdminResult = CastToAdmin(invalidAdmin);
if (invalidAdminResult === null) {
  console.log('✅ Test 4 passed: Invalid admin correctly rejected');
} else {
  console.log('❌ Test 4 failed: Invalid admin was incorrectly accepted');
}

console.log('\nAll tests completed!');
