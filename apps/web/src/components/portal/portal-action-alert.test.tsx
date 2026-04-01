import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { PortalApiError } from "../../lib/portal/api-client";
import { PortalActionAlert } from "./portal-action-alert";

describe("PortalActionAlert", () => {
  it("renders a safe generic message with request id", () => {
    const html = renderToString(
      <PortalActionAlert
        error={
          new PortalApiError({
            message: "Request failed",
            requestId: "0df37bf3-ae96-41a0-949b-90ebf57de8b5"
          })
        }
      />
    );

    expect(html).toContain("We couldn&#x27;t complete this action");
    expect(html).toContain("Request ID");
    expect(html).toContain("0df37bf3-ae96-41a0-949b-90ebf57de8b5");
  });
});
