import {
  StarterKit,
  Placeholder,
  TiptapLink,
  TiptapImage,
  TiptapUnderline,
  TaskList,
  TaskItem,
  HorizontalRule,
  CharacterCount,
  HighlightExtension,
  TextStyle,
  Color,
  CustomKeymap,
} from "novel";

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: "list-disc list-outside leading-3 -mt-2",
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: "list-decimal list-outside leading-3 -mt-2",
    },
  },
  listItem: {
    HTMLAttributes: { class: "leading-normal -mb-2" },
  },
  blockquote: {
    HTMLAttributes: {
      class: "border-l-4 border-primary",
    },
  },
  horizontalRule: false,
  dropcursor: { color: "#DBEAFE", width: 4 },
  gapcursor: false,
});

const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class:
      "text-primary underline underline-offset-[3px] hover:text-primary/80 cursor-pointer",
  },
});

const tiptapImage = TiptapImage.configure({
  allowBase64: true,
  HTMLAttributes: {
    class: "rounded-lg border border-muted",
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: { class: "not-prose pl-2" },
});

const taskItem = TaskItem.configure({
  HTMLAttributes: { class: "flex gap-2 items-start my-4" },
  nested: true,
});

const placeholder = Placeholder.configure({
  placeholder: "'/' 를 입력하면 메뉴가 나타납니다...",
});

export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapLink,
  tiptapImage,
  taskList,
  taskItem,
  HorizontalRule,
  CharacterCount.configure(),
  TiptapUnderline,
  HighlightExtension,
  TextStyle,
  Color,
  CustomKeymap,
];
