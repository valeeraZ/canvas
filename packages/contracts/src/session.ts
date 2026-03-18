export type SessionExchangeInput = {
  authBaseUrl: string;
  token: string;
  appName: string;
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
