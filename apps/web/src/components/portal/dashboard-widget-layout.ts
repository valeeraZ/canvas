type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type WidgetWithOptionalLayout = {
  id: string;
  layout?: WidgetLayout | null;
};

type WidgetWithLayout = {
  id: string;
  layout: WidgetLayout;
};

const DASHBOARD_WIDGET_COLUMN_COUNT = 2;

function clampWidgetWidth(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return 1;
  }

  return Math.min(Math.trunc(value), DASHBOARD_WIDGET_COLUMN_COUNT);
}

function clampWidgetHeight(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return 1;
  }

  return Math.trunc(value);
}

export function normalizeDashboardCanvasWidgetLayout(
  widget: WidgetWithOptionalLayout,
  index: number
): WidgetLayout {
  return {
    x: widget.layout?.x ?? index % DASHBOARD_WIDGET_COLUMN_COUNT,
    y: widget.layout?.y ?? Math.floor(index / DASHBOARD_WIDGET_COLUMN_COUNT),
    w: clampWidgetWidth(widget.layout?.w),
    h: clampWidgetHeight(widget.layout?.h)
  };
}

function compactDashboardCanvasWidgetsInCurrentOrder<T extends WidgetWithLayout>(
  widgets: T[]
): Array<T & { layout: WidgetLayout }> {
  let x = 0;
  let y = 0;

  return widgets.map((widget) => {
    const width = clampWidgetWidth(widget.layout.w);
    const height = clampWidgetHeight(widget.layout.h);

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

export function sortDashboardCanvasWidgets<T extends WidgetWithOptionalLayout>(widgets: T[]) {
  return [...widgets]
    .map((widget, index) => ({
      ...widget,
      layout: normalizeDashboardCanvasWidgetLayout(widget, index)
    }))
    .sort((left, right) => {
      return (
        left.layout.y - right.layout.y ||
        left.layout.x - right.layout.x ||
        left.id.localeCompare(right.id)
      );
    });
}

export function reorderDashboardCanvasWidgets<T extends WidgetWithOptionalLayout>(
  widgets: T[],
  draggedWidgetId: string,
  targetWidgetId: string
) {
  const sortedWidgets = sortDashboardCanvasWidgets(widgets);
  const sourceIndex = sortedWidgets.findIndex((widget) => widget.id === draggedWidgetId);
  const targetIndex = sortedWidgets.findIndex((widget) => widget.id === targetWidgetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return sortedWidgets;
  }

  const nextWidgets = [...sortedWidgets];
  const [draggedWidget] = nextWidgets.splice(sourceIndex, 1);

  if (!draggedWidget) {
    return sortedWidgets;
  }

  nextWidgets.splice(targetIndex, 0, draggedWidget);

  return compactDashboardCanvasWidgetsInCurrentOrder(nextWidgets);
}

export function resizeDashboardCanvasWidget<T extends WidgetWithOptionalLayout>(
  widgets: T[],
  widgetId: string,
  nextWidth: number
) {
  const sortedWidgets = sortDashboardCanvasWidgets(widgets);
  const widgetIndex = sortedWidgets.findIndex((widget) => widget.id === widgetId);

  if (widgetIndex === -1) {
    return widgets;
  }

  const currentWidget = sortedWidgets[widgetIndex];
  const width = clampWidgetWidth(nextWidth);

  if (!currentWidget || currentWidget.layout.w === width) {
    return widgets;
  }

  const nextWidgets = [...sortedWidgets];
  nextWidgets[widgetIndex] = {
    ...currentWidget,
    layout: {
      ...currentWidget.layout,
      w: width
    }
  };

  return compactDashboardCanvasWidgetsInCurrentOrder(nextWidgets);
}
