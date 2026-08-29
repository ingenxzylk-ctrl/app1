"use client";

import { useRef, useState } from "react";
import { fileToCompressedDataUrl } from "@/lib/image";
import { track } from "@/lib/analytics";

export function PhotoCapture({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file?: File | null) {
    if (!file) return;
    setError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange(dataUrl);
      track("photo_captured", { source: "upload", label });
    } catch {
      setError("We could not read that image. Try another photo.");
    }
  }

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setError("Camera access was blocked. You can upload a photo instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function snap() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;
    const dataUrl = await fileToCompressedDataUrl(blob);
    onChange(dataUrl);
    track("photo_captured", { source: "webcam", label });
    stopCamera();
  }

  return (
    <div>
      <p className="mb-1 text-lg text-ink">{label}</p>
      <p className="mb-4 text-sm text-muted">{hint}</p>

      {value && !cameraOn && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="max-h-72 w-full object-cover" />
        </div>
      )}

      {cameraOn && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-sand bg-black">
          <video ref={videoRef} autoPlay playsInline className="max-h-72 w-full object-cover" />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        {cameraOn ? (
          <>
            <button
              type="button"
              onClick={snap}
              className="flex-1 rounded-full bg-ink py-3 text-sm text-ivory"
            >
              Capture
            </button>
            <button type="button" onClick={stopCamera} className="flex-1 rounded-full py-3 text-sm text-muted">
              Cancel camera
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex-1 rounded-full border border-sand bg-white py-3 text-sm"
            >
              {value ? "Replace photo" : "Upload photo"}
            </button>
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 rounded-full bg-ink py-3 text-sm text-ivory"
            >
              Use webcam
            </button>
          </>
        )}
      </div>
      {value && !cameraOn && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-2 w-full text-center text-xs text-muted"
        >
          Remove photo
        </button>
      )}
      {error && <p className="mt-2 text-sm text-terracotta">{error}</p>}
    </div>
  );
}
