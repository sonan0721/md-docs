"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Code,
} from "lucide-react";

interface FloatingToolbarProps {
  editor: Editor;
  onLinkClick: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({
  onClick,
  isActive,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-md transition-colors ${
        isActive
          ? "bg-accent text-white"
          : "text-text hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

export function FloatingToolbar({ editor, onLinkClick }: FloatingToolbarProps) {
  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
        offset: 8,
      }}
      className="flex items-center gap-0.5 bg-background border border-border rounded-lg shadow-lg p-1"
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Cmd+B)"
      >
        <Bold size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Cmd+I)"
      >
        <Italic size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline (Cmd+U)"
      >
        <Underline size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-border mx-1" />

      <ToolbarButton
        onClick={onLinkClick}
        isActive={editor.isActive("link")}
        title="Link (Cmd+K)"
      >
        <Link size={16} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline Code"
      >
        <Code size={16} />
      </ToolbarButton>
    </BubbleMenu>
  );
}
