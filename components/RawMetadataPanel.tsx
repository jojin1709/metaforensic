"use client";

import { useState } from "react";
import { Search, ShieldAlert, FileCode2, Copy, Check } from "lucide-react";
import Card from "./Card";
import { detectPlatformFingerprint } from "@/lib/platformFingerprint";

interface Props {
  file: File;
  rawExif: Record<string, any>;
  width?: number;
  height?: number;
}

export default function RawMetadataPanel({ file, rawExif, width, height }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fingerprint = detectPlatformFingerprint(file, rawExif, width, height);

  const allEntries = Object.entries(rawExif || {}).filter(
    ([key]) => typeof key === "string" && !key.startsWith("latitude") && !key.startsWith("longitude")
  );

  const filteredEntries = allEntries.filter(([key, value]) => {
    const query = searchTerm.toLowerCase();
    const strVal = typeof value === "object" ? JSON.stringify(value) : String(value);
    return key.toLowerCase().includes(query) || strVal.toLowerCase().includes(query);
  });

  const copyToClipboard = (key: string, val: any) => {
    const text = `${key}: ${typeof val === "object" ? JSON.stringify(val) : String(val)}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Platform Fingerprint Header Banner */}
      <Card icon={ShieldAlert} title="Platform & Compression Fingerprint" tag={fingerprint.confidence}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-base font-mono font-bold text-safelight mb-1">{fingerprint.detected}</h4>
            <ul className="space-y-1 text-xs font-mono text-muted list-disc list-inside">
              {fingerprint.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
          <div className="text-right font-mono text-xs text-muted">
            <span className="block text-paper">Fingerprint Confidence</span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-void font-bold mt-1 ${
                fingerprint.confidence === "High"
                  ? "bg-safelight"
                  : fingerprint.confidence === "Clean / Original"
                  ? "bg-data"
                  : "bg-panelBorder text-paper"
              }`}
            >
              {fingerprint.confidence}
            </span>
          </div>
        </div>
      </Card>

      {/* Raw EXIF / XMP / IPTC Tree Viewer */}
      <Card icon={FileCode2} title="Searchable Raw EXIF / XMP Tag Explorer" tag={`${filteredEntries.length} tags`}>
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search metadata tags, Photoshop parameters, software, XMP history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-void border border-panelBorder text-xs font-mono text-paper focus:outline-none focus:border-safelight"
          />
        </div>

        <div className="rounded-xl border border-panelBorder bg-void max-h-[380px] overflow-y-auto font-mono text-xs divide-y divide-panelBorder/40">
          {filteredEntries.length > 0 ? (
            filteredEntries.map(([key, value]) => {
              const strValue =
                typeof value === "object"
                  ? value instanceof Date
                    ? value.toISOString()
                    : JSON.stringify(value)
                  : String(value);

              return (
                <div key={key} className="flex items-start justify-between gap-4 p-2.5 hover:bg-panel/40 transition-colors group">
                  <div className="min-w-[200px] text-muted font-semibold truncate">{key}</div>
                  <div className="text-paper flex-1 break-all select-all font-mono text-[11px] text-right">
                    {strValue}
                  </div>
                  <button
                    onClick={() => copyToClipboard(key, value)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-paper transition-opacity"
                    title="Copy tag"
                  >
                    {copiedKey === key ? <Check size={13} className="text-data" /> : <Copy size={13} />}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="p-4 text-muted text-center">No metadata tags matching "{searchTerm}".</p>
          )}
        </div>
      </Card>
    </div>
  );
}
