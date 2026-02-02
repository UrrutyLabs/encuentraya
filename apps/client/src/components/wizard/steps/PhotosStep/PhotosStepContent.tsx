"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { MAX_ORDER_PHOTOS, MAX_FILE_SIZE_BYTES } from "@repo/upload";

const MAX_SIZE_MB = MAX_FILE_SIZE_BYTES / 1024 / 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export type PhotoItem =
  | { type: "file"; file: File; id: string }
  | { type: "url"; url: string; id: string };

interface PhotosStepContentProps {
  items: PhotoItem[];
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  addError: string | null;
  clearAddError: () => void;
}

export function PhotosStepContent({
  items,
  onAddFiles,
  onRemove,
  addError,
  clearAddError,
}: PhotosStepContentProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearAddError();
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const remaining = MAX_ORDER_PHOTOS - items.length;
    if (remaining <= 0) {
      onAddFiles([]);
      return;
    }

    const toAdd: File[] = [];
    for (const file of files) {
      if (toAdd.length >= remaining) break;
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_FILE_SIZE_BYTES) continue;
      toAdd.push(file);
    }
    onAddFiles(toAdd);
    e.target.value = "";
  };

  const canAddMore = items.length < MAX_ORDER_PHOTOS;

  return (
    <Card className="p-4 md:p-6">
      <div className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label="Seleccionar fotos"
        />

        {items.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-surface border border-border group"
              >
                {item.type === "file" ? (
                  <img
                    src={URL.createObjectURL(item.file)}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt="Foto subida"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-opacity"
                  aria-label="Quitar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {addError && (
          <Text variant="small" className="text-danger">
            {addError}
          </Text>
        )}

        {canAddMore && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            className="w-full min-h-[100px] border-dashed flex flex-col items-center justify-center gap-2"
          >
            <ImagePlus className="w-8 h-8 text-muted" />
            <Text variant="small" className="text-muted">
              Agregar fotos (JPEG, PNG o WebP, máx. {MAX_SIZE_MB} MB cada una)
            </Text>
          </Button>
        )}

        {items.length > 0 && (
          <Text variant="small" className="text-muted">
            {items.length} de {MAX_ORDER_PHOTOS} fotos
          </Text>
        )}
      </div>
    </Card>
  );
}
