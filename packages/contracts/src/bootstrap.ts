export type SessionBootstrapInput = {
  signedAssertion: string;
  exchangeUrl: string;
};

export type SessionBootstrapResult = {
  status: "ready";
};
