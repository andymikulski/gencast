// Test various type alias patterns

// Simple primitive aliases - should now generate casts!
export type ID = number;
export type Username = string;
export type IsActive = boolean;

// Object type alias - should generate cast
export type Point = {
  x: number;
  y: number;
};

// Object type alias with methods - should generate cast
export type Calculator = {
  add(a: number, b: number): number;
  multiply(a: number, b: number): number;
};

// Union of string literals - could potentially generate cast
export type Status = 'active' | 'inactive' | 'pending';

// Type extending another - should generate cast
export type Point3D = Point & {
  z: number;
};

// Complex object type
export type User = {
  id: number;
  name: string;
  status: Status;
  location: Point;
};

// Union type with objects - more complex, let's see how we handle it
export type Result =
  | { success: true; data: string }
  | { success: false; error: string };
