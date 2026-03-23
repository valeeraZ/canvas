export type SessionExchangeInput = {
  authBaseUrl: string;
  token: string;
  appName: string;
  mockContext?: {
    displayName: string;
    employeeId: string;
    roles: string[];
  };
};

export type SessionExchangeResult = {
  expiresIn: number;
  selectedApp: string;
  principal: {
    employeeId: string;
    displayName: string;
    roles: string[];
  };
};
