import type {
  SessionBootstrapInput,
  SessionBootstrapResult
} from "../../../../contracts/src/bootstrap";

export async function bootstrapSession(
  _: SessionBootstrapInput
): Promise<SessionBootstrapResult> {
  return { status: "ready" };
}
