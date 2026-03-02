"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUpload(url);
      toast.success("이미지 업로드 완료");
    } catch {
      toast.error("이미지 업로드 실패");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        <ImagePlus size={16} />
        {uploading ? "업로드 중..." : "이미지"}
      </Button>
    </>
  );
}
