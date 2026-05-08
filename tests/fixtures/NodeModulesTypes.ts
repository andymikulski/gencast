// Fixtures for node_modules-declared type references (e.g. lib.d.ts built-ins).

export interface IEvent {
  name: string;
  // Date is declared in lib.es5.d.ts (under node_modules/typescript/lib/)
  occurredAt: Date;
}

// A type declared in node_modules that is NOT a runtime-global constructor —
// gencast should skip validation for `meta` and document it in a leading comment.
// (We use an inline type that mimics one of the lib.es5 utility types.)
export interface IEventWithUnknown {
  name: string;
  // PropertyDescriptor is declared in lib.es5.d.ts but is a plain interface —
  // there is no `PropertyDescriptor` runtime constructor to instanceof against.
  meta: PropertyDescriptor;
}

// Built-in constructors that should be validated with instanceof.
export interface IBuiltins {
  when: Date;
  pattern: RegExp;
  pending: Promise<string>;
  cause: Error;
  bag: Map<string, number>;
  bytes: Uint8Array;
  many: Date[];
}
