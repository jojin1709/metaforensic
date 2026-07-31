"use client";

import { useState } from "react";
import { Camera, GitCompare, FolderCheck, ShieldCheck } from "lucide-react";
import UploadZone from "@/components/UploadZone";
import Dashboard from "@/components/Dashboard";
import ImageCompareModal from "@/components/ImageCompareModal";
import BatchAnalysisView from "@/components/BatchAnalysisView";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [appMode, setAppMode] = useState<"single" | "compare" | "batch">("single");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <main className="min-h-screen">
      {/* Main Header Bar */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 border-b border-panelBorder/60 mb-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MetaForensic Logo" className="w-8 h-8 rounded-lg object-cover border border-safelightDim/50 shadow-md" />
          <span className="font-display font-semibold tracking-tight text-paper text-lg">MetaForensic</span>
        </div>

        {/* Global Mode Switcher */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => { setAppMode("single"); setFile(null); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              appMode === "single" ? "bg-safelight text-void border-safelight font-bold" : "bg-void border-panelBorder text-muted hover:text-paper"
            }`}
          >
            <Camera size={14} /> Single Evidence
          </button>
          <button
            onClick={() => setAppMode("compare")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              appMode === "compare" ? "bg-safelight text-void border-safelight font-bold" : "bg-void border-panelBorder text-muted hover:text-paper"
            }`}
          >
            <GitCompare size={14} /> Side-by-Side Compare
          </button>
          <button
            onClick={() => setAppMode("batch")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
              appMode === "batch" ? "bg-safelight text-void border-safelight font-bold" : "bg-void border-panelBorder text-muted hover:text-paper"
            }`}
          >
            <FolderCheck size={14} /> Batch Evidence
          </button>
        </div>
      </header>

      {appMode === "single" && (
        !file ? (
          <UploadZone onFile={setFile} />
        ) : (
          <Dashboard file={file} onReset={() => setFile(null)} />
        )
      )}

      {appMode === "compare" && <ImageCompareModal />}

      {appMode === "batch" && <BatchAnalysisView />}

      <footer className="max-w-6xl mx-auto px-6 py-10 border-t border-panelBorder/60 mt-10 space-y-4">
        <p className="text-xs font-mono text-muted">
          MetaForensic runs entirely in your browser — images are parsed with canvas and EXIF
          libraries locally and never transmitted to a server. GPS lookups are resolved via the
          public OpenStreetMap Nominatim API, which does receive the coordinates found in a
          photo&apos;s metadata (not the image itself) purely to resolve a place name.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <p className="text-paper font-semibold flex flex-wrap items-center gap-2.5">
            <span>Developed with ❤️ by <span className="text-safelight font-bold">JOJIN JOHN</span></span>
            <span className="text-muted">•</span>
            <a
              href="https://www.linkedin.com/in/jojin-john/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-safelight hover:underline font-bold"
            >
              LinkedIn
            </a>
            <span className="text-muted">•</span>
            <a
              href="https://github.com/jojin1709"
              target="_blank"
              rel="noopener noreferrer"
              className="text-data hover:underline font-bold"
            >
              GitHub
            </a>
          </p>
          <div className="flex items-center gap-3 text-muted">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-safelight flex items-center gap-1 transition-colors"
            >
              <ShieldCheck size={13} /> Privacy Policy
            </button>
            <span>•</span>
            <a href="/sitemap.xml" target="_blank" className="hover:text-paper transition-colors">Sitemap</a>
            <span>•</span>
            <a href="/robots.txt" target="_blank" className="hover:text-paper transition-colors">Robots.txt</a>
          </div>
        </div>
      </footer>

      {showPrivacyModal && (
        <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />
      )}
    </main>
  );
}
