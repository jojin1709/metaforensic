"use client";

import { Printer, ShieldCheck, AlertTriangle } from "lucide-react";
import { ExifResult } from "@/lib/exif";
import { FileStructureResult } from "@/lib/fileStructure";
import { PlatformFingerprint } from "@/lib/platformFingerprint";

interface Props {
  file: File;
  imageUrl: string;
  exif: ExifResult;
  structure: FileStructureResult;
  fingerprint: PlatformFingerprint;
  elaUrl: string;
  address?: string | null;
  dhash: string;
  onClose: () => void;
}

export default function PrintableReport({
  file,
  imageUrl,
  exif,
  structure,
  fingerprint,
  elaUrl,
  address,
  dhash,
  onClose,
}: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="printable-report-modal fixed inset-0 z-50 bg-void/95 overflow-y-auto p-4 md:p-8 font-mono">
      <div className="printable-report-card max-w-4xl mx-auto bg-panel border border-panelBorder rounded-2xl p-8 shadow-2xl text-paper">
        {/* Printable Header Controls */}
        <div className="flex items-center justify-between border-b border-panelBorder pb-6 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-safelight" />
            <h2 className="text-xl font-bold">Forensic Evidence Report Generator</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-safelight text-void font-bold text-xs px-4 py-2 rounded-lg hover:bg-safelight/90 transition-colors"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="text-xs text-muted hover:text-paper px-3 py-2">
              Close Preview
            </button>
          </div>
        </div>

        {/* Official Report Title Block */}
        <div className="text-center mb-8 border-b border-panelBorder pb-6">
          <h1 className="text-2xl font-bold text-safelight print-text-accent tracking-wide uppercase">METAFORENSIC EVIDENCE REPORT</h1>
          <p className="text-xs text-muted mt-1">Generated: {new Date().toUTCString()}</p>
          <p className="text-xs text-muted">Evidence ID: {crypto.randomUUID()}</p>
        </div>

        {/* Executive Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 print:block print:space-y-4">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Evidence" className="w-full h-56 object-cover rounded-xl border border-panelBorder print:h-48 print:object-contain" />
          </div>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-void border border-panelBorder space-y-1">
              <span className="text-muted block">File Name</span>
              <span className="text-paper font-bold break-all">{file.name}</span>
            </div>
            <div className="p-3 rounded-lg bg-void border border-panelBorder space-y-1">
              <span className="text-muted block">Platform Fingerprint</span>
              <span className="text-safelight print-text-accent font-bold">{fingerprint.detected} ({fingerprint.confidence})</span>
            </div>
            <div className="p-3 rounded-lg bg-void border border-panelBorder space-y-1">
              <span className="text-muted block">Perceptual Hash (dHash)</span>
              <span className="text-data font-bold break-all">{dhash}</span>
            </div>
          </div>
        </div>

        {/* Warnings & Anomalies */}
        {(exif.timestampMismatch || structure.recompressionLikely) && (
          <div className="p-4 rounded-xl bg-safelight/10 border border-safelight/40 mb-8 text-xs text-safelight print-text-accent space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <AlertTriangle size={16} /> Forensic Anomalies Detected
            </div>
            {exif.timestampMismatch && <p>• Timestamp mismatch between capture and modification dates.</p>}
            {structure.recompressionLikely && <p>• Multiple JPEG re-compression quantization passes detected.</p>}
          </div>
        )}

        {/* Metadata & Technical Specs */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 text-xs print:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-safelight print-text-accent border-b border-panelBorder pb-1">Hardware & Camera EXIF</h3>
            <div className="space-y-1 text-muted">
              <p><span className="text-paper font-semibold">Make:</span> {exif.make || "N/A"}</p>
              <p><span className="text-paper font-semibold">Model:</span> {exif.model || "N/A"}</p>
              <p><span className="text-paper font-semibold">Software:</span> {exif.software || "N/A"}</p>
              <p><span className="text-paper font-semibold">Dimensions:</span> {exif.width} × {exif.height}</p>
              <p><span className="text-paper font-semibold">Exposure / ISO:</span> {exif.exposure || "N/A"} / ISO {exif.iso || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-safelight print-text-accent border-b border-panelBorder pb-1">Geospatial & Container</h3>
            <div className="space-y-1 text-muted">
              {exif.gps ? (
                <>
                  <p><span className="text-paper font-semibold">Coordinates:</span> {exif.gps.lat.toFixed(6)}, {exif.gps.lon.toFixed(6)}</p>
                  <p><span className="text-paper font-semibold">Address:</span> {address || "Resolving location..."}</p>
                </>
              ) : (
                <p>No GPS coordinates embedded in file.</p>
              )}
              <p><span className="text-paper font-semibold">File Size:</span> {(structure.fileSizeBytes / 1024).toFixed(1)} KB</p>
              <p><span className="text-paper font-semibold">Trailing Bytes:</span> {structure.trailingBytes}</p>
            </div>
          </div>
        </div>

        {/* ELA Heatmap Render */}
        <div className="mb-8 print:break-inside-avoid">
          <h3 className="text-sm font-bold text-safelight print-text-accent border-b border-panelBorder pb-2 mb-3">Error Level Analysis (ELA) Recompression Map</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={elaUrl} alt="ELA Map" className="w-full h-48 object-cover rounded-xl border border-panelBorder print:h-40 print:object-contain" />
        </div>

        <div className="text-center text-[10px] text-muted border-t border-panelBorder pt-4">
          Report generated by MetaForensic Lab • Client-side verification suite • Developed by JOJIN JOHN
        </div>
      </div>
    </div>
  );
}
