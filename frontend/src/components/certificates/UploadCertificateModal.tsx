'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { certificatesApi } from '@/lib/api';

const CERT_TYPES = [
  'Health Certificate',
  'Fire Safety Certificate',
  'Food Handler Certificate',
  'Liquor Licence',
  'Building Compliance',
  'Other',
];

interface Props {
  storeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadCertificateModal({ storeId, onClose, onSuccess }: Props) {
  const [certType, setCertType] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certType || !issueDate || !expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      let s3Key = `mock/cert-${Date.now()}.pdf`;

      if (file) {
        const { s3Key: key } = await certificatesApi.getUploadUrl(
          storeId,
          file.name,
          file.type || 'application/pdf',
        );
        s3Key = key;
        // In production: await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      }

      await certificatesApi.create({
        storeId,
        certificateType: certType,
        issueDate,
        expiryDate,
        s3Key,
      } as Parameters<typeof certificatesApi.create>[0]);

      toast.success('Certificate uploaded successfully');
      onSuccess();
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Upload Certificate</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Type <span className="text-danger-500">*</span>
            </label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">Select type…</option>
              {CERT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date <span className="text-danger-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date <span className="text-danger-500">*</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="input w-full"
                min={issueDate}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate File <span className="text-gray-400 font-normal">(PDF, optional)</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-brand-600">
                  <FileText size={16} />
                  <span className="font-medium truncate max-w-xs">{file.name}</span>
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  <Upload size={22} className="mx-auto mb-1.5 text-gray-300" />
                  Click to select a PDF file
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={15} /> Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
