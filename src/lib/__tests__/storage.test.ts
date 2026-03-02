import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockStorageFrom = vi.fn(() => ({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: { from: mockStorageFrom },
  }),
}));

import { uploadImage } from "../storage";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadImage", () => {
  it("uploads file and returns public URL", async () => {
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.com/image.png" },
    });

    const file = new File(["test"], "photo.png", { type: "image/png" });
    const url = await uploadImage(file);

    expect(mockStorageFrom).toHaveBeenCalledWith("post-images");
    expect(mockUpload).toHaveBeenCalled();
    expect(url).toBe("https://example.com/image.png");
  });

  it("throws on upload error", async () => {
    mockUpload.mockResolvedValue({ error: { message: "Upload failed" } });

    const file = new File(["test"], "photo.png", { type: "image/png" });

    await expect(uploadImage(file)).rejects.toThrow();
  });

  it("generates unique filename to prevent collisions", async () => {
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.com/image.png" },
    });

    const file = new File(["test"], "photo.png", { type: "image/png" });
    await uploadImage(file);

    const uploadedFilename = mockUpload.mock.calls[0][0] as string;
    expect(uploadedFilename).toMatch(/\.png$/);
    expect(uploadedFilename).not.toBe("photo.png");
  });
});
