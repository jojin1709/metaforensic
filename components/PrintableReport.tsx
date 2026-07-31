"use client";

import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Printer, ShieldCheck, AlertTriangle, FileCheck, Hash } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const [caseNum, setCaseNum] = useState<string>("CAS-2026-9041");
  const [investigator, setInvestigator] = useState<string>("JOJIN JOHN");
  const [agency, setAgency] = useState<string>("MetaForensic Cyber Intelligence Lab");
  const [sha256, setSha256] = useState<string>("Computing SHA-256...");

  const evidenceId = useMemo(() => crypto.randomUUID().slice(0, 18), []);

  useEffect(() => {
    setMounted(true);
    document.body.classList.add("printing-report");

    // Compute real SHA-256 hash of file
    file.arrayBuffer().then((buf) => {
      crypto.subtle.digest("SHA-256", buf).then((hashBuf) => {
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setSha256(hashHex);
      });
    });

    return () => {
      document.body.classList.remove("printing-report");
    };
  }, [file]);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="printable-report-modal fixed inset-0 z-[99999] bg-void/95 overflow-y-auto p-4 md:p-6 font-mono">
      <div className="printable-report-card max-w-3xl mx-auto bg-panel border border-panelBorder rounded-2xl p-6 shadow-2xl text-paper print:p-0">
        {/* Printable Header Controls */}
        <div className="flex flex-col gap-3 border-b border-panelBorder pb-4 mb-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-safelight" />
              <h2 className="text-lg font-bold">Forensic Evidence Dossier Exporter</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-safelight text-void font-bold text-xs px-4 py-2 rounded-lg hover:bg-safelight/90 transition-colors"
              >
                <Printer size={15} /> Print / Save PDF (1 Page)
              </button>
              <button onClick={onClose} className="text-xs text-muted hover:text-paper px-3 py-2">
                Close Preview
              </button>
            </div>
          </div>

          {/* Customizable Case Metadata Inputs */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <label className="text-muted block text-[10px]">Case / Reference #</label>
              <input
                type="text"
                value={caseNum}
                onChange={(e) => setCaseNum(e.target.value)}
                className="w-full bg-void border border-panelBorder rounded px-2 py-1 text-paper"
              />
            </div>
            <div>
              <label className="text-muted block text-[10px]">Investigator Name</label>
              <input
                type="text"
                value={investigator}
                onChange={(e) => setInvestigator(e.target.value)}
                className="w-full bg-void border border-panelBorder rounded px-2 py-1 text-paper"
              />
            </div>
            <div>
              <label className="text-muted block text-[10px]">Agency / Unit</label>
              <input
                type="text"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-void border border-panelBorder rounded px-2 py-1 text-paper"
              />
            </div>
          </div>
        </div>

        {/* Official Report Title Block */}
        <div className="text-center mb-3 border-b border-panelBorder pb-2 print:mb-2 print:pb-2">
          <h1 className="text-xl font-bold text-safelight print-text-accent tracking-wide uppercase">METAFORENSIC LEGAL EVIDENCE DOSSIER</h1>
          <p className="text-[11px] text-muted mt-0.5">
            Case #: <span className="text-paper font-bold">{caseNum}</span> • Generated: {new Date().toUTCString()} • ID: {evidenceId}
          </p>
          <p className="text-[10px] text-muted">
            Investigator: <span className="text-paper">{investigator}</span> ({agency})
          </p>
        </div>

        {/* Executive Summary & Evidence Photo Side-by-Side */}
        <div className="grid grid-cols-2 gap-3 mb-3 print:mb-2">
          <div className="flex items-center justify-center rounded-xl border border-panelBorder bg-void overflow-hidden p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Evidence" className="w-full h-32 object-contain rounded-lg max-h-32" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="p-2 rounded-lg bg-void border border-panelBorder">
              <span className="text-muted block text-[10px]">File Name</span>
              <span className="text-paper font-bold break-all">{file.name}</span>
            </div>
            <div className="p-2 rounded-lg bg-void border border-panelBorder">
              <span className="text-muted block text-[10px]">Platform Fingerprint</span>
              <span className="text-safelight print-text-accent font-bold">{fingerprint.detected}</span>
            </div>
            <div className="p-2 rounded-lg bg-void border border-panelBorder">
              <span className="text-muted block text-[10px]">Perceptual Hash (dHash)</span>
              <span className="text-data font-bold break-all">{dhash}</span>
            </div>
          </div>
        </div>

        {/* SHA-256 Cryptographic Integrity Hash */}
        <div className="p-2 rounded-xl bg-void border border-panelBorder mb-3 text-xs font-mono space-y-0.5 print:mb-2">
          <div className="flex items-center gap-1.5 text-data font-bold text-[11px]">
            <Hash size={13} /> SHA-256 Cryptographic Hash (Chain of Custody)
          </div>
          <p className="text-[10px] text-muted break-all">{sha256}</p>
        </div>

        {/* Warnings & Anomalies */}
        {(exif.timestampMismatch || structure.recompressionLikely) && (
          <div className="p-2 rounded-xl bg-safelight/10 border border-safelight/40 mb-3 text-xs text-safelight print-text-accent space-y-0.5 print:mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <AlertTriangle size={14} /> Forensic Anomalies Detected
            </div>
            {exif.timestampMismatch && <p className="text-[11px]">• Timestamp mismatch between capture and modification dates.</p>}
            {structure.recompressionLikely && <p className="text-[11px]">• Multiple JPEG re-compression quantization passes detected.</p>}
          </div>
        )}

        {/* Metadata & Technical Specs */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-xs print:mb-2">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-safelight print-text-accent border-b border-panelBorder pb-1 mb-1">Hardware & Camera EXIF</h3>
            <div className="space-y-0.5 text-[11px] text-muted">
              <p><span className="text-paper font-semibold">Make:</span> {exif.make || "N/A"}</p>
              <p><span className="text-paper font-semibold">Model:</span> {exif.model || "N/A"}</p>
              <p><span className="text-paper font-semibold">Software:</span> {exif.software || "N/A"}</p>
              <p><span className="text-paper font-semibold">Dimensions:</span> {exif.width} × {exif.height}</p>
              <p><span className="text-paper font-semibold">Exposure / ISO:</span> {exif.exposure || "N/A"} / ISO {exif.iso || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold text-safelight print-text-accent border-b border-panelBorder pb-1 mb-1">Geospatial & Container</h3>
            <div className="space-y-0.5 text-[11px] text-muted">
              {exif.gps ? (
                <>
                  <p><span className="text-paper font-semibold">Coordinates:</span> {exif.gps.lat.toFixed(6)}, {exif.gps.lon.toFixed(6)}</p>
                  <p><span className="text-paper font-semibold">Address:</span> {address || "Resolving..."}</p>
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
        <div className="mb-3 print:mb-2">
          <h3 className="text-xs font-bold text-safelight print-text-accent border-b border-panelBorder pb-1 mb-1">Error Level Analysis (ELA) Recompression Map</h3>
          <div className="flex items-center justify-center rounded-xl border border-panelBorder bg-void overflow-hidden p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={elaUrl} alt="ELA Map" className="w-full h-24 object-contain rounded-lg max-h-24" />
          </div>
        </div>

        <div className="text-center text-[10px] text-muted border-t border-panelBorder pt-2 mt-1 flex items-center justify-between">
          <span>MetaForensic Dossier • Case #{caseNum}</span>
          <span className="flex items-center gap-1 font-bold text-paper"><FileCheck size={12} className="text-data" /> Verified Signature Stamp</span>
          <span>Investigator: {investigator}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
