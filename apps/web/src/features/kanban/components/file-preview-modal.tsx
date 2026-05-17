'use client';

import { useState } from 'react';
import type { Attachment } from '../types/kanban';

interface FilePreviewModalProps {
  file: Attachment | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file) return null;

  const isImage = file.type?.startsWith('image/');
  const isPdf = file.type?.includes('pdf');
  const isVideo = file.type?.startsWith('video/');

  const getProxyUrl = (url: string) => {
    if (url.startsWith('/uploads')) {
      return `/api/files?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleDownload = async () => {
    try {
      const proxyUrl = getProxyUrl(file.url);
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{file.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Unknown size'} • {file.type || 'Unknown type'}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            {isImage ? (
              <img src={getProxyUrl(file.url)} alt={file.name} className="max-w-full max-h-full object-contain" />
            ) : isPdf ? (
              <iframe src={getProxyUrl(file.url)} className="w-full h-full" title={file.name} />
            ) : isVideo ? (
              <video src={getProxyUrl(file.url)} controls className="max-w-full max-h-full" />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">Preview not available</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Click download to view this file</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
