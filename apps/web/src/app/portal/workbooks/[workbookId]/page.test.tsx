import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn()
  }),
  notFound: vi.fn()
}));

describe("PortalWorkbookDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    redirectMock.mockReset();
  });

  it("redirects removed workbook detail pages back to the portal", async () => {
    const module = await import("./page");
    await module.default();

    expect(redirectMock).toHaveBeenCalledWith("/portal");
  });
});
