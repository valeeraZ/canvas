import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Bar, BarChart } from "recharts";
import { ChartContainer } from "./chart";

describe("ChartContainer", () => {
  it("renders a shared chart wrapper for portal charts", () => {
    const html = renderToString(
      <ChartContainer
        id="revenue"
        config={{
          revenue: {
            label: "Revenue",
            color: "#0f766e"
          }
        }}
      >
        <BarChart data={[{ month: "Jan", revenue: 120 }]}>
          <Bar dataKey="revenue" fill="var(--color-revenue)" />
        </BarChart>
      </ChartContainer>
    );

    expect(html).toContain('data-slot="chart"');
    expect(html).toContain("data-chart=\"chart-revenue\"");
    expect(html).toContain("--color-revenue: #0f766e;");
  });
});
