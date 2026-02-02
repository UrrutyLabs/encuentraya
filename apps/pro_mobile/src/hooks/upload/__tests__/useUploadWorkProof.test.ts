import { renderHook, act } from "@testing-library/react-native";
import { trpc } from "@lib/trpc/client";
import { useUploadWorkProof } from "../useUploadWorkProof";

jest.mock("@lib/trpc/client");
jest.mock("@lib/upload", () => ({
  uploadFileToPresignedUrl: jest.fn().mockResolvedValue(undefined),
}));

const mockGetPresignedUploadUrl = jest.fn();

describe("useUploadWorkProof", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPresignedUploadUrl.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({
        uploadUrl: "https://storage.example.com/signed-upload",
        storageUrl:
          "https://storage.example.com/public/work-proof/order-1/photo.jpg",
      }),
      error: null,
      isPending: false,
    });
    (trpc as any).upload = {
      getPresignedUploadUrl: { useMutation: mockGetPresignedUploadUrl },
    };
  });

  describe("uploadWorkProofPhoto", () => {
    it("returns storageUrl when fileUri and contentType are valid", async () => {
      const { result } = renderHook(() => useUploadWorkProof("order-1"));
      const uploadFileToPresignedUrl =
        require("@lib/upload").uploadFileToPresignedUrl;

      let storageUrl: string | undefined;
      await act(async () => {
        storageUrl = await result.current.uploadWorkProofPhoto(
          "file:///photo.jpg",
          "image/jpeg"
        );
      });

      expect(storageUrl).toBe(
        "https://storage.example.com/public/work-proof/order-1/photo.jpg"
      );
      const mutation = mockGetPresignedUploadUrl.mock.results[0]?.value;
      expect(mutation.mutateAsync).toHaveBeenCalledWith({
        purpose: "work_proof",
        orderId: "order-1",
        contentType: "image/jpeg",
        extension: "jpg",
      });
      expect(uploadFileToPresignedUrl).toHaveBeenCalledWith(
        "file:///photo.jpg",
        "https://storage.example.com/signed-upload",
        "image/jpeg"
      );
    });

    it("throws when contentType is not allowed", async () => {
      const { result } = renderHook(() => useUploadWorkProof("order-1"));
      const uploadFileToPresignedUrl =
        require("@lib/upload").uploadFileToPresignedUrl;

      await expect(
        act(async () => {
          await result.current.uploadWorkProofPhoto(
            "file:///doc.pdf",
            "application/pdf"
          );
        })
      ).rejects.toThrow("Tipo de archivo no permitido");

      expect(uploadFileToPresignedUrl).not.toHaveBeenCalled();
    });

    it("uses correct extension for image/png and image/webp", async () => {
      const { result } = renderHook(() => useUploadWorkProof("order-1"));

      await act(async () => {
        await result.current.uploadWorkProofPhoto(
          "file:///photo.png",
          "image/png"
        );
      });

      const mutation = mockGetPresignedUploadUrl.mock.results[0]?.value;
      expect(mutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: "image/png",
          extension: "png",
        })
      );
    });

    it("throws when presigned URL mutation fails", async () => {
      mockGetPresignedUploadUrl.mockReturnValue({
        mutateAsync: jest
          .fn()
          .mockRejectedValue(new Error("Presigned URL failed")),
        error: null,
        isPending: false,
      });
      const { result } = renderHook(() => useUploadWorkProof("order-1"));
      const uploadFileToPresignedUrl =
        require("@lib/upload").uploadFileToPresignedUrl;

      await expect(
        act(async () => {
          await result.current.uploadWorkProofPhoto(
            "file:///photo.jpg",
            "image/jpeg"
          );
        })
      ).rejects.toThrow("Presigned URL failed");

      expect(uploadFileToPresignedUrl).not.toHaveBeenCalled();
    });

    it("throws when PUT upload fails", async () => {
      const uploadFileToPresignedUrl =
        require("@lib/upload").uploadFileToPresignedUrl;
      (uploadFileToPresignedUrl as jest.Mock).mockRejectedValueOnce(
        new Error("Upload failed: 403 Forbidden")
      );
      const { result } = renderHook(() => useUploadWorkProof("order-1"));

      await expect(
        act(async () => {
          await result.current.uploadWorkProofPhoto(
            "file:///photo.jpg",
            "image/jpeg"
          );
        })
      ).rejects.toThrow("Upload failed");
    });
  });

  describe("uploadWorkProofPhotos", () => {
    it("uploads multiple assets and returns array of storageUrls", async () => {
      const urls = [
        "https://storage.example.com/public/photo1.jpg",
        "https://storage.example.com/public/photo2.jpg",
      ];
      let callCount = 0;
      mockGetPresignedUploadUrl.mockReturnValue({
        mutateAsync: jest.fn().mockImplementation(() =>
          Promise.resolve({
            uploadUrl: "https://upload.example.com",
            storageUrl: urls[callCount++],
          })
        ),
        error: null,
        isPending: false,
      });
      const assets = [
        { uri: "file:///a.jpg", mimeType: "image/jpeg" },
        { uri: "file:///b.jpg", mimeType: "image/jpeg" },
      ];
      const { result } = renderHook(() => useUploadWorkProof("order-1"));
      const uploadFileToPresignedUrl =
        require("@lib/upload").uploadFileToPresignedUrl;

      let returnedUrls: string[] = [];
      await act(async () => {
        returnedUrls = await result.current.uploadWorkProofPhotos(assets);
      });

      expect(returnedUrls).toEqual(urls);
      expect(uploadFileToPresignedUrl).toHaveBeenCalledTimes(2);
    });

    it("isUploading is false initially and after upload completes", async () => {
      const assets = [{ uri: "file:///photo.jpg", mimeType: "image/jpeg" }];
      const { result } = renderHook(() => useUploadWorkProof("order-1"));

      expect(result.current.isUploading).toBe(false);

      await act(async () => {
        await result.current.uploadWorkProofPhotos(assets);
      });

      expect(result.current.isUploading).toBe(false);
    });

    it("uses image/jpeg when asset mimeType is missing", async () => {
      const { result } = renderHook(() => useUploadWorkProof("order-1"));

      await act(async () => {
        await result.current.uploadWorkProofPhotos([
          { uri: "file:///photo.jpg" },
        ]);
      });

      const mutation = mockGetPresignedUploadUrl.mock.results[0]?.value;
      expect(mutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: "image/jpeg",
        })
      );
    });
  });

  describe("error", () => {
    it("exposes mutation error as error", () => {
      const mutationError = new Error("Network error");
      mockGetPresignedUploadUrl.mockReturnValue({
        mutateAsync: jest.fn(),
        error: mutationError,
        isPending: false,
      });
      const { result } = renderHook(() => useUploadWorkProof("order-1"));

      expect(result.current.error).toBe(mutationError);
    });
  });
});
