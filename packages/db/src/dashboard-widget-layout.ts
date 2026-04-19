import type {
  DashboardWidgetLayout,
  DashboardWidgetRecord
} from "../../../packages/contracts/src/index.js";

export const DASHBOARD_WIDGET_COLUMN_COUNT = 2;

type MaybeLayout = Partial<DashboardWidgetLayout> | null | undefined;

type WidgetWithLayout = {
  id: string;
  layout: DashboardWidgetLayout;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getDefaultDashboardWidgetLayout(index: number): DashboardWidgetLayout {
  return {
    x: index % DASHBOARD_WIDGET_COLUMN_COUNT,
    y: Math.floor(index / DASHBOARD_WIDGET_COLUMN_COUNT),
    w: 1,
    h: 1
  };
}

export function normalizeDashboardWidgetLayout(
  input: MaybeLayout,
  index: number
): DashboardWidgetLayout {
  const fallback = getDefaultDashboardWidgetLayout(index);

  return {
    x: isFiniteNumber(input?.x) ? input.x : fallback.x,
    y: isFiniteNumber(input?.y) ? input.y : fallback.y,
    w: isFiniteNumber(input?.w) && input.w > 0 ? input.w : 1,
    h: isFiniteNumber(input?.h) && input.h > 0 ? input.h : 1
  };
}

export function compareDashboardWidgetLayout(
  left: DashboardWidgetLayout,
  right: DashboardWidgetLayout
) {
  return left.y - right.y || left.x - right.x;
}

export function compactDashboardWidgetLayouts<T extends { id: string; layout: DashboardWidgetLayout }>(
  widgets: T[]
): Array<T & { layout: DashboardWidgetLayout }> {
  return [...widgets]
    .sort((left, right) => {
      const layoutOrder = compareDashboardWidgetLayout(left.layout, right.layout);
      return layoutOrder || left.id.localeCompare(right.id);
    })
    .map((widget, index) => ({
      ...widget,
      layout: getDefaultDashboardWidgetLayout(index)
    }));
}

export function swapDashboardWidgetLayouts<T extends WidgetWithLayout>(
  widgets: T[],
  widgetId: string,
  nextLayout: DashboardWidgetLayout
): Array<T & { layout: DashboardWidgetLayout }> {
  const source = widgets.find((widget) => widget.id === widgetId);

  if (!source) {
    return widgets.map((widget) => ({ ...widget }));
  }

  const target = widgets.find((widget) => {
    return (
      widget.id !== widgetId &&
      widget.layout.x === nextLayout.x &&
      widget.layout.y === nextLayout.y
    );
  });

  return widgets.map((widget) => {
    if (widget.id === widgetId) {
      return {
        ...widget,
        layout: nextLayout
      };
    }

    if (target && widget.id === target.id) {
      return {
        ...widget,
        layout: source.layout
      };
    }

    return {
      ...widget
    };
  });
}

export function isValidDashboardWidgetLayout(input: DashboardWidgetLayout) {
  return (
    Number.isInteger(input.x) &&
    input.x >= 0 &&
    input.x < DASHBOARD_WIDGET_COLUMN_COUNT &&
    Number.isInteger(input.y) &&
    input.y >= 0 &&
    Number.isInteger(input.w) &&
    input.w > 0 &&
    Number.isInteger(input.h) &&
    input.h > 0
  );
}

export function sortDashboardWidgetRecords<T extends Pick<DashboardWidgetRecord, "id" | "layout">>(
  widgets: T[]
) {
  return [...widgets].sort((left, right) => {
    const layoutOrder = compareDashboardWidgetLayout(left.layout, right.layout);
    return layoutOrder || left.id.localeCompare(right.id);
  });
}
