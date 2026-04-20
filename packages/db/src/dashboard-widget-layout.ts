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

function clampDashboardWidgetWidth(value: number | undefined) {
  if (!isFiniteNumber(value) || value < 1) {
    return 1;
  }

  return Math.min(Math.trunc(value), DASHBOARD_WIDGET_COLUMN_COUNT);
}

function clampDashboardWidgetHeight(value: number | undefined) {
  if (!isFiniteNumber(value) || value < 1) {
    return 1;
  }

  return Math.trunc(value);
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
    w: clampDashboardWidgetWidth(input?.w),
    h: clampDashboardWidgetHeight(input?.h)
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
  const orderedWidgets = [...widgets].sort((left, right) => {
    const layoutOrder = compareDashboardWidgetLayout(left.layout, right.layout);
    return layoutOrder || left.id.localeCompare(right.id);
  });

  return compactDashboardWidgetLayoutsInCurrentOrder(orderedWidgets);
}

function compactDashboardWidgetLayoutsInCurrentOrder<
  T extends { id: string; layout: DashboardWidgetLayout }
>(widgets: T[]): Array<T & { layout: DashboardWidgetLayout }> {
  let x = 0;
  let y = 0;

  return widgets.map((widget) => {
    const width = clampDashboardWidgetWidth(widget.layout.w);
    const height = clampDashboardWidgetHeight(widget.layout.h);

    if (x + width > DASHBOARD_WIDGET_COLUMN_COUNT) {
      x = 0;
      y += 1;
    }

    const nextWidget = {
      ...widget,
      layout: {
        x,
        y,
        w: width,
        h: height
      }
    };

    if (width === DASHBOARD_WIDGET_COLUMN_COUNT) {
      x = 0;
      y += 1;
      return nextWidget;
    }

    x += width;

    if (x >= DASHBOARD_WIDGET_COLUMN_COUNT) {
      x = 0;
      y += 1;
    }

    return nextWidget;
  });
}

export function swapDashboardWidgetLayouts<T extends WidgetWithLayout>(
  widgets: T[],
  widgetId: string,
  nextLayout: DashboardWidgetLayout
): Array<T & { layout: DashboardWidgetLayout }> {
  const orderedWidgets = [...widgets].sort((left, right) => {
    const layoutOrder = compareDashboardWidgetLayout(left.layout, right.layout);
    return layoutOrder || left.id.localeCompare(right.id);
  });
  const sourceIndex = orderedWidgets.findIndex((widget) => widget.id === widgetId);

  if (sourceIndex === -1) {
    return widgets.map((widget) => ({ ...widget }));
  }

  const target = orderedWidgets.find((widget) => {
    return (
      widget.id !== widgetId &&
      widget.layout.x === nextLayout.x &&
      widget.layout.y === nextLayout.y
    );
  });

  if (!target) {
    return compactDashboardWidgetLayoutsInCurrentOrder(
      orderedWidgets.map((widget) =>
        widget.id === widgetId
          ? {
              ...widget,
              layout: {
                ...nextLayout,
                w: clampDashboardWidgetWidth(nextLayout.w),
                h: clampDashboardWidgetHeight(nextLayout.h)
              }
            }
          : { ...widget }
      )
    );
  }

  const targetIndex = orderedWidgets.findIndex((widget) => widget.id === target.id);

  if (targetIndex === -1 || sourceIndex === targetIndex) {
    return widgets.map((widget) => ({ ...widget }));
  }

  const nextOrderedWidgets = [...orderedWidgets];
  const [draggedWidget] = nextOrderedWidgets.splice(sourceIndex, 1);

  if (!draggedWidget) {
    return widgets.map((widget) => ({ ...widget }));
  }

  nextOrderedWidgets.splice(targetIndex, 0, draggedWidget);

  return compactDashboardWidgetLayoutsInCurrentOrder(nextOrderedWidgets);
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
    input.x + input.w <= DASHBOARD_WIDGET_COLUMN_COUNT &&
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
