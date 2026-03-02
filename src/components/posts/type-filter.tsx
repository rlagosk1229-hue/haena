"use client";

import { useRouter, useSearchParams } from "next/navigation";

const filters = [
  { label: "전체", value: "" },
  { label: "일기", value: "diary" },
  { label: "노트", value: "note" },
] as const;

export function TypeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "";

  const handleFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex gap-1.5">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleFilter(filter.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            currentType === filter.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "glass hover:bg-secondary"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
