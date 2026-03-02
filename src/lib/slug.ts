import slugify from "slugify";

export function generateSlug(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("제목이 필요합니다");
  }

  const base = slugify(trimmed, { lower: true, strict: true }) || "post";
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  return `${base}-${unique}`;
}
