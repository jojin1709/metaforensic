"use client";

import { useState, useCallback } from "react";
import { FolderCheck, Upload, Loader2, CheckCircle2, AlertTriangle, Fingerprint, Trash2, Download } from "lucide-react";
import Card from "./Card";
import { extractExif, ExifResult } from "@/lib/exif";
import { loadImageFromFile, computeDHash, hammingDistanceHex } from "@/lib/imageAnalysis";

interface BatchItem {
  id: string;
  file: File;
  exif?: ExifResult;
  dhash?: string;
  status: "pending" | "processing" | "done" | "error";
}

export default function BatchAnalysisView() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (filesList: FileList | File[]) => {
    const fileArray = Array.from(filesList);
    const newItems: BatchItem[] = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
    }));

    setItems((prev) => [...prev, ...newItems]);

    for (let i = 0; i < newItems.length; i++) {
      const targetId = newItems[i].id;
      setItems((prev) =>
        prev.map((item) => (item.id === targetId ? { ...item, status: "processing" } : item))
      );

      try {
        const exif = await extractExif(newItems[i].file);
        const img = await loadImageFromFile(newItems[i].file);
        const dhash = await computeDHash(img);

        setItems((prev) =>
          prev.map((item) =>
            item.id === targetId ? { ...item, exif, dhash, status: "done" } : item
          )
        );
      } catch {
        setItems((prev) =>
          prev.map((item) => (item.id === targetId ? { ...item, status: "error" } : item))
        );
      }
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const exportBatchCsv = () => {
    const csvRows = [
      ["Filename", "Make", "Model", "Timestamp", "Latitude", "Longitude", "dHash"].join(","),
      ...items.map((i) =>
        [
          `"${i.file.name}"`,
          `"${i.exif?.make || "N/A"}"`,
          `"${i.exif?.model || "N/A"}"`,
          `"${i.exif?.timestamps?.[0]?.value || "N/A"}"`,
          i.exif?.gps ? i.exif.gps.lat : "",
          i.exif?.gps ? i.exif.gps.lon : "",
          `"${i.dhash || ""}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metaforensic-batch-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="max-w-6xl mx-auto px-6 pb-24 font-mono">
      <h2 className="text-xl font-bold text-paper mb-4 flex items-center gap-2">
        <FolderCheck className="text-safelight" /> Multi-File Batch Evidence Analysis
      </h2>

      {/* Multi File Dropzone with full Drag & Drop handlers */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border border-dashed p-8 text-center bg-panel mb-6 transition-colors ${
          isDragging ? "border-safelight bg-safelight/10" : "border-panelBorder hover:border-safelight/50"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          id="batch-file-input"
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
        <label htmlFor="batch-file-input" className="cursor-pointer space-y-2 block">
          <Upload size={32} className="mx-auto text-muted" />
          <span className="block text-sm font-bold text-paper">
            {isDragging ? "Drop multiple evidence photos now" : "Drop multiple evidence photos here, or click to browse"}
          </span>
          <span className="block text-xs text-muted">
            Processes multiple evidence items to detect camera clusters, timeline gaps, and duplicate hashes.
          </span>
        </label>
      </div>

      {items.length > 0 && (
        <Card icon={FolderCheck} title="Evidence Batch Matrix" tag={`${items.length} files`}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={exportBatchCsv}
              className="inline-flex items-center gap-1.5 bg-safelight text-void font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-safelight/90 transition-colors"
            >
              <Download size={13} /> Export CSV Summary
            </button>
            <button
              onClick={() => setItems([])}
              className="text-xs text-muted hover:text-safelight transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="rounded-xl border border-panelBorder bg-void overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-panelBorder text-muted bg-panel/50">
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold">Filename</th>
                  <th className="p-3 font-bold">Camera Make / Model</th>
                  <th className="p-3 font-bold">Capture Timestamp</th>
                  <th className="p-3 font-bold">GPS</th>
                  <th className="p-3 font-bold">Perceptual Hash (dHash)</th>
                  <th className="p-3 font-bold">Cross-File Duplicate</th>
                  <th className="p-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panelBorder/30">
                {items.map((item, idx) => {
                  let isDuplicate = false;
                  if (item.dhash) {
                    isDuplicate = items.some(
                      (other, oIdx) => oIdx !== idx && other.dhash && hammingDistanceHex(item.dhash!, other.dhash) <= 4
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-panel/40 transition-colors">
                      <td className="p-3">
                        {item.status === "processing" ? (
                          <Loader2 size={14} className="animate-spin text-safelight" />
                        ) : item.status === "done" ? (
                          <CheckCircle2 size={14} className="text-data" />
                        ) : (
                          <AlertTriangle size={14} className="text-safelight" />
                        )}
                      </td>
                      <td className="p-3 text-paper font-bold truncate max-w-[180px]">{item.file.name}</td>
                      <td className="p-3 text-muted">
                        {item.exif?.make || item.exif?.model
                          ? `${item.exif.make || ""} ${item.exif.model || ""}`
                          : "N/A"}
                      </td>
                      <td className="p-3 text-muted font-mono">
                        {item.exif?.timestamps?.[0]?.value || "No Timestamp"}
                      </td>
                      <td className="p-3 font-mono">
                        {item.exif?.gps ? (
                          <span className="text-data">
                            {item.exif.gps.lat.toFixed(4)}, {item.exif.gps.lon.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-muted/60">No GPS</span>
                        )}
                      </td>
                      <td className="p-3 text-data font-mono break-all max-w-[140px]">{item.dhash || "—"}</td>
                      <td className="p-3 font-mono">
                        {isDuplicate ? (
                          <span className="inline-flex items-center gap-1 text-safelight font-bold">
                            <Fingerprint size={12} /> Hash Match
                          </span>
                        ) : (
                          <span className="text-muted/40">Unique</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-muted hover:text-safelight transition-colors"
                          title="Remove file"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
