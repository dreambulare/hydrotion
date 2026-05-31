import type { HydrotionRichText } from "@/src/lib/content/types";

export function RichText({ value }: { value: HydrotionRichText[] | undefined }) {
  return (
    <>
      {(value ?? []).map((span, index) => {
        const className = annotationsToClassName(span.annotations);
        const content = <span className={className}>{span.plainText}</span>;
        return span.href ? (
          <a href={span.href} key={index} rel="noreferrer" target={span.href.startsWith("http") ? "_blank" : undefined}>
            {content}
          </a>
        ) : (
          <span key={index}>{content}</span>
        );
      })}
    </>
  );
}

function annotationsToClassName(annotations: Record<string, boolean | string>) {
  const classNames = [];
  if (annotations.bold) {
    classNames.push("rt-bold");
  }
  if (annotations.italic) {
    classNames.push("rt-italic");
  }
  if (annotations.strikethrough) {
    classNames.push("rt-strike");
  }
  if (annotations.underline) {
    classNames.push("rt-underline");
  }
  if (annotations.code) {
    classNames.push("rt-code");
  }
  if (typeof annotations.color === "string" && annotations.color !== "default") {
    classNames.push(`notion-color-${annotations.color.replaceAll("_", "-")}`);
  }
  return classNames.join(" ");
}
