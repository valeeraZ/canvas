export type PrincipalRecord = {
  id?: string;
  externalUserId: string;
};

export function buildPrincipalRecord(input: PrincipalRecord): PrincipalRecord {
  return {
    id: input.id,
    externalUserId: input.externalUserId
  };
}
