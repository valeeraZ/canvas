import { PortalShell } from "@/components/portal/portal-shell";

export default function PortalHomePage() {
  return <PortalShell apps={["canvas", "canvas-ops"]} currentApp="canvas" />;
}
