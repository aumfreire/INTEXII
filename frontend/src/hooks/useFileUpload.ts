import { useCallback, useMemo, useState } from 'react';
import type { ChatAttachment } from '../types/chat';

const supportedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.csv', '.xlsx', '.docx', '.txt', '.md'];

export function useFileUpload() {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const addFiles = useCallback((files: File[]) => {
    const next = files
      .filter((file) => {
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        return supportedExtensions.includes(ext);
      })
      .map((file) => ({
        file,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));

    setAttachments((prev) => [...prev, ...next].slice(0, 8));
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachments((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearFiles = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
      return [];
    });
  }, []);

  const accept = useMemo(() => supportedExtensions.join(','), []);

  return {
    attachments,
    addFiles,
    removeFile,
    clearFiles,
    accept,
  };
}
