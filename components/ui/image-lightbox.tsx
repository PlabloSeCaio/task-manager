"use client";

import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/80 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0">
        <div className="relative max-h-full max-w-full">
          <img
            src={src}
            alt={alt ?? ""}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
          <Dialog.Close className="absolute top-2 right-2 size-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
            <XIcon className="size-5" />
          </Dialog.Close>
        </div>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
