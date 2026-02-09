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
