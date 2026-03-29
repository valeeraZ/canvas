import React, { type ReactNode } from "react";
import { TooltipProvider } from "../components/ui/tooltip";
import "./globals.css";

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TooltipProvider>{props.children}</TooltipProvider>
      </body>
    </html>
  );
}
