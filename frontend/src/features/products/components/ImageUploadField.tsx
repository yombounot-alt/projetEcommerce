import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadService } from "@/api/services/upload.service";

interface ImageUploadFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploadField({ images, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      const urls = await uploadService.uploadImages(Array.from(fileList));
      onChange([...images, ...urls]);
    } catch {
      toast.error("Échec de l'envoi de l'image. Formats acceptés : JPEG, PNG, WEBP, AVIF (5 Mo max).");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((url, index) => (
          <div
            key={url}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label="Retirer cette image"
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {isUploading ? <Loader2Icon className="size-5 animate-spin" /> : <ImagePlusIcon className="size-5" />}
          <span className="text-xs">{isUploading ? "Envoi…" : "Ajouter"}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(event) => handleFilesSelected(event.target.files)}
      />
    </div>
  );
}
