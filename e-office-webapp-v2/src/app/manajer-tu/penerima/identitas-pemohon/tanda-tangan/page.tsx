"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { FileText, ZoomIn, ZoomOut, Upload, Save, Check, PenTool, Archive } from "lucide-react";
import { useRouter } from '@/hooks/use-app-router';
import { AppSidebar } from "@/components/layouts/SideBar";
import TopBar from "@/components/layouts/TopBar";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { AK006LetterTemplate } from "@/components/templates/AK006LetterTemplate";
import { useAK006Template } from '@/hooks/use-ak006-template';

export default function TandaTanganPage() {
  const router = useRouter();
  const [zoom, setZoom] = useState(100);
  // Disabled QR states
  // const [qrPosition, setQrPosition] = useState({ x: 0, y: 0 });
  // const [isDraggingQR, setIsDraggingQR] = useState(false);
  // const [qrPlaced, setQrPlaced] = useState(false);

  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload' | 'saved'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedSavedSignature, setSelectedSavedSignature] = useState<number | null>(null);
  const [agreeToSign, setAgreeToSign] = useState(false);
  const [isCanvasDirty, setIsCanvasDirty] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { templateConfig, loading: templateLoading } = useAK006Template();

  // Simulated saved signatures
  const savedSignatures = [
    { id: 1, dataUrl: '' },
    { id: 2, dataUrl: '' },
    { id: 3, dataUrl: '' },
  ];

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  /* QR Logic Disabled
  const handleQRMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingQR(true);
    
    if (!qrPlaced) {
      // First time dragging from source
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else {
      // Dragging from preview - use offset from QR position
      if (previewRef.current) {
        const previewRect = previewRef.current.getBoundingClientRect();
        const qrElement = e.currentTarget as HTMLElement;
        const qrRect = qrElement.getBoundingClientRect();
        const scale = zoom / 100;
        
        setDragStart({
          x: (e.clientX - qrRect.left) / scale,
          y: (e.clientY - qrRect.top) / scale,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingQR && previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const scale = zoom / 100;
      
      // Get content div for accurate height calculation
      const contentDiv = previewRef.current.querySelector('.p-8') as HTMLElement;
      const contentHeight = contentDiv ? contentDiv.scrollHeight : 0;
      
      // Calculate position relative to preview container
      let newX = (e.clientX - rect.left) / scale - dragStart.x;
      let newY = (e.clientY - rect.top) / scale - dragStart.y;

      // Boundary constraints (QR size is 80px)
      const qrSize = 80;
      const maxX = (rect.width / scale) - qrSize - 32; // Account for padding
      const maxY = contentHeight - qrSize - 32; // Allow to bottom of content

      setQrPosition({
        x: Math.max(16, Math.min(newX, maxX)),
        y: Math.max(16, Math.min(newY, maxY)),
      });

      if (!qrPlaced) {
        setQrPlaced(true);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingQR(false);
  };
  */

  const handleBeriTandaTangan = () => {
    // Navigate to signature page - open modal instead of navigation
    setShowSignModal(true);
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!isCanvasDirty) setIsCanvasDirty(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsCanvasDirty(false);
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    // TODO: Save to backend
    // alert('Tanda tangan berhasil disimpan!');
    console.log('Tanda tangan saved');
  };

  const handleConfirmSign = () => {
    if (!agreeToSign) {
      console.warn("Mohon centang persetujuan terlebih dahulu!");
      return;
    }

    let signatureDataUrl: string | null = null;

    if (signatureMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let hasDrawing = false;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            hasDrawing = true;
            break;
          }
        }

        if (!hasDrawing) {
          console.warn("Mohon buat tanda tangan terlebih dahulu!");
          return;
        }
        signatureDataUrl = canvas.toDataURL();
      }
    } else if (signatureMode === 'saved' && selectedSavedSignature !== null) {
      const selected = savedSignatures.find(s => s.id === selectedSavedSignature);
      if (selected) signatureDataUrl = selected.dataUrl;
    }

    if (signatureMode === 'saved' && selectedSavedSignature === null) {
      console.warn("Mohon pilih tanda tangan tersimpan!");
      return;
    }

    // Set the signature image state
    if (signatureDataUrl) {
      setSignatureImage(signatureDataUrl);
      console.log("Tanda tangan berhasil diberikan!");
      setShowSignModal(false);
      setAgreeToSign(false);
      setSelectedSavedSignature(null);
    }
  };

  const handleKirimSurat = () => {
    console.log("Surat berhasil dikirim!");
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />

        <main className="flex-1 overflow-auto bg-[#F3F3F3] pt-8 pb-32" style={{ paddingLeft: 10, paddingRight: 10 }}>
          <div className="w-full flex justify-start mb-6">
            <div className="text-sm text-gray-600 mb-6">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/manajer-tu/dashboard-persuratan")}>
                Dashboard
              </span>
              <span className="mx-2">/</span>
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("#")}>
                Form Pengajuan Surat
              </span>
              <span className="mx-2">/</span>
              <span className="text-gray-800 font-medium">Identitas Pemohon</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Proses Penandatanganan
                </h2>
                <p className="text-xs text-gray-600 mb-4">
                  Lengkapi pola tak terbuat surat sebelum dikirim ke kuasa setempanya
                </p>

                {/* QR Section Disabled
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/50 mb-4">
                   ...
                </div>
                */}

                <div>
                  <h3 className="font-medium text-sm text-gray-900 mb-2">Aksi</h3>
                  <Button
                    onClick={handleBeriTandaTangan}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium text-sm"
                  >
                    Beri Tanda Tangan
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column - Preview Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Pratinjau Surat</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={handleZoomOut}
                      className="p-1.5 hover:bg-white rounded transition-colors"
                    >
                      <ZoomOut className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-700 font-medium min-w-[45px] text-center">
                      {zoom}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1.5 hover:bg-white rounded transition-colors"
                    >
                      <ZoomIn className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Letter Preview */}
                <div
                  ref={previewRef}
                  className="border-2 border-gray-200 rounded-lg bg-white overflow-auto relative shadow-inner"
                  style={{ height: "750px" }}
                >
                  <div
                    className="p-8 relative origin-top-left min-h-full"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top left",
                      width: `${100 / (zoom / 100)}%`,
                    }}
                  >
                    <div className="w-full flex justify-center mb-10">
                      <AK006LetterTemplate
                        signatureUrl={signatureImage}
                        data={{
                          nama_lengkap: "......................................................................................................",
                          nim: "................................................",
                          role: "Mahasiswa",
                          email: "",
                          departemen: "................................................",
                          program_studi: "................................................",
                          tempat_lahir: "",
                          tanggal_lahir: "",
                          no_hp: "",
                          alamat: "................................................",
                          jenis_surat: "Surat Keterangan Masih Kuliah",
                          keperluan_surat: "..................",
                          nama_ortu_wali: "................................................................",
                          nip_pensiun_ortu_wali: "-",
                          golongan_ortu_wali: "-",
                          instansi_ortu_wali: "-",
                          attachments: { mandatory: [], optional: [] }
                        }}
                        templateConfig={templateConfig}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 right-0 bg-white border-t shadow-lg py-4 z-30" style={{ left: 280, paddingLeft: 10, paddingRight: 10 }}>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-2 border-gray-300 hover:bg-gray-50"
          >
            Kembali
          </Button>
          <Button
            onClick={handleKirimSurat}
            className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-10 py-2 font-semibold"
          >
            Kirim Surat
          </Button>
        </div>
      </div>

      {/* Enhanced Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b px-6 py-4 bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-900">Beri Tanda Tangan</h2>
            </div>

            {/* Tab Navigation - UPDATED WITH VECTOR ICONS ONLY */}
            <div className="flex border-b bg-white">
              <button
                onClick={() => setSignatureMode('draw')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${signatureMode === 'draw'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <PenTool className="w-5 h-5" />
                Gambar
              </button>
              <button
                onClick={() => setSignatureMode('upload')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${signatureMode === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Upload className="w-5 h-5" />
                Upload
              </button>
              <button
                onClick={() => setSignatureMode('saved')}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${signatureMode === 'saved'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Archive className="w-5 h-5" />
                Tersimpan
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Draw Mode */}
              {signatureMode === 'draw' && (
                <div className="space-y-4">
                  <div className="border-2 border-gray-300 rounded-lg bg-blue-50 p-4">
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={300}
                      className="w-full bg-white border-2 border-dashed border-gray-300 rounded cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={clearCanvas}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus
                    </Button>
                    <Button
                      onClick={saveSignature}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="w-4 h-4" />
                      Simpan TTD
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Mode */}
              {signatureMode === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 bg-gray-50 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                    <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Klik untuk upload atau drag & drop
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, atau GIF (Maksimal 2MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Handle file upload
                          console.log('File uploaded:', file);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Saved Signatures Mode */}
              {signatureMode === 'saved' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedSignatures.map((sig) => (
                      <div
                        key={sig.id}
                        onClick={() => setSelectedSavedSignature(sig.id)}
                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedSavedSignature === sig.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-300 hover:border-blue-300 hover:shadow'
                          }`}
                      >
                        {selectedSavedSignature === sig.id && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <div className="h-32 flex items-center justify-center bg-white rounded border border-gray-200">
                          {/* Simulated signature image */}
                          <div className="text-4xl font-signature text-gray-800">
                            {sig.id === 1 && "✍️"}
                            {sig.id === 2 && "🖊️"}
                            {sig.id === 3 && "✒️"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button className="text-sm text-blue-600 hover:underline font-medium">
                      Simpan TTD
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview & Actions */}
            <div className="border-t bg-gray-50 p-6">
              <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreeToSign}
                    onChange={(e) => setAgreeToSign(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                    Saya menyatakan tanda tangan ini sah untuk dokumen ini
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSignModal(false);
                    setAgreeToSign(false);
                    setSelectedSavedSignature(null);
                  }}
                  className="px-8 py-2.5 font-medium"
                >
                  Kembali
                </Button>
                <Button
                  onClick={handleConfirmSign}
                  disabled={!agreeToSign || (signatureMode === 'draw' && !isCanvasDirty)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}