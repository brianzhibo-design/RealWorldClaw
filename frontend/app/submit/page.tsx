"use client";
import { API_BASE as API_URL } from "@/lib/api";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";


const MATERIALS = ["PLA", "ABS", "PETG", "TPU", "Nylon", "Resin"];
const SUPPORTED_FORMATS = [".stl", ".obj", ".step", ".3mf"];

export default function SubmitPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [material, setMaterial] = useState("PLA");
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<any>(null);

  // Check if user is authenticated
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || localStorage.getItem("token") : null;
  
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to submit your design</p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
          >
            Sign In →
          </a>
        </div>
      </div>
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const extension = "." + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(extension)) {
      setError(`Unsupported file format. Please use: ${SUPPORTED_FORMATS.join(", ")}`);
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit
      setError("File too large. Maximum size is 100MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      // Upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      };

      // Upload complete
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            const fileId = data.file_id || data.id;
            setUploadedFileId(fileId);
            setUploadedFileInfo(data);
            resolve(fileId);
          } catch (err) {
            setError("Invalid response from server");
            resolve(null);
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            setError(errorData.detail || "Failed to upload file");
          } catch {
            setError("Upload failed");
          }
          resolve(null);
        }
      };

      // Upload error
      xhr.onerror = () => {
        setUploading(false);
        setError("Network error. Please try again.");
        resolve(null);
      };

      // Upload timeout
      xhr.ontimeout = () => {
        setUploading(false);
        setError("Upload timed out. Please try again.");
        resolve(null);
      };

      xhr.timeout = 5 * 60 * 1000; // 5 minutes
      xhr.open("POST", `${API_URL}/files/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const submitOrder = async (fileId: string) => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_id: fileId,
          material: material.toLowerCase(),
          quantity,
          color: color || undefined,
          notes: notes || undefined,
          auto_match: true,
        }),
      });

      if (response.ok) {
        const order = await response.json();
        router.push(`/orders/${order.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create order");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!file) {
        setError("Please select a file");
        return;
      }
      // Upload file immediately after selection
      const fileId = await uploadFile();
      if (fileId) {
        setStep(2);
      }
    } else if (step === 2) {
      if (!material || quantity < 1) {
        setError("Please fill in all required fields");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Create order with uploaded file
      if (uploadedFileId) {
        await submitOrder(uploadedFileId);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span>🚀</span> Submit Design
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Upload your design file and we&apos;ll find the perfect maker
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Progress indicator */}
        <div className="flex items-center mb-6 sm:mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                step >= num ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-400"
              }`}>
                {num}
              </div>
              {num < 3 && (
                <div className={`w-12 sm:w-16 h-0.5 ${step > num ? "bg-sky-600" : "bg-slate-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Step 1: Upload Your Design File</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 sm:p-12 text-center transition-colors ${
                dragOver
                  ? "border-sky-500 bg-sky-500/10"
                  : "border-slate-600 hover:border-slate-500"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div>
                  <div className="text-4xl mb-4">📄</div>
                  <div className="font-medium text-white mb-2">{file.name}</div>
                  <div className="text-sm text-slate-400 mb-4">
                    {formatFileSize(file.size)}
                  </div>
                  
                  {/* Upload Progress */}
                  {uploading && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Uploading...</span>
                        <span className="text-sm text-slate-300">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div 
                          className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Success */}
                  {uploadedFileInfo && !uploading && (
                    <div className="mb-4 p-3 bg-green-900/30 border border-green-800 rounded-lg text-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span>✅</span>
                        <span className="text-sm font-medium">Upload successful!</span>
                      </div>
                      <div className="text-xs text-green-300">
                        File ID: {uploadedFileInfo.id || uploadedFileInfo.file_id}
                      </div>
                    </div>
                  )}
                  
                  {!uploading && !uploadedFileInfo && (
                    <button
                      onClick={() => {
                        setFile(null);
                        setUploadedFileId(null);
                        setUploadedFileInfo(null);
                        setUploadProgress(0);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-sky-400 hover:text-sky-300 text-sm"
                    >
                      Choose different file
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📁</div>
                  <div className="text-sm sm:text-lg font-medium mb-2">
                    <span className="hidden sm:inline">Drop your design file here, or click to browse</span>
                    <span className="sm:hidden">Tap to select your design file</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mb-4">
                    Formats: {SUPPORTED_FORMATS.join(", ")} (max 100MB)
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-3 bg-sky-600 hover:bg-sky-500 rounded-md text-sm font-medium transition-colors min-h-[44px]"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_FORMATS.join(",")}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Parameters */}
        {step === 2 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Step 2: Manufacturing Parameters</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Material *</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent min-h-[44px]"
                >
                  {MATERIALS.map((mat) => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-4 bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Red, Blue, Natural"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  placeholder="Any special instructions or requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-4 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent resize-none min-h-[100px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Step 3: Confirm & Submit</h2>
            
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
              <h3 className="font-medium mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">File:</span>
                  <span>{file?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Material:</span>
                  <span>{material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span>{quantity}</span>
                </div>
                {color && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Color:</span>
                    <span>{color}</span>
                  </div>
                )}
                {notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Notes:</span>
                    <span className="max-w-xs text-right">{notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-sky-900/20 border border-sky-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-sky-400 mb-2">
                <span>🤖</span>
                <span className="font-medium">Auto-Matching Enabled</span>
              </div>
              <p className="text-sm text-sky-300">
                We&apos;ll automatically find and connect you with the best maker for your project based on location, capabilities, and availability.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between gap-3 mt-6 sm:mt-8">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-3 border border-slate-600 text-slate-300 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={uploading || submitting || (step === 1 && (!file || !uploadedFileId))}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-md font-medium transition-colors min-h-[44px] flex-1 sm:flex-initial"
          >
            {step === 1 
              ? (uploading ? `Uploading... ${uploadProgress}%` : uploadedFileId ? "Continue →" : "Upload & Continue")
              : step === 3 
                ? (submitting ? "Creating Order..." : "Create Order →")
                : "Next"
            }
          </button>
        </div>
      </div>
    </div>
  );
}