import { decodeCanvasAccessToken } from "../../../../../../packages/auth/src/canvas-token-decode";
import { mintCanvasAccessToken } from "../../../../../../packages/auth/src/canvas-token";

export async function selectApp(input: {
  accessToken: string;
  appName: string;
}) {
  const claims = decodeCanvasAccessToken(input.accessToken);

  const nextAccessToken = mintCanvasAccessToken({
    tenantId: input.appName,
    externalUserId: claims.externalUserId,
    roles: claims.roles
  });

  return {
    tenantId: input.appName,
    roles: claims.roles,
    accessToken: nextAccessToken
  };
}
