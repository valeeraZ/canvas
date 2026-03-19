import React from "react";

export function WidgetPicker(props: {
  widgetTypes: string[];
  onSelect: (type: string) => void;
}) {
  return (
    <section>
      {props.widgetTypes.map((type) => (
        <button key={type} onClick={() => props.onSelect(type)}>
          {type}
        </button>
      ))}
    </section>
  );
}
