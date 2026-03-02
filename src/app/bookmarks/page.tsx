"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  ExternalLink,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import type { Bookmark } from "@/types/database";

const CATEGORIES = ["전체", "개발", "디자인", "영상", "읽을거리", "쇼핑", "기타"];

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("기타");
  const [newDesc, setNewDesc] = useState("");
  const supabase = createClient();

  const loadBookmarks = useCallback(async () => {
    let query = supabase.from("bookmarks").select("*").order("created_at", { ascending: false });
    if (selectedCategory !== "전체") {
      query = query.eq("category", selectedCategory);
    }
    const { data } = await query;
    if (data) setBookmarks(data);
  }, [supabase, selectedCategory]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const addBookmark = async () => {
    if (!newUrl.trim() || !newTitle.trim()) return;
    const fullUrl = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(fullUrl).hostname}&sz=32`;
    const { error } = await supabase.from("bookmarks").insert({
      url: fullUrl,
      title: newTitle.trim(),
      description: newDesc,
      category: newCategory,
      favicon_url: faviconUrl,
    });
    if (error) {
      toast.error("추가 실패");
      return;
    }
    setNewUrl("");
    setNewTitle("");
    setNewDesc("");
    setShowAdd(false);
    loadBookmarks();
    toast.success("북마크 추가!");
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    loadBookmarks();
    toast.success("삭제됨");
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">북마크</h1>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus size={18} />
          <span className="hidden sm:inline">추가</span>
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "glass hover:bg-secondary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-4 space-y-3"
          >
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (예: github.com)"
            />
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="제목"
            />
            <Input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명 (선택)"
            />
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.filter((c) => c !== "전체").map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    newCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Button onClick={addBookmark} size="sm" className="w-full">
              추가
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔗</p>
            <p className="text-muted-foreground">
              좋아하는 링크를 저장해보세요
            </p>
          </div>
        ) : (
          bookmarks.map((bm, i) => (
            <motion.div
              key={bm.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                {bm.favicon_url ? (
                  <img
                    src={bm.favicon_url}
                    alt=""
                    className="w-5 h-5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Globe size={16} className="text-muted-foreground" />
                )}
              </div>
              <a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0"
              >
                <p className="font-medium text-sm truncate">{bm.title}</p>
                {bm.description && (
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {bm.description}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/50 truncate flex items-center gap-1 mt-0.5">
                  <ExternalLink size={9} />
                  {bm.url.replace(/^https?:\/\//, "").split("/")[0]}
                </p>
              </a>
              <button
                onClick={() => deleteBookmark(bm.id)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors p-1 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
