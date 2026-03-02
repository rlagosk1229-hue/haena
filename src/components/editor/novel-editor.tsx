"use client";

import { useEffect, useState } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandList,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorBubble,
  EditorBubbleItem,
  type EditorInstance,
  type JSONContent,
  handleCommandNavigation,
  Command,
  createSuggestionItems,
  renderItems,
} from "novel";
import { generateJSON } from "@tiptap/html";
import { useDebouncedCallback } from "use-debounce";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Text,
  CheckSquare,
  TextQuote,
  Minus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
} from "lucide-react";
import { defaultExtensions } from "./extensions";

const suggestionItems = createSuggestionItems([
  {
    title: "텍스트",
    description: "일반 텍스트로 작성합니다.",
    searchTerms: ["p", "paragraph", "text"],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode("paragraph", "paragraph")
        .run();
    },
  },
  {
    title: "제목 1",
    description: "큰 제목을 추가합니다.",
    searchTerms: ["title", "big", "large", "heading"],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run();
    },
  },
  {
    title: "제목 2",
    description: "중간 제목을 추가합니다.",
    searchTerms: ["subtitle", "medium", "heading"],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "제목 3",
    description: "작은 제목을 추가합니다.",
    searchTerms: ["small", "heading"],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run();
    },
  },
  {
    title: "글머리 기호",
    description: "글머리 기호 목록을 만듭니다.",
    searchTerms: ["unordered", "list", "bullet"],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "번호 목록",
    description: "번호 매긴 목록을 만듭니다.",
    searchTerms: ["ordered", "list", "number"],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "체크리스트",
    description: "할 일 목록을 만듭니다.",
    searchTerms: ["todo", "task", "check"],
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "인용",
    description: "인용문을 추가합니다.",
    searchTerms: ["blockquote", "quote"],
    icon: <TextQuote size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "구분선",
    description: "구분선을 추가합니다.",
    searchTerms: ["hr", "divider", "separator"],
    icon: <Minus size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
]);

const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});

const allExtensions = [...defaultExtensions, slashCommand];

interface NovelEditorProps {
  initialHTML?: string;
  onChange?: (html: string) => void;
}

export function NovelEditor({ initialHTML, onChange }: NovelEditorProps) {
  const [initialContent, setInitialContent] = useState<JSONContent | null>(
    null
  );

  useEffect(() => {
    if (initialHTML) {
      try {
        const json = generateJSON(initialHTML, allExtensions);
        setInitialContent(json);
      } catch {
        setInitialContent({
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: initialHTML }] },
          ],
        });
      }
    } else {
      setInitialContent({
        type: "doc",
        content: [{ type: "paragraph" }],
      });
    }
  }, []);

  const debouncedOnChange = useDebouncedCallback(
    (editor: EditorInstance) => {
      onChange?.(editor.getHTML());
    },
    500
  );

  if (!initialContent) return null;

  return (
    <EditorRoot>
      <EditorContent
        initialContent={initialContent}
        extensions={allExtensions}
        className="relative min-h-[400px] w-full"
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          attributes: {
            class:
              "prose-custom focus:outline-none max-w-full min-h-[400px] p-6",
          },
        }}
        onUpdate={({ editor }) => {
          debouncedOnChange(editor);
        }}
      >
        {/* Slash Command Menu */}
        <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-xl border bg-popover px-1 py-2 shadow-xl">
          <EditorCommandEmpty className="px-2 text-muted-foreground text-sm">
            결과가 없습니다
          </EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                className="flex w-full items-center space-x-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent aria-selected:bg-accent cursor-pointer"
                key={item.title}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>

        {/* Bubble Menu (appears on text selection) */}
        <EditorBubble className="flex items-center rounded-xl border bg-popover shadow-xl overflow-hidden">
          <EditorBubbleItem
            onSelect={(editor) =>
              editor.chain().focus().toggleBold().run()
            }
          >
            <button className="p-2 hover:bg-accent transition-colors" type="button">
              <Bold size={16} />
            </button>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) =>
              editor.chain().focus().toggleItalic().run()
            }
          >
            <button className="p-2 hover:bg-accent transition-colors" type="button">
              <Italic size={16} />
            </button>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) =>
              editor.chain().focus().toggleUnderline().run()
            }
          >
            <button className="p-2 hover:bg-accent transition-colors" type="button">
              <Underline size={16} />
            </button>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) =>
              editor.chain().focus().toggleStrike().run()
            }
          >
            <button className="p-2 hover:bg-accent transition-colors" type="button">
              <Strikethrough size={16} />
            </button>
          </EditorBubbleItem>
          <EditorBubbleItem
            onSelect={(editor) =>
              editor.chain().focus().toggleHighlight().run()
            }
          >
            <button className="p-2 hover:bg-accent transition-colors" type="button">
              <Highlighter size={16} />
            </button>
          </EditorBubbleItem>
        </EditorBubble>
      </EditorContent>
    </EditorRoot>
  );
}
