"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Image,
} from "lucide-react";

interface SlashCommandProps {
  editor: Editor;
  onInsertImage: () => void;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: string;
  action: (editor: Editor) => void;
}

export function SlashCommand({ editor, onInsertImage }: SlashCommandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    {
      title: "Heading 1",
      description: "Large section heading",
      icon: <Heading1 size={18} />,
      command: "/h1",
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      icon: <Heading2 size={18} />,
      command: "/h2",
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      icon: <Heading3 size={18} />,
      command: "/h3",
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      title: "Bullet List",
      description: "Create a bullet list",
      icon: <List size={18} />,
      command: "/bullet",
      action: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      title: "Numbered List",
      description: "Create a numbered list",
      icon: <ListOrdered size={18} />,
      command: "/number",
      action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      title: "Task List",
      description: "Create a checklist",
      icon: <CheckSquare size={18} />,
      command: "/checklist",
      action: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      title: "Code Block",
      description: "Add a code block",
      icon: <Code size={18} />,
      command: "/code",
      action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      title: "Quote",
      description: "Add a blockquote",
      icon: <Quote size={18} />,
      command: "/quote",
      action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      title: "Divider",
      description: "Add a horizontal rule",
      icon: <Minus size={18} />,
      command: "/divider",
      action: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      title: "Image",
      description: "Insert an image",
      icon: <Image size={18} />,
      command: "/image",
      action: () => {
        // This will be handled by onInsertImage
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(search.toLowerCase()) ||
      cmd.command.includes(search.toLowerCase())
  );

  const executeCommand = useCallback(
    (command: CommandItem) => {
      // Delete the slash command text
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        ""
      );
      const slashIndex = textBefore.lastIndexOf("/");

      if (slashIndex !== -1) {
        const deleteFrom = from - (textBefore.length - slashIndex);
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      }

      // Execute the command
      if (command.command === "/image") {
        onInsertImage();
      } else {
        command.action(editor);
      }

      setIsOpen(false);
      setSearch("");
      setSelectedIndex(0);
    },
    [editor, onInsertImage]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearch("");
          setSelectedIndex(0);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand]);

  // Watch for slash command trigger
  useEffect(() => {
    const handleUpdate = () => {
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        ""
      );

      // Check if we have a slash command pattern
      const slashMatch = textBefore.match(/\/(\w*)$/);

      if (slashMatch) {
        // Get cursor position
        const coords = editor.view.coordsAtPos(from);
        const editorRect = editor.view.dom.getBoundingClientRect();

        setPosition({
          top: coords.bottom - editorRect.top + 8,
          left: coords.left - editorRect.left,
        });

        setSearch(slashMatch[1]);
        setIsOpen(true);
        setSelectedIndex(0);
      } else {
        setIsOpen(false);
        setSearch("");
      }
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isOpen || filteredCommands.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden min-w-[240px]"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-2 border-b border-border">
        <span className="text-xs text-muted">Commands</span>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {filteredCommands.map((command, index) => (
          <button
            key={command.command}
            onClick={() => executeCommand(command)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex
                ? "bg-surface text-text"
                : "text-text hover:bg-surface"
            }`}
          >
            <span className="flex-shrink-0 text-muted">{command.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{command.title}</div>
              <div className="text-xs text-muted truncate">
                {command.description}
              </div>
            </div>
            <span className="flex-shrink-0 text-xs text-muted font-mono">
              {command.command}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
