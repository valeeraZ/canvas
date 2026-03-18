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
  accessToken: string;
  expiresIn: number;
  principal: {
    employeeId: string;
    displayName: string;
    roles: string[];
  };
};
