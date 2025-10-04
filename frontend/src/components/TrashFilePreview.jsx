import React, { useState } from "react";
import "./FilePreview.css";
import { getIconByContentType } from "../utils/getIconByContentType";

const TrashFilePreview = ({ file, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  if (!file) return null;

  const previewUrl = `/api/v1/files/preview/${file._id}`;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const hasPreview = file.contentType.startsWith("image/") || file.contentType === "application/pdf";

  const renderPreview = () => {
    if (file.contentType.startsWith("image/")) {
      return (
        <img
          src={previewUrl}
          alt={file.filename}
          className="preview-image"
          onLoad={handleLoad}
        />
      );
    } else if (file.contentType === "application/pdf") {
      return (
        <iframe
          src={previewUrl}
          title={file.filename}
          className="preview-pdf"
          onLoad={handleLoad}
        ></iframe>
      );
    } else {
      const Icon = getIconByContentType(file.contentType);
      return (
        <div className="no-preview">
          <Icon size={80} />
          <p>Preview not available for this file type.</p>
        </div>
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${file.contentType === "application/pdf" ? "wide-modal" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{file.filename}</h2>

        {hasPreview && isLoading && <p className="loading-text">Loading preview…</p>}

        <div className="preview-container">{renderPreview()}</div>

        <div className="modal-actions">
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrashFilePreview;