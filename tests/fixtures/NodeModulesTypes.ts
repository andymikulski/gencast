// Fixtures for node_modules-declared type references (e.g. lib.d.ts built-ins).

export interface IEvent {
  name: string;
  // Date is declared in lib.es5.d.ts (under node_modules/typescript/lib/)
  occurredAt: Date;
}
