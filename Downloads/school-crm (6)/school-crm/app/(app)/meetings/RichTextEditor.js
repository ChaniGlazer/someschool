"use client";

import { useEffect, useRef } from "react";

const BUTTONS = [
  { command: "bold", label: "B", style: { fontWeight: 700 } },
  { command: "italic", label: "I", style: { fontStyle: "italic" } },
  { command: "strikeThrough", label: "S", style: { textDecoration: "line-through" } },
  { command: "formatBlock:PRE", label: "</>", style: { fontFamily: "monospace", fontSize: 12 } },
  { command: "formatBlock:H1", label: "H1", style: { fontWeight: 700, fontSize: 12 } },
  { command: "formatBlock:H2", label: "H2", style: { fontWeight: 700, fontSize: 12 } },
  { command: "formatBlock:H3", label: "H3", style: { fontWeight: 700, fontSize: 12 } },
  { command: "insertUnorderedList", label: "☰", style: {} },
  { command: "insertOrderedList", label: "1.", style: {} },
];

export default function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const isFirstRender = useRef(true);

  // מסנכרן ערך חיצוני (למשל בעת פתיחת מודל עריכה) בלי לאפס את הסמן בכל הקלדה
  useEffect(() => {
    if (ref.current && isFirstRender.current) {
      ref.current.innerHTML = value || "";
      isFirstRender.current = false;
    }
  }, [value]);

  function runCommand(command) {
    ref.current?.focus();
    if (command.startsWith("formatBlock:")) {
      const tag = command.split(":")[1];
      document.execCommand("formatBlock", false, tag);
    } else {
      document.execCommand(command, false, null);
    }
    onChange(ref.current?.innerHTML || "");
  }

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "6px 8px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-alt)",
          flexWrap: "wrap",
        }}
      >
        {BUTTONS.map((btn) => (
          <button
            key={btn.command}
            type="button"
            onClick={() => runCommand(btn.command)}
            style={{
              minWidth: 28,
              height: 28,
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              background: "var(--color-surface)",
              color: "var(--color-sage-dark)",
              cursor: "pointer",
              ...btn.style,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || "")}
        onBlur={() => onChange(ref.current?.innerHTML || "")}
        data-placeholder={placeholder}
        className="rich-text-editable"
        style={{
          minHeight: 160,
          padding: "12px 14px",
          fontSize: 14,
          lineHeight: 1.6,
          outline: "none",
        }}
      />
    </div>
  );
}
