import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileAlt,
  FaFileArchive,
  FaFileVideo,
  FaFileAudio,
  FaFileCode,
  FaFile,
} from 'react-icons/fa';

export function getIconByContentType(contentType) {
  if (!contentType) return FaFile;

  if (contentType.startsWith('image/')) return FaFileImage;
  if (contentType.startsWith('video/')) return FaFileVideo;
  if (contentType.startsWith('audio/')) return FaFileAudio;
  if (contentType === 'application/pdf') return FaFilePdf;

  // Word Docs
  if (
    contentType === 'application/msword' ||
    contentType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return FaFileWord;

  // Excel
  if (
    contentType === 'application/vnd.ms-excel' ||
    contentType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return FaFileExcel;

  // PowerPoint
  if (
    contentType === 'application/vnd.ms-powerpoint' ||
    contentType ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
    return FaFilePowerpoint;

  // Zip/Rar
  if (
    contentType === 'application/zip' ||
    contentType === 'application/x-rar-compressed' ||
    contentType === 'application/x-7z-compressed' ||
    contentType === 'application/x-tar' ||
    contentType === 'application/gzip'
  )
    return FaFileArchive;

  // Code files
  if (
    contentType.startsWith('text/') ||
    contentType === 'application/javascript' ||
    contentType === 'application/json' ||
    contentType === 'application/xml' ||
    contentType === 'application/x-python-code' ||
    contentType === 'text/x-c' ||
    contentType === 'text/x-c++' ||
    contentType === 'application/java'
  )
    return FaFileCode;

  // Default for text-based files
  if (contentType.startsWith('application/') || contentType.startsWith('text/'))
    return FaFileAlt;

  return FaFile;
}
