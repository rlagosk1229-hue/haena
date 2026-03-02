import { PostEditor } from "@/components/editor/post-editor";

export default function WritePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">새 글 작성</h1>
      <PostEditor />
    </div>
  );
}
