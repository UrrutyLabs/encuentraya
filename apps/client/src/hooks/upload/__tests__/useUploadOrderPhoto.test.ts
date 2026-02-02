import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUploadOrderPhoto } from "../useUploadOrderPhoto";
import { mockTrpcUploadGetPresignedUploadUrl } from "@/test-setup";
import { MAX_FILE_SIZE_BYTES } from "@repo/upload";

vi.mock("browser-image-compression", () => ({
  default: vi.fn((file: File) => Promise.resolve(file)),
}));

const mockUploadFileToPresignedUrl = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/upload", () => ({
  uploadFileToPresignedUrl: (file: File, uploadUrl: string) =>
    mockUploadFileToPresignedUrl(file, uploadUrl),
}));

function createMockFile(
  overrides: {
    type?: string;
    size?: number;
    name?: string;
  } = {}
): File {
  const { type = "image/jpeg", size = 1024, name = "photo.jpg" } = overrides;
  const blob = new Blob(["x".repeat(size)], { type });
  return new File([blob], name, { type });
}

describe("useUploadOrderPhoto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrpcUploadGetPresignedUploadUrl.mockImplementation(() => ({
      mutateAsync: vi.fn().mockResolvedValue({
        uploadUrl: "https://storage.example.com/signed-upload",
        storageUrl: "https://storage.example.com/public/order-photos/photo.jpg",
      }),
      error: null,
      isPending: false,
    }));
  });

  describe("uploadOrderPhoto", () => {
    it("returns storageUrl when file is valid and upload succeeds", async () => {
      const file = createMockFile({ type: "image/jpeg", size: 500 });
      const { result } = renderHook(() => useUploadOrderPhoto());

      let storageUrl: string | undefined;
      await act(async () => {
        storageUrl = await result.current.uploadOrderPhoto(file);
      });

      expect(storageUrl).toBe(
        "https://storage.example.com/public/order-photos/photo.jpg"
      );
      expect(mockTrpcUploadGetPresignedUploadUrl).toHaveBeenCalled();
      const mutation =
        mockTrpcUploadGetPresignedUploadUrl.mock.results[0]?.value;
      expect(mutation?.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          purpose: "order_photo",
          orderId: "pending",
          contentType: "image/jpeg",
          extension: "jpg",
        })
      );
      expect(mockUploadFileToPresignedUrl).toHaveBeenCalledWith(
        expect.any(File),
        "https://storage.example.com/signed-upload"
      );
    });

    it("throws when file type is not allowed", async () => {
      const file = createMockFile({ type: "application/pdf" });
      const { result } = renderHook(() => useUploadOrderPhoto());

      await expect(
        act(async () => {
          await result.current.uploadOrderPhoto(file);
        })
      ).rejects.toThrow("Tipo de archivo no permitido");

      // useMutation() is called on render; we only care that no PUT happened
      expect(mockUploadFileToPresignedUrl).not.toHaveBeenCalled();
    });

    it("throws when file exceeds max size", async () => {
      const file = createMockFile({
        type: "image/jpeg",
        size: MAX_FILE_SIZE_BYTES + 1,
      });
      const { result } = renderHook(() => useUploadOrderPhoto());

      await expect(
        act(async () => {
          await result.current.uploadOrderPhoto(file);
        })
      ).rejects.toThrow("muy grande");

      expect(mockUploadFileToPresignedUrl).not.toHaveBeenCalled();
    });

    it("accepts image/png and image/webp", async () => {
      const pngFile = createMockFile({ type: "image/png", name: "photo.png" });
      const { result } = renderHook(() => useUploadOrderPhoto());

      await act(async () => {
        await result.current.uploadOrderPhoto(pngFile);
      });

      const mutation =
        mockTrpcUploadGetPresignedUploadUrl.mock.results[0]?.value;
      expect(mutation?.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: "image/png",
          extension: "png",
        })
      );
    });

    it("throws when presigned URL mutation fails", async () => {
      mockTrpcUploadGetPresignedUploadUrl.mockImplementation(() => ({
        mutateAsync: vi
          .fn()
          .mockRejectedValue(new Error("Presigned URL failed")),
        error: null,
        isPending: false,
      }));
      const file = createMockFile({ type: "image/jpeg" });
      const { result } = renderHook(() => useUploadOrderPhoto());

      await expect(
        act(async () => {
          await result.current.uploadOrderPhoto(file);
        })
      ).rejects.toThrow("Presigned URL failed");

      // No PUT when presigned URL fails
      expect(mockUploadFileToPresignedUrl).not.toHaveBeenCalled();
    });

    it("throws when PUT upload fails", async () => {
      mockUploadFileToPresignedUrl.mockRejectedValueOnce(
        new Error("Upload failed: 403 Forbidden")
      );
      const file = createMockFile({ type: "image/jpeg" });
      const { result } = renderHook(() => useUploadOrderPhoto());

      await expect(
        act(async () => {
          await result.current.uploadOrderPhoto(file);
        })
      ).rejects.toThrow("Upload failed");
    });
  });

  describe("uploadOrderPhotos", () => {
    it("uploads multiple files and returns array of storageUrls", async () => {
      const urls = [
        "https://storage.example.com/public/photo1.jpg",
        "https://storage.example.com/public/photo2.jpg",
      ];
      let callCount = 0;
      mockTrpcUploadGetPresignedUploadUrl.mockImplementation(() => ({
        mutateAsync: vi.fn().mockImplementation(() =>
          Promise.resolve({
            uploadUrl: "https://upload.example.com",
            storageUrl: urls[callCount++],
          })
        ),
        error: null,
        isPending: false,
      }));
      const files = [
        createMockFile({ name: "a.jpg" }),
        createMockFile({ name: "b.jpg" }),
      ];
      const { result } = renderHook(() => useUploadOrderPhoto());

      let returnedUrls: string[] = [];
      await act(async () => {
        returnedUrls = await result.current.uploadOrderPhotos(files);
      });

      expect(returnedUrls).toEqual(urls);
      expect(mockUploadFileToPresignedUrl).toHaveBeenCalledTimes(2);
    });

    it("isUploading is false initially and after upload completes", async () => {
      const file = createMockFile();
      const { result } = renderHook(() => useUploadOrderPhoto());

      expect(result.current.isUploading).toBe(false);

      await act(async () => {
        await result.current.uploadOrderPhotos([file]);
      });

      expect(result.current.isUploading).toBe(false);
    });

    it("exposes mutation error as error", () => {
      const mutationError = new Error("Network error");
      mockTrpcUploadGetPresignedUploadUrl.mockImplementation(() => ({
        mutateAsync: vi.fn(),
        error: mutationError,
        isPending: false,
      }));
      const { result } = renderHook(() => useUploadOrderPhoto());

      expect(result.current.error).toBe(mutationError);
    });
  });
});
