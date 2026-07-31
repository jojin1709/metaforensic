"use client";

import { ShieldCheck, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[99999] bg-void/90 backdrop-blur-md flex items-center justify-center p-4 font-mono">
      <div className="max-w-2xl w-full bg-panel border border-panelBorder rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-xs text-paper">
        <div className="flex items-center justify-between border-b border-panelBorder pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-safelight" />
            <h2 className="text-sm font-bold text-paper">MetaForensic Privacy Guarantee & Security Policy</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-paper p-1">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-muted leading-relaxed">
          <p className="text-paper font-bold">Effective Date: 2026 • Lead Developer: JOJIN JOHN</p>

          <h3 className="font-bold text-safelight text-xs pt-1 border-b border-panelBorder/40 pb-0.5">1. Zero Server Uploads (100% In-Browser Execution)</h3>
          <p>
            MetaForensic processes all image files, binary containers, EXIF headers, and forensic canvas heatmaps strictly inside your browser memory using HTML5 <code className="text-data">FileReader</code> and <code className="text-data font-mono">Canvas2D</code> Web APIs. Your evidence photos are <strong>never transmitted</strong> to any remote server or third-party cloud.
          </p>

          <h3 className="font-bold text-safelight text-xs pt-1 border-b border-panelBorder/40 pb-0.5">2. Reverse Geocoding & Maps API</h3>
          <p>
            If an uploaded photo contains embedded GPS latitude and longitude coordinates, MetaForensic queries the public OpenStreetMap Nominatim API purely to resolve physical place names. Only numerical GPS coordinates are sent — <strong>zero pixel or image data</strong> is ever transmitted.
          </p>

          <h3 className="font-bold text-safelight text-xs pt-1 border-b border-panelBorder/40 pb-0.5">3. Local Session Storage & Cookies</h3>
          <p>
            MetaForensic stores local perceptual hashes (dHash) strictly in your browser&apos;s <code className="text-data font-mono">localStorage</code> to detect duplicate evidence files within your active session. You may clear your session history at any time using the &quot;Clear History&quot; button.
          </p>

          <h3 className="font-bold text-safelight text-xs pt-1 border-b border-panelBorder/40 pb-0.5">4. Air-Gapped & Offline Compliance</h3>
          <p>
            MetaForensic includes a Progressive Web App (PWA) Service Worker, allowing field agents to install and run the suite 100% offline in isolated air-gapped forensic environments.
          </p>
        </div>

        <div className="pt-3 border-t border-panelBorder text-right">
          <button
            onClick={onClose}
            className="bg-safelight text-void font-bold px-4 py-2 rounded-lg hover:bg-safelight/90 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
