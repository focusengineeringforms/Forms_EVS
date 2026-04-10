import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Upload, Loader2, AlertCircle, CheckCircle2, Eye, X, Camera, MapPin } from "lucide-react";
import type { FollowUpQuestion } from "../../types";
import { apiClient } from "../../api/client";
import { useTheme } from "../../context/ThemeContext";

interface FileInputProps {
  question: FollowUpQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  isValidationError?: boolean;
}

interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
  timeRemaining?: number;
  speed?: number;
}

const FILE_ACCEPT_MAP: Record<string, string[]> = {
  image: ["image/*"],
  pdf: ["application/pdf", ".pdf"],
  excel: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls",
    ".xlsx",
  ],
};

const FILE_VALIDATORS: Record<string, (file: File) => boolean> = {
  image: (file) => file.type.startsWith("image/"),
  pdf: (file) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
  excel: (file) => {
    const allowedMimes = new Set(
      FILE_ACCEPT_MAP.excel.filter((value) => value.startsWith("application/"))
    );
    const lowerName = file.name.toLowerCase();
    return (
      allowedMimes.has(file.type) ||
      lowerName.endsWith(".xls") ||
      lowerName.endsWith(".xlsx")
    );
  },
};

const FILE_TYPE_LABELS: Record<string, string> = {
  image: "image",
  pdf: "PDF",
  excel: "Excel",
};

const resolveFileName = (fileUrl: string) => {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("data:")) return "Embedded file";
  try {
    const url = new URL(fileUrl, "http://dummy.local");
    const segments = url.pathname.split("/").filter(Boolean);
    const fileName = segments[segments.length - 1] || "Uploaded file";
    return decodeURIComponent(fileName);
  } catch (error) {
    const parts = fileUrl.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "Uploaded file");
  }
};

const isImageUrl = (fileUrl: string) => {
  if (!fileUrl) return false;
  try {
    const parsed = JSON.parse(fileUrl);
    if (parsed.url) return isImageUrl(parsed.url);
  } catch {
    // Not JSON
  }
  if (fileUrl.startsWith("data:")) return fileUrl.startsWith("data:image");
  return /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(fileUrl);
};

const parseFileValue = (fileValue: string) => {
  try {
    const parsed = JSON.parse(fileValue);
    if (parsed.url && parsed.location) {
      return {
        type: "camera",
        url: parsed.url,
        location: parsed.location,
        timestamp: parsed.timestamp,
      };
    }
  } catch {
    // Not JSON
  }
  return {
    type: "file",
    url: fileValue,
  };
};

export default function FileInput({
  question,
  value,
  onChange,
  readOnly = false,
  isValidationError = false,
}: FileInputProps) {
  const { darkMode } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "camera" | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showCapturePreview, setShowCapturePreview] = useState(false);
  const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fileName = useMemo(() => resolveFileName(value), [value]);
  const showImagePreview = useMemo(() => isImageUrl(value), [value]);

  const accept = useMemo(() => {
    if (!question.allowedFileTypes || question.allowedFileTypes.length === 0) {
      return undefined;
    }
    const values = question.allowedFileTypes
      .flatMap((type) => FILE_ACCEPT_MAP[type] ?? [])
      .filter(Boolean);
    if (values.length === 0) return undefined;
    return Array.from(new Set(values)).join(",");
  }, [question.allowedFileTypes]);

  const getLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.min(position.coords.accuracy, 1000),
        });
        setLocationLoading(false);
      },
      (error) => {
        let errorMsg = "Unable to get location";
        if (error.code === 1) errorMsg = "Location permission denied";
        else if (error.code === 2) errorMsg = "Location unavailable";
        else if (error.code === 3) errorMsg = "Location timeout";
        setLocationError(errorMsg);
        setLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      await getLocation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Camera access failed");
    }
  }, [getLocation]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setVideoReady(false);
    }
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera not ready");
      return;
    }

    try {
      setError(null);
      const video = videoRef.current;
      if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) {
        setError("Stream not ready");
        return;
      }

      const context = canvasRef.current.getContext("2d");
      if (!context) throw new Error("Canvas failed");

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        if (!blob) {
          setError("Capture failed");
          return;
        }
        setCapturedImageBlob(blob);
        setCapturedImageUrl(URL.createObjectURL(blob));
        setShowCapturePreview(true);
      }, "image/jpeg", 0.9);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed");
    }
  }, []);

  const uploadCapturedImage = useCallback(async () => {
    if (!capturedImageBlob || !location) {
      setError("Image/location not ready");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const file = new File([capturedImageBlob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      const result = await apiClient.uploadFile(file, "form", question.id, (p) => setProgress(p));
      const uploadedUrl = apiClient.resolveUploadedFileUrl(result);
      if (!uploadedUrl) throw new Error("Upload failed");

      const metadata = {
        url: uploadedUrl,
        location: {
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy,
        },
        timestamp: new Date().toISOString(),
      };

      onChange(JSON.stringify(metadata));
      stopCamera();
      setShowCapturePreview(false);
      setCapturedImageBlob(null);
      setCapturedImageUrl(null);
      setUploadMode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, [capturedImageBlob, location, question.id, onChange, stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;
      const file = e.target.files?.[0];
      if (!file) return;

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File exceeds 10MB limit`);
        e.target.value = "";
        return;
      }

      const allowed = question.allowedFileTypes;
      if (allowed && allowed.length > 0) {
        const isValid = allowed.some((type) => {
          const validator = FILE_VALIDATORS[type];
          return validator ? validator(file) : true;
        });
        if (!isValid) {
          const labels = allowed.map((t) => FILE_TYPE_LABELS[t] ?? t).join(", ");
          setError(`Please upload: ${labels}`);
          e.target.value = "";
          return;
        }
      }

      try {
        setUploading(true);
        setError(null);
        setProgress(null);
        const result = await apiClient.uploadFile(file, "form", question.id, (p) => setProgress(p));
        const uploadedUrl = apiClient.resolveUploadedFileUrl(result);
        if (!uploadedUrl) throw new Error("Upload failed");
        onChange(uploadedUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        e.target.value = "";
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [onChange, question.allowedFileTypes, question.id, readOnly]
  );

  const handleRemoveFile = useCallback(() => {
    if (readOnly) return;
    if (inputRef.current) inputRef.current.value = "";
    onChange("");
  }, [onChange, readOnly]);

  return (
    <div className={`space-y-3 p-1 rounded-lg ${isValidationError ? "ring-2 ring-red-500/20" : ""}`}>
      {!uploadMode ? (
        <div className="flex gap-2">
          <button
            onClick={() => setUploadMode("file")}
            disabled={readOnly}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
              darkMode 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20' 
                : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Upload className="w-3.5 h-3.5" />
            Manual Upload
          </button>
          {question.allowedFileTypes?.includes("image") && (
            <button
              onClick={() => setUploadMode("camera")}
              disabled={readOnly}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                darkMode 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Camera className="w-3.5 h-3.5" />
              Camera
            </button>
          )}
        </div>
      ) : (
        <div className={`p-4 rounded-lg border border-dashed transition-all duration-200 ${
          darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
        } ${
          isValidationError ? "border-red-500 ring-4 ring-red-500/10" : ""
        }`}>
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setUploadMode(null);
                setError(null);
              }}
              className="text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              ← Cancel
            </button>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {uploadMode === "file" ? "Selection" : "Camera"}
            </span>
          </div>

          {uploadMode === "file" ? (
            <div className="flex flex-col items-center py-2">
              {uploading ? (
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      {progress ? `Uploading... ${progress.percentage}%` : "Processing..."}
                    </span>
                  </div>
                  {progress && (
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <label className="w-full cursor-pointer group text-center">
                  <div className={`flex flex-col items-center py-6 rounded-lg transition-colors ${
                    darkMode ? 'group-hover:bg-slate-800/50' : 'group-hover:bg-white'
                  }`}>
                    <Upload className="w-8 h-8 text-slate-400 mb-3 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">
                      Choose Resource
                    </span>
                    <span className="mt-1 text-[9px] font-medium text-slate-400/60 uppercase tracking-tight">Max Size: 10MB</span>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    disabled={readOnly || uploading}
                    className="hidden"
                    required={question.required && !value}
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {!cameraStream ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-6 flex flex-col items-center justify-center gap-2 group"
                >
                  <Camera className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">Activate Camera</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={() => setVideoReady(true)}
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {location && (
                        <div className="bg-emerald-500/90 text-white p-1 rounded shadow-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {locationError ? (
                    <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-[10px] font-medium">{locationError}</span>
                      <button onClick={getLocation} className="ml-auto underline font-bold uppercase tracking-tighter">Retry</button>
                    </div>
                  ) : locationLoading ? (
                    <div className="flex items-center justify-center gap-2 p-2">
                      <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                      <span className="text-[10px] font-bold uppercase text-slate-500">Acquiring Location...</span>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={uploading || !location || !videoReady}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                      darkMode 
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Capture & Verify
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-md text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase">{error}</span>
        </div>
      )}

      {value ? (() => {
        const fileData = parseFileValue(value);
        const imageUrl = fileData.type === "camera" ? fileData.url : value;
        return (
          <div className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3 p-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                {showImagePreview ? <Eye className="w-4 h-4 text-blue-500" /> : <Upload className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">
                  {fileName || "Uploaded Item"}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  {fileData.type === "camera" ? "Verified Capture" : "Manual Upload"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-1.5 rounded-md transition-colors ${
                    darkMode ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-white text-blue-600'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className={`p-1.5 rounded-md transition-colors ${
                      darkMode ? 'hover:bg-slate-800 text-red-400' : 'hover:bg-white text-red-500'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {fileData.type === "camera" && fileData.location && (
              <div className={`px-3 pb-3 pt-0 grid grid-cols-2 gap-2`}>
                <div className={`p-2 rounded-md ${darkMode ? 'bg-slate-800/50' : 'bg-white/80'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span className="text-[9px] font-bold uppercase text-slate-400">Location</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    {fileData.location.latitude.toFixed(4)}, {fileData.location.longitude.toFixed(4)}
                  </p>
                </div>
                <div className={`p-2 rounded-md ${darkMode ? 'bg-slate-800/50' : 'bg-white/80'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-bold uppercase text-slate-400">Accuracy</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                    ±{fileData.location.accuracy.toFixed(0)}m
                  </p>
                </div>
              </div>
            )}

            {showImagePreview && (
              <div className="px-3 pb-3">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-48 object-cover rounded-md border border-slate-200 dark:border-slate-800"
                />
              </div>
            )}
          </div>
        );
      })() : null}

      {showCapturePreview && capturedImageUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-2xl max-w-sm w-full overflow-hidden ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Review Capture</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCapturePreview(false);
                    setCapturedImageUrl(null);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3">
                <img
                  src={capturedImageUrl}
                  alt="Captured"
                  className="w-full h-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
                />

                {location && (
                  <div className={`p-2 rounded-md flex items-center gap-2 ${darkMode ? 'bg-blue-500/5' : 'bg-blue-50'}`}>
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                      Coordinates Verified
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCapturePreview(false);
                    setCapturedImageUrl(null);
                    setVideoReady(true);
                  }}
                  disabled={uploading}
                  className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={uploadCapturedImage}
                  disabled={uploading}
                  className={`flex-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
