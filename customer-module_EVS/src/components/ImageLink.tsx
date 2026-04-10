import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import ImageModal from './ImageModal';
import { convertGoogleDriveLink, isImageUrl } from '../utils/answerTemplateUtils';

interface ImageLinkProps {
  text: string;
}

export default function ImageLink({ text }: ImageLinkProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const trimmedText = String(text).trim();

  if (!trimmedText) {
    return null;
  }

  const isImage = isImageUrl(trimmedText);

  if (!isImage) {
    return <span>{trimmedText}</span>;
  }

  const imageUrl = convertGoogleDriveLink(trimmedText);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
      >
        <Eye className="w-4 h-4" />
        View Image
      </button>
      <ImageModal 
        isOpen={isModalOpen}
        imageUrl={imageUrl}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
