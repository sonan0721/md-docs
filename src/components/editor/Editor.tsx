"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useCallback, useEffect } from "react";
import { markdownToTipTap, tipTapToMarkdown } from "@/lib/editor";
import { FloatingToolbar } from "./FloatingToolbar";
import { SlashCommand } from "./SlashCommand";
import { BacklinkSuggestion } from "./BacklinkSuggestion";

interface EditorProps {
  content: string; // Initial markdown content
  onChange?: (markdown: string) => void;
  editable?: boolean;
  placeholder?: string;
  /** Available documents for backlink suggestions */
  documents?: { slug: string; title: string }[];
  /** Callback when user wants to create a new document from backlink */
  onCreateDocument?: (title: string) => void;
}

export function Editor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing... Type '/' for commands, '[[' for links",
  documents = [],
  onCreateDocument,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: "bg-surface border border-border rounded-md p-4 font-mono text-sm",
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-accent pl-4 italic text-muted",
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-accent underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted before:float-left before:pointer-events-none before:h-0",
      }),
      Underline,
      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose pl-0",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2",
        },
      }),
    ],
    content: markdownToTipTap(content),
    editable,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[300px] " +
          "prose-headings:scroll-mt-20 " +
          "prose-h1:text-2xl prose-h1:font-bold prose-h1:mt-6 prose-h1:mb-4 " +
          "prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 " +
          "prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 " +
          "prose-p:my-4 " +
          "prose-a:text-accent prose-a:no-underline hover:prose-a:underline " +
          "prose-code:bg-surface prose-code:px-1 prose-code:py-0.5 prose-code:rounded " +
          "prose-pre:bg-surface prose-pre:border prose-pre:border-border " +
          "prose-ul:list-disc prose-ol:list-decimal",
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        const json = editor.getJSON();
        const markdown = tipTapToMarkdown(json);
        onChange(markdown);
      }
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== tipTapToMarkdown(editor.getJSON())) {
      editor.commands.setContent(markdownToTipTap(content));
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // set link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("Image URL");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="animate-pulse bg-surface rounded-md h-[300px]" />
    );
  }

  return (
    <div className="relative">
      <FloatingToolbar editor={editor} onLinkClick={setLink} />
      <SlashCommand editor={editor} onInsertImage={insertImage} />
      <BacklinkSuggestion
        editor={editor}
        documents={documents}
        onCreateNew={onCreateDocument}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
