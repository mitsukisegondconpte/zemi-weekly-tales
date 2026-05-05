import { forwardRef, useImperativeHandle, useEffect } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, List, ListOrdered,
  Quote, Link as LinkIcon, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Eraser,
} from "lucide-react";

export type RichTextEditorHandle = {
  insertImage: (url: string) => void;
  focus: () => void;
  getEditor: () => Editor | null;
};

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const ToolbarBtn = ({
  active, onClick, title, children, disabled,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`h-8 w-8 inline-flex items-center justify-center rounded-md text-sm transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-foreground hover:bg-secondary"
    } disabled:opacity-40`}
  >
    {children}
  </button>
);

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  ({ value, onChange, placeholder, minHeight = 280 }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Underline,
        Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: "text-primary underline" } }),
        Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-2" } }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Placeholder.configure({ placeholder: placeholder || "Ekri isit..." }),
      ],
      content: value || "",
      editorProps: {
        attributes: {
          class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3",
          style: `min-height:${minHeight}px`,
        },
      },
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    // Sync external value changes (e.g. PDF import) without losing focus on every keystroke
    useEffect(() => {
      if (!editor) return;
      const current = editor.getHTML();
      if (value !== current && !editor.isFocused) {
        editor.commands.setContent(value || "", { emitUpdate: false });
      }
    }, [value, editor]);

    useImperativeHandle(ref, () => ({
      insertImage: (url: string) => {
        if (!editor) return;
        editor.chain().focus().setImage({ src: url }).run();
      },
      focus: () => editor?.commands.focus(),
      getEditor: () => editor,
    }), [editor]);

    if (!editor) return null;

    const setLink = () => {
      const prev = editor.getAttributes("link").href;
      const url = window.prompt("URL lyen an:", prev || "https://");
      if (url === null) return;
      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    return (
      <div className="rich-editor">
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 p-1.5">
          <ToolbarBtn title="H1" active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="H2" active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="H3" active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4" />
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarBtn title="Bold" active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Italic" active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Underline" active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UIcon className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Strike" active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="h-4 w-4" />
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarBtn title="Lis" active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Lis Nimewote" active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Sitasyon" active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarBtn title="Aliman gòch" active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Aliman sant" active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Aliman dwat" active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="h-4 w-4" />
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolbarBtn title="Lyen" active={editor.isActive("link")} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarBtn>
          <ToolbarBtn title="Efase fòma"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <Eraser className="h-4 w-4" />
          </ToolbarBtn>
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
export default RichTextEditor;
