import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import "../styles/rich-text-editor.css";

function normalizeContent(value) {
  if (!value) return "";

  // Preserve content already saved as HTML.
  if (/<\/?[a-z][\s\S]*>/i.test(value)) {
    return value;
  }

  // Convert legacy plain text to safe paragraph HTML.
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => {
      const escaped = paragraph
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r?\n/g, "<br>");

      return `<p>${escaped}</p>`;
    })
    .join("");
}

function RichTextEditor({ value, onChange, disabled = false }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    const nextContent = value || "";

    if (currentContent !== nextContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return <p>Loading editor...</p>;
  }

  function addLink() {
    const existingUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter a link URL (https://...)", existingUrl);

    if (url === null) return;

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    try {
      const parsedUrl = new URL(url.trim());

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }

      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: parsedUrl.href })
        .run();
    } catch {
      window.alert("Please enter a valid http:// or https:// URL.");
    }
  }

  const tools = [
    {
      label: "Bold",
      title: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      mark: "B",
    },
    {
      label: "Italic",
      title: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      mark: "I",
    },
    {
      label: "Heading 2",
      title: "Heading 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      mark: "H2",
    },
    {
      label: "Heading 3",
      title: "Heading 3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
      mark: "H3",
    },
    {
      label: "Bullet list",
      title: "Bullet list",
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      mark: "• List",
    },
    {
      label: "Numbered list",
      title: "Numbered list",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      mark: "1. List",
    },
    {
      label: "Quote",
      title: "Blockquote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
      mark: "Quote",
    },
  ];

  return (
    <div className="rte">
      <div
        className="rte-toolbar"
        role="toolbar"
        aria-label="Article formatting"
      >
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            aria-pressed={tool.active}
            className={tool.active ? "is-active" : ""}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={tool.action}
          >
            {tool.mark}
          </button>
        ))}

        <button
          type="button"
          title="Add or edit link"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={addLink}
        >
          Link
        </button>

        <button
          type="button"
          title="Remove formatting"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          Clear
        </button>

        <button
          type="button"
          title="Undo"
          disabled={disabled || !editor.can().undo()}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          Undo
        </button>

        <button
          type="button"
          title="Redo"
          disabled={disabled || !editor.can().redo()}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>

      <EditorContent editor={editor} className="rte-content" />
    </div>
  );
}

export default RichTextEditor;
