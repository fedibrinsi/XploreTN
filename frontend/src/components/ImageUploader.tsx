import React, { useState, useRef } from "react";
import api from "../services/api"; // Assuming we want the authenticated axios instance

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({
  images,
  onImagesChange,
  maxImages = 6,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
      // Reset input value to allow selecting the same file again if needed
      e.target.value = "";
    }
  };

  const handleFiles = async (files: File[]) => {
    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images.`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    // Process sequentially or in parallel - here we do one by one to avoid overwhelming server logic
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Only JPEG, PNG, and WebP formats are supported.");
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        continue;
      }

      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        newUrls.push(res.data.url);
      } catch (err) {
        console.error("Upload failed", err);
        alert(`Failed to upload ${file.name}`);
      }
    }

    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls]);
    }
    setUploading(false);
  };

  const removeImage = (urlToRemove: string) => {
    onImagesChange(images.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[2rem] p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-outline-variant bg-surface-container-low hover:bg-surface-container-high"
        } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
             <span className="material-symbols-outlined text-3xl">
                {uploading ? "cloud_upload" : "add_a_photo"}
             </span>
          </div>
          <h3 className="font-headline text-xl font-bold text-primary">
             {uploading ? "Uploading..." : "Experience Images"}
          </h3>
          <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
             Drag & drop your files here, or click to browse. Supported formats: JPEG, PNG, WebP (Max 10MB).
          </p>
          <span className="text-xs font-bold text-primary/60 mt-2 uppercase tracking-widest">
             {images.length} / {maxImages} Uploaded
          </span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative group/img rounded-2xl overflow-hidden aspect-video bg-surface-container-high soft-shadow"
            >
              <img
                src={img}
                alt={`Preview ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(img);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 text-white backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all transform scale-90 group-hover/img:scale-100"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
