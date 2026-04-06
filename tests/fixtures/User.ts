export interface IUser {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export interface IAdmin extends IUser {
  role: "admin";
  permissions: string[];
}

export interface IGuest {
  sessionId: string;
  getDisplayName(): string;
}

// Example class to demonstrate class-based casting
export class UserAccount {
  constructor(
    public id: number,
    public username: string,
    public createdAt: Date
  ) {}

  isExpired(): boolean {
    return Date.now() - this.createdAt.getTime() > 1000 * 60 * 60 * 24 * 365;
  }
}

export class AdminAccount extends UserAccount {
  constructor(
    id: number,
    username: string,
    createdAt: Date,
    public privileges: string[]
  ) {
    super(id, username, createdAt);
  }
}
