"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Camera,
  Clock,
  MapPin,
  ImageIcon,
  Layers,
  FileWarning,
  Fingerprint,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sliders,
  FileCode2,
  Binary,
  Printer,
} from "lucide-react";
import Card from "./Card";
import { extractExif, extractThumbnail, ExifResult } from "@/lib/exif";
import { analyzeFileStructure, FileStructureResult } from "@/lib/fileStructure";
import { loadImageFromFile, runELA, computeDHash, hammingDistanceHex } from "@/lib/imageAnalysis";
import { reverseGeocode } from "@/lib/geocode";
import { getHistory, addHistoryEntry, HistoryEntry } from "@/lib/history";
import { detectPlatformFingerprint, PlatformFingerprint } from "@/lib/platformFingerprint";

import VisualForensicsPanel from "./VisualForensicsPanel";
import RawMetadataPanel from "./RawMetadataPanel";
import StegoHexPanel from "./StegoHexPanel";
import PrintableReport from "./PrintableReport";

const MapPanel = dynamic(() => import("./MapPanel"), { ssr: false });

interface Props {
  file: File;
  onReset: () => void;
}

interface FullReport {
  exif: ExifResult;
  structure: FileStructureResult;
  fingerprint: PlatformFingerprint;
  thumbnailUrl: string | null;
  elaUrl: string;
  dhash: string;
  address: string | null;
  matches: HistoryEntry[];
}

const STAGES = [
  "Reading file bytes",
  "Parsing EXIF / IPTC / ICC / XMP",
  "Extracting embedded thumbnail",
  "Running error level analysis",
  "Inspecting container structure",
  "Computing perceptual hash",
];

export default function Dashboard({ file, onReset }: Props) {
  const [stageIdx, setStageIdx] = useState(0);
  const [report, setReport] = useState<FullReport | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loadedImgElement, setLoadedImgElement] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "visual" | "metadata" | "stego">("overview");
  const [showPrintReport, setShowPrintReport] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError(null);
    setStageIdx(0);
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    async function run() {
      try {
        setStageIdx(1);
        const exif = await extractExif(file);
        if (cancelled) return;

        setStageIdx(2);
        const thumbnailUrl = await extractThumbnail(file);
        if (cancelled) return;

        setStageIdx(3);
        const img = await loadImageFromFile(file);
        if (cancelled) return;
        setLoadedImgElement(img);

        const elaUrl = await runELA(img, 0.9, 12);
        if (cancelled) return;

        setStageIdx(4);
        const structure = await analyzeFileStructure(file);
        if (cancelled) return;

        setStageIdx(5);
        const dhash = await computeDHash(img);
        const history = getHistory();
        const matches = history.filter((h) => hammingDistanceHex(h.dhash, dhash) <= 4);
        addHistoryEntry({
          id: crypto.randomUUID(),
          filename: file.name,
          dhash,
          analyzedAt: new Date().toISOString(),
        });

        let address: string | null = null;
        if (exif.gps) {
          address = await reverseGeocode(exif.gps.lat, exif.gps.lon);
        }

        const fingerprint = detectPlatformFingerprint(file, exif.raw, exif.width, exif.height);

        if (cancelled) return;
        setReport({ exif, structure, fingerprint, thumbnailUrl, elaUrl, dhash, address, matches });
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Something went wrong reading this file.");
      }
    }
    run();
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const exportJson = () => {
    if (!report) return;
    const payload = {
      filename: file.name,
      analyzedAt: new Date().toISOString(),
      platformFingerprint: report.fingerprint,
      camera: {
        make: report.exif.make,
        model: report.exif.model,
        lens: report.exif.lensModel,
        software: report.exif.software,
      },
      timestamps: report.exif.timestamps,
      timestampMismatch: report.exif.timestampMismatch,
      gps: report.exif.gps,
      address: report.address,
      fileStructure: report.structure,
      perceptualHash: report.dhash,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metaforensic-report-${file.name.replace(/\.[^.]+$/, "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loading = !report && !error;

  return (
    <section className="max-w-6xl mx-auto px-6 pb-24">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onReset}
          className="text-sm font-mono text-muted hover:text-paper transition-colors"
        >
          ← analyze another
        </button>
        <p className="text-sm font-mono text-muted truncate max-w-xs">{file.name}</p>
      </div>

      {/* Main Evidence Preview Card */}
      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <div className="relative rounded-xl overflow-hidden border border-panelBorder bg-panel h-72 md:h-full md:min-h-[380px]">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Uploaded evidence" className="w-full h-full object-cover" />
          )}
          {loading && (
            <div className="absolute inset-0 bg-void/40">
              <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-safelight/40 to-transparent animate-scan" />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          {error && (
            <div className="flex items-center gap-3 text-safelight font-mono text-sm">
              <AlertTriangle size={18} /> {error}
            </div>
          )}
          {loading &&
            STAGES.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-3 py-1.5 font-mono text-sm transition-colors ${
                  i < stageIdx ? "text-data" : i === stageIdx ? "text-paper" : "text-muted/40"
                }`}
              >
                {i < stageIdx ? (
                  <CheckCircle2 size={14} />
                ) : i === stageIdx ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-current" />
                )}
                {s}
              </div>
            ))}

          {report && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportJson}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-safelight text-void font-bold text-xs px-3.5 py-2 hover:bg-safelight/90 transition-colors font-mono"
                >
                  <Download size={14} /> Export JSON
                </button>
                <button
                  onClick={() => setShowPrintReport(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-void border border-safelight text-safelight font-bold text-xs px-3.5 py-2 hover:bg-safelight hover:text-void transition-colors font-mono"
                >
                  <Printer size={14} /> Print PDF Report
                </button>
              </div>

              {/* Warning Badges */}
              <div className="flex flex-wrap gap-2">
                {report.exif.timestampMismatch && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-safelight border border-safelightDim rounded-full px-3 py-0.5">
                    <AlertTriangle size={11} /> timestamp mismatch detected
                  </span>
                )}
                {report.fingerprint.detected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-data border border-dataDim rounded-full px-3 py-0.5">
                    {report.fingerprint.detected}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Module Navigation Tabs */}
      {report && (
        <div className="mt-8">
          <div className="flex border-b border-panelBorder mb-6 gap-4 font-mono text-sm">
            {[
              { id: "overview", label: "Overview", icon: Camera },
              { id: "visual", label: "Visual Forensics", icon: Sliders },
              { id: "metadata", label: "Deep Metadata", icon: FileCode2 },
              { id: "stego", label: "Steganography & Hex", icon: Binary },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-3 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-safelight text-safelight font-bold"
                      : "border-transparent text-muted hover:text-paper"
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-2 gap-5">
              <Card icon={Camera} title="Device & Software" delay={0}>
                <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-sm font-mono">
                  {[
                    ["Make", report.exif.make],
                    ["Model", report.exif.model],
                    ["Lens", report.exif.lensModel],
                    ["Software", report.exif.software],
                    ["Exposure", report.exif.exposure],
                    ["ISO", report.exif.iso],
                    ["Focal length", report.exif.focalLength],
                    ["Dimensions", report.exif.width && report.exif.height ? `${report.exif.width}×${report.exif.height}` : undefined],
                  ].map(([label, val]) =>
                    val ? (
                      <div className="contents" key={label}>
                        <dt className="text-muted">{label}</dt>
                        <dd className="text-paper truncate">{val}</dd>
                      </div>
                    ) : null
                  )}
                </dl>
              </Card>

              <Card icon={Clock} title="Timestamps" delay={0.05} tag={report.exif.timestampMismatch ? "mismatch" : undefined}>
                {report.exif.timestamps.length > 0 ? (
                  <ul className="space-y-2 text-sm font-mono">
                    {report.exif.timestamps.map((t) => (
                      <li key={t.label} className="flex justify-between gap-4">
                        <span className="text-muted">{t.label}</span>
                        <span className="text-paper text-right">{t.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted text-sm font-mono">No timestamp fields present in this file.</p>
                )}
              </Card>

              {report.exif.gps ? (
                <Card icon={MapPin} title="Location" delay={0.1} tag="GPS EXIF">
                  <MapPanel lat={report.exif.gps.lat} lon={report.exif.gps.lon} />
                  <div className="mt-3 text-sm font-mono space-y-1">
                    <p className="text-paper">{report.exif.gps.lat.toFixed(6)}, {report.exif.gps.lon.toFixed(6)}</p>
                    {report.address && <p className="text-muted">{report.address}</p>}
                  </div>
                </Card>
              ) : (
                <Card icon={MapPin} title="Location" delay={0.1}>
                  <p className="text-muted text-sm font-mono">No GPS coordinates embedded in metadata.</p>
                </Card>
              )}

              <Card icon={ImageIcon} title="Embedded Thumbnail" delay={0.15}>
                {report.thumbnailUrl ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-mono text-muted mb-1.5">Embedded thumbnail</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={report.thumbnailUrl} alt="Embedded thumbnail" className="rounded-lg border border-panelBorder w-full" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-muted mb-1.5">Full-size image</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Full image" className="rounded-lg border border-panelBorder w-full h-full object-cover" />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-sm font-mono">No embedded thumbnail found.</p>
                )}
              </Card>

              <Card icon={Layers} title="Error Level Analysis" delay={0.2} tag="recompression map">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.elaUrl} alt="ELA heatmap" className="rounded-lg border border-panelBorder w-full" />
              </Card>

              <Card icon={FileWarning} title="File Structure" delay={0.25} tag={report.structure.format}>
                <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm font-mono mb-3">
                  <dt className="text-muted">File size</dt>
                  <dd className="text-paper">{(report.structure.fileSizeBytes / 1024).toFixed(1)} KB</dd>
                  <dt className="text-muted">Trailing bytes</dt>
                  <dd className={report.structure.trailingBytes > 8 ? "text-safelight" : "text-paper"}>
                    {report.structure.trailingBytes}
                  </dd>
                </dl>
              </Card>

              <Card icon={Fingerprint} title="Perceptual Hash" delay={0.3} tag="dHash">
                <p className="font-mono text-sm text-data break-all">{report.dhash}</p>
              </Card>
            </div>
          )}

          {/* TAB 2: VISUAL FORENSICS */}
          {activeTab === "visual" && loadedImgElement && (
            <VisualForensicsPanel img={loadedImgElement} />
          )}

          {/* TAB 3: DEEP METADATA */}
          {activeTab === "metadata" && (
            <RawMetadataPanel file={file} rawExif={report.exif.raw} width={report.exif.width} height={report.exif.height} />
          )}

          {/* TAB 4: STEGANOGRAPHY & HEX */}
          {activeTab === "stego" && loadedImgElement && (
            <StegoHexPanel file={file} img={loadedImgElement} />
          )}
        </div>
      )}

      {/* Printable PDF / HTML Report Modal */}
      {showPrintReport && report && (
        <PrintableReport
          file={file}
          imageUrl={imageUrl}
          exif={report.exif}
          structure={report.structure}
          fingerprint={report.fingerprint}
          elaUrl={report.elaUrl}
          address={report.address}
          dhash={report.dhash}
          onClose={() => setShowPrintReport(false)}
        />
      )}
    </section>
  );
}
