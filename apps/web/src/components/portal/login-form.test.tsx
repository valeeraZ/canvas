import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  it("renders the amtoken login form", () => {
    const html = renderToString(<LoginForm defaultApp="canvas" />);

    expect(html).toContain("Sign in to Canvas");
    expect(html).toContain("amtoken");
    expect(html).toContain("Start Canvas Session");
    expect(html).toContain("canvas");
  });
});
