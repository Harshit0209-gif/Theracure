export interface Session {
  user: {
    id: string;
    email: string;
    role: string;
  };
  expires: string;
  tokenExpiry: number;
}

export interface SessionManagerConfig {
  inactivityTimeout: number;
  checkInterval: number;
}
