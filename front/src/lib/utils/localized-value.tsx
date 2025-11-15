import type { ReactNode, CSSProperties } from "react";

export const VALUE_PLACEHOLDER = "__VALUE__";
export const INDICATOR_TEXT_PROPS = {
  dir: "rtl" as const,
  style: { unicodeBidi: "plaintext" } as CSSProperties,
};

export const renderLocalizedValue = (
  template: string,
  value: ReactNode,
  valueClassName = ""
) => {
  const [before, after = ""] = template.split(VALUE_PLACEHOLDER);
  const classes = ["inline-flex flex-wrap items-baseline", valueClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {before}
      <span className={classes} style={{ unicodeBidi: "plaintext" }}>
        {value}
      </span>
      {after}
    </>
  );
};
