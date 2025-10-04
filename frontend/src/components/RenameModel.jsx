import React, { useState, useEffect } from 'react';
import './RenameModel.css';

const RenameModel = ({ isOpen, onClose, currentName, onRename }) => {
  const [newName, setNewName] = useState('');
  const [extension, setExtension] = useState('');

  // Update state whenever currentName changes or modal opens
  useEffect(() => {
    if (isOpen && currentName) {
      // Check if it's a file (has extension) or folder (no extension)
      const lastDotIndex = currentName.lastIndexOf('.');
      
      if (lastDotIndex > 0 && lastDotIndex < currentName.length - 1) {
        // It's a file with extension
        const nameOnly = currentName.substring(0, lastDotIndex);
        const ext = currentName.substring(lastDotIndex);
        setExtension(ext);
        setNewName(nameOnly);
      } else {
        // It's a folder or file without extension
        setExtension('');
        setNewName(currentName);
      }
    }
  }, [currentName, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() !== '') {
      // Reconstruct the full name with original extension
      const finalName = extension ? `${newName.trim()}${extension}` : newName.trim();
      onRename(finalName);
      // Don't reset here - let the parent close the modal
      // The reset will happen when modal closes
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state AFTER modal closes (small delay to prevent flash)
    setTimeout(() => {
      setNewName('');
      setExtension('');
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="rename-modal-backdrop" onClick={handleClose}>
      <div className="rename-modal-container" onClick={(e) => e.stopPropagation()}>
        <h3>Rename</h3>
        <form onSubmit={handleSubmit}>
          <div className={`input-wrapper ${extension ? 'has-file-extension' : ''}`}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              placeholder="Enter new name"
              className={extension ? 'has-extension' : ''}
            />
            {extension && (
              <span className="file-extension">{extension}</span>
            )}
          </div>
          <div className="rename-modal-buttons">
            <button type="button" onClick={handleClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModel;