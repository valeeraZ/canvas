import React, { type ReactNode } from "react";
import "./globals.css";

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas-bg text-canvas-ink antialiased">
        {props.children}
      </body>
    </html>
  );
}
