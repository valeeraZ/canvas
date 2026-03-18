export type CanvasTokenClaims = {
  tenantId: string;
  externalUserId: string;
  roles: string[];
};

export function mintCanvasAccessToken(claims: CanvasTokenClaims): string {
  return `canvas.${claims.tenantId}.${claims.externalUserId}.${claims.roles.join(",")}`;
}
