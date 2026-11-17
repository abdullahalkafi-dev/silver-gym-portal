"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/**
 * Plan / template editor. Only the formatting the server keeps is offered
 * (headings, bold, italic, underline, lists, undo/redo), so what the trainer
 * sees here is exactly what the member will read.
 *
 * `value` is HTML. To replace the text from outside (e.g. "Use a template"),
 * change `value` and bump `version`.
 */
export default function RichTextEditor({
  value,
  version = 0,
  onChange,
  placeholder = "Write the plan here...",
  invalid,
}: {
  value: string;
  version?: number;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: false,
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "plan-content min-h-[16rem] px-4 py-3 outline-none",
        "aria-label": "Plan text",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
  });

  // Text replaced from outside (template picked, form reset).
  useEffect(() => {
    if (editor && version > 0) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, version]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
            empty: e.isEmpty,
          }
        : null,
  });

  const run = (fn: () => void) => () => {
    fn();
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white transition-colors focus-within:border-focus focus-within:shadow-[0_0_0_3px_var(--color-focus-ring)] ${
        invalid ? "border-red-400" : "border-gray-300"
      }`}
    >
      {/* Toolbar: scrolls sideways on narrow phones instead of wrapping */}
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 p-1.5 [scrollbar-width:none]"
      >
        <Tool label="Heading" active={state?.h2} onClick={run(() => editor?.chain().focus().toggleHeading({ level: 2 }).run())}>
          <span className="text-[15px] font-bold">H</span>
        </Tool>
        <Tool label="Small heading" active={state?.h3} onClick={run(() => editor?.chain().focus().toggleHeading({ level: 3 }).run())}>
          <span className="text-[13px] font-bold">h</span>
        </Tool>
        <Divider />
        <Tool label="Bold" active={state?.bold} onClick={run(() => editor?.chain().focus().toggleBold().run())}>
          <span className="font-bold">B</span>
        </Tool>
        <Tool label="Italic" active={state?.italic} onClick={run(() => editor?.chain().focus().toggleItalic().run())}>
          <span className="font-serif italic">I</span>
        </Tool>
        <Tool label="Underline" active={state?.underline} onClick={run(() => editor?.chain().focus().toggleUnderline().run())}>
          <span className="underline">U</span>
        </Tool>
        <Divider />
        <Tool label="Bullet list" active={state?.bullet} onClick={run(() => editor?.chain().focus().toggleBulletList().run())}>
          <BulletIcon />
        </Tool>
        <Tool label="Numbered list" active={state?.ordered} onClick={run(() => editor?.chain().focus().toggleOrderedList().run())}>
          <NumberIcon />
        </Tool>
        <Divider />
        <Tool label="Undo" disabled={!state?.canUndo} onClick={run(() => editor?.chain().focus().undo().run())}>
          <UndoIcon />
        </Tool>
        <Tool label="Redo" disabled={!state?.canRedo} onClick={run(() => editor?.chain().focus().redo().run())}>
          <UndoIcon flip />
        </Tool>
      </div>

      <div className="relative">
        {state?.empty !== false ? (
          <p className="pointer-events-none absolute left-4 top-3 text-base text-gray-400 sm:text-sm">{placeholder}</p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // keep the text selection when tapping a button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-md px-2 text-[15px] transition-colors disabled:opacity-35 ${
        active ? "bg-primary-100 text-primary-700" : "text-gray-700 hover:bg-gray-200 active:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-0.5 my-2 w-px shrink-0 bg-gray-200" />;

const svg = "h-5 w-5";
function BulletIcon() {
  return (
    <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}
function NumberIcon() {
  return (
    <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="M4 5l1.5-1v5M3.5 14.5c.4-.6 1-.9 1.6-.8.8.1 1.2.8.9 1.5L3.5 18.5H6.5" strokeWidth="1.4" />
    </svg>
  );
}
function UndoIcon({ flip }: { flip?: boolean }) {
  return (
    <svg className={`${svg} ${flip ? "-scale-x-100" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
    </svg>
  );
}
