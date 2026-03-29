import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
  it("stacks horizontal tabs above content", () => {
    const html = renderToString(
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
      </Tabs>
    );

    expect(html).toContain("data-orientation=\"horizontal\"");
    expect(html).toContain("flex flex-col gap-4");
    expect(html).toContain("group-data-[orientation=horizontal]/tabs:after:bottom-[-9px]");
  });
});
