import { describe, it, expect } from 'vitest';

import { CastToGun } from './fixtures/Gun.gen';
import { CastToPistol } from './fixtures/Pistol.gen';
import { CastToUser as CastToIUser, CastToAdmin, CastToGuest } from './fixtures/User.gen';
import {
  CastToPoint,
  CastToCalculator,
  CastToPoint3D,
  CastToUser as CastToTypeUser,
  CastToResult,
  CastToID,
  CastToUsername,
  CastToIsActive,
  CastToStatus,
} from './fixtures/Types.gen';

// ---------------------------------------------------------------------------
// IGun
// ---------------------------------------------------------------------------

describe('CastToGun', () => {
  const valid = { caliber: 9, manufacturer: 'Glock', ammoCapacity: 17 };

  it('accepts a valid gun object', () => {
    expect(CastToGun(valid)).not.toBeNull();
  });

  it('returns the same object reference on success', () => {
    expect(CastToGun(valid)).toBe(valid);
  });

  it('rejects null', () => {
    expect(CastToGun(null)).toBeNull();
  });

  it('rejects undefined', () => {
    expect(CastToGun(undefined)).toBeNull();
  });

  it('rejects when caliber is wrong type', () => {
    expect(CastToGun({ ...valid, caliber: '9mm' })).toBeNull();
  });

  it('rejects when manufacturer is missing', () => {
    const { manufacturer: _, ...rest } = valid;
    expect(CastToGun(rest)).toBeNull();
  });

  it('rejects when ammoCapacity is wrong type', () => {
    expect(CastToGun({ ...valid, ammoCapacity: 'lots' })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IUser (from User.gen)
// ---------------------------------------------------------------------------

describe('CastToUser (IUser interface)', () => {
  const valid = { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true };

  it('accepts a valid user', () => {
    expect(CastToIUser(valid)).not.toBeNull();
  });

  it('returns the same object reference on success', () => {
    expect(CastToIUser(valid)).toBe(valid);
  });

  it('rejects null', () => {
    expect(CastToIUser(null)).toBeNull();
  });

  it('rejects undefined', () => {
    expect(CastToIUser(undefined)).toBeNull();
  });

  it('rejects when id is not a number', () => {
    expect(CastToIUser({ ...valid, id: '1' })).toBeNull();
  });

  it('rejects when name is not a string', () => {
    expect(CastToIUser({ ...valid, name: 42 })).toBeNull();
  });

  it('rejects when email is missing', () => {
    const { email: _, ...rest } = valid;
    expect(CastToIUser(rest)).toBeNull();
  });

  it('rejects when isActive is not a boolean', () => {
    expect(CastToIUser({ ...valid, isActive: 1 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IAdmin (extends IUser)
// ---------------------------------------------------------------------------

describe('CastToAdmin', () => {
  const valid = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    isActive: true,
    role: 'admin' as const,
    permissions: ['read', 'write'],
  };

  it('accepts a valid admin object', () => {
    expect(CastToAdmin(valid)).not.toBeNull();
  });

  it('rejects when role is not "admin"', () => {
    expect(CastToAdmin({ ...valid, role: 'user' })).toBeNull();
  });

  it('rejects when base IUser properties are missing', () => {
    expect(CastToAdmin({ role: 'admin' as const, permissions: ['read'] })).toBeNull();
  });

  it('rejects when id is wrong type', () => {
    expect(CastToAdmin({ ...valid, id: 'one' })).toBeNull();
  });

  it('rejects null', () => {
    expect(CastToAdmin(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IGuest
// ---------------------------------------------------------------------------

describe('CastToGuest', () => {
  const valid = { sessionId: 'abc123', getDisplayName: () => 'Guest' };

  it('accepts a valid guest', () => {
    expect(CastToGuest(valid)).not.toBeNull();
  });

  it('rejects when getDisplayName is not a function', () => {
    expect(CastToGuest({ ...valid, getDisplayName: 'Guest' })).toBeNull();
  });

  it('rejects when sessionId is missing', () => {
    expect(CastToGuest({ getDisplayName: () => 'Guest' })).toBeNull();
  });

  it('rejects null', () => {
    expect(CastToGuest(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// IPistol (extends IGun, cross-file)
// ---------------------------------------------------------------------------

describe('CastToPistol', () => {
  const valid = {
    caliber: 9,
    manufacturer: 'Glock',
    ammoCapacity: 17,
    hasManualSafety: true,
    gripType: 'polymer',
  };

  it('accepts a valid pistol', () => {
    expect(CastToPistol(valid)).not.toBeNull();
  });

  it('rejects when inherited IGun properties are missing', () => {
    expect(CastToPistol({ hasManualSafety: true, gripType: 'polymer' })).toBeNull();
  });

  it('rejects when pistol-specific properties are missing', () => {
    expect(CastToPistol({ caliber: 9, manufacturer: 'Glock', ammoCapacity: 17 })).toBeNull();
  });

  it('rejects when hasManualSafety is not a boolean', () => {
    expect(CastToPistol({ ...valid, hasManualSafety: 'yes' })).toBeNull();
  });

  it('rejects when gripType is not a string', () => {
    expect(CastToPistol({ ...valid, gripType: 5 })).toBeNull();
  });

  it('rejects null', () => {
    expect(CastToPistol(null)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Primitive type aliases
// ---------------------------------------------------------------------------

describe('CastToID (type ID = number)', () => {
  it('accepts a positive number', () => expect(CastToID(42)).toBe(42));
  it('accepts zero', () => expect(CastToID(0)).toBe(0));
  it('accepts a negative number', () => expect(CastToID(-1)).toBe(-1));
  it('rejects a string', () => expect(CastToID('42')).toBeNull());
  it('rejects null', () => expect(CastToID(null)).toBeNull());
  it('rejects undefined', () => expect(CastToID(undefined)).toBeNull());
  it('rejects a boolean', () => expect(CastToID(true)).toBeNull());
});

describe('CastToUsername (type Username = string)', () => {
  it('accepts a non-empty string', () => expect(CastToUsername('alice')).toBe('alice'));
  it('accepts an empty string', () => expect(CastToUsername('')).toBe(''));
  it('rejects a number', () => expect(CastToUsername(42)).toBeNull());
  it('rejects null', () => expect(CastToUsername(null)).toBeNull());
  it('rejects undefined', () => expect(CastToUsername(undefined)).toBeNull());
});

describe('CastToIsActive (type IsActive = boolean)', () => {
  it('accepts true', () => expect(CastToIsActive(true)).toBe(true));
  it('accepts false', () => expect(CastToIsActive(false)).toBe(false));
  it('rejects a string', () => expect(CastToIsActive('true')).toBeNull());
  it('rejects a number', () => expect(CastToIsActive(1)).toBeNull());
  it('rejects null', () => expect(CastToIsActive(null)).toBeNull());
});

// ---------------------------------------------------------------------------
// String literal union
// ---------------------------------------------------------------------------

describe('CastToStatus (type Status = "active" | "inactive" | "pending")', () => {
  it('accepts "active"', () => expect(CastToStatus('active')).toBe('active'));
  it('accepts "inactive"', () => expect(CastToStatus('inactive')).toBe('inactive'));
  it('accepts "pending"', () => expect(CastToStatus('pending')).toBe('pending'));
  it('rejects an unknown value', () => expect(CastToStatus('deleted')).toBeNull());
  it('rejects a number', () => expect(CastToStatus(1)).toBeNull());
  it('rejects null', () => expect(CastToStatus(null)).toBeNull());
  it('rejects undefined', () => expect(CastToStatus(undefined)).toBeNull());
});

// ---------------------------------------------------------------------------
// Object type aliases
// ---------------------------------------------------------------------------

describe('CastToPoint (type Point = { x, y })', () => {
  it('accepts a valid point', () => expect(CastToPoint({ x: 1, y: 2 })).not.toBeNull());
  it('returns the same object reference', () => {
    const p = { x: 1, y: 2 };
    expect(CastToPoint(p)).toBe(p);
  });
  it('rejects when y is missing', () => expect(CastToPoint({ x: 1 })).toBeNull());
  it('rejects when x is not a number', () => expect(CastToPoint({ x: '1', y: 2 })).toBeNull());
  it('rejects null', () => expect(CastToPoint(null)).toBeNull());
});

describe('CastToPoint3D (type Point3D = Point & { z })', () => {
  it('accepts a valid 3D point', () => expect(CastToPoint3D({ x: 1, y: 2, z: 3 })).not.toBeNull());
  it('rejects a 2D point (missing z)', () => expect(CastToPoint3D({ x: 1, y: 2 })).toBeNull());
  it('rejects when z is not a number', () => expect(CastToPoint3D({ x: 1, y: 2, z: 'up' })).toBeNull());
  it('rejects null', () => expect(CastToPoint3D(null)).toBeNull());
});

describe('CastToCalculator (type with methods)', () => {
  const valid = {
    add: (a: number, b: number) => a + b,
    multiply: (a: number, b: number) => a * b,
  };

  it('accepts an object with the required methods', () => {
    expect(CastToCalculator(valid)).not.toBeNull();
  });

  it('rejects when add is not a function', () => {
    expect(CastToCalculator({ ...valid, add: 5 })).toBeNull();
  });

  it('rejects when multiply is missing', () => {
    expect(CastToCalculator({ add: (a: number, b: number) => a + b })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Complex object type alias — User (from Types.ts, not User.ts)
// ---------------------------------------------------------------------------

describe('CastToUser (type User = { id, name, status, location })', () => {
  const valid = { id: 1, name: 'Alice', status: 'active', location: { x: 0, y: 0 } };

  it('accepts a valid user', () => expect(CastToTypeUser(valid)).not.toBeNull());

  it('rejects with an invalid status string', () => {
    expect(CastToTypeUser({ ...valid, status: 'banned' })).toBeNull();
  });

  it('rejects when location is missing', () => {
    const { location: _, ...rest } = valid;
    expect(CastToTypeUser(rest)).toBeNull();
  });

  it('rejects when id is not a number', () => {
    expect(CastToTypeUser({ ...valid, id: 'one' })).toBeNull();
  });

  it('rejects null', () => expect(CastToTypeUser(null)).toBeNull());
});

// ---------------------------------------------------------------------------
// Union of object types
// ---------------------------------------------------------------------------

describe('CastToResult (union type)', () => {
  it('accepts a success result', () => {
    expect(CastToResult({ success: true, data: 'ok' })).not.toBeNull();
  });

  it('accepts a failure result', () => {
    expect(CastToResult({ success: false, error: 'oops' })).not.toBeNull();
  });

  it('rejects when success is not a boolean', () => {
    expect(CastToResult({ success: 'true', data: 'ok' })).toBeNull();
  });

  it('rejects null', () => expect(CastToResult(null)).toBeNull());
});
