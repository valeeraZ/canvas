import React from "react";
import { LoginForm } from "../../../components/portal/login-form";

export default function PortalLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6 py-10">
      <LoginForm defaultApp="canvas" />
    </main>
  );
}
