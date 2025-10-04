import React, { useState, useRef, useEffect } from 'react'; // Import useRef and useEffect
import axios from 'axios';
import './Header.css';

const Header = ({ currentFolderId, setRefreshFlag }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);

  // Refs for modal elements
  const uploadModalRef = useRef(null);
  const folderModalRef = useRef(null);

  // Effect to handle clicks outside the modals
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close upload modal if clicked outside
      if (uploadModalRef.current && !uploadModalRef.current.contains(event.target) && showUpload) {
        setShowUpload(false);
        setFile(null); // Clear selected file when closing
      }
      // Close folder modal if clicked outside
      if (folderModalRef.current && !folderModalRef.current.contains(event.target) && showFolderInput) {
        setShowFolderInput(false);
        setFolderName(''); // Clear folder name when closing
      }
    };

    // Add event listener when modals are open
    if (showUpload || showFolderInput) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUpload, showFolderInput]); // Re-run effect when modal visibility changes

  // Handle File Upload
  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (currentFolderId) {
      formData.append('folder', currentFolderId);
    }

    try {
      await axios.post('/api/v1/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setFile(null);
      setShowUpload(false);
      setRefreshFlag((prev) => !prev);
    } catch (error) {
      console.error('Error uploading file:', error);
      // You might want to add some user feedback here
    }
  };

  // Handle Create Folder
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;

    try {
      await axios.post(
        '/api/v1/folders',
        { name: folderName, parent: currentFolderId },
        { withCredentials: true }
      );
      setFolderName('');
      setShowFolderInput(false);
      setRefreshFlag((prev) => !prev);
    } catch (error) {
      console.error('Error creating folder:', error);
      // You might want to add some user feedback here
    }
  };

  return (
    <div className="header">
      <h3>My Drive</h3>
      <div className="header-buttons">
        <button onClick={() => setShowUpload(true)}>Upload File</button> {/* Always open modal */}
        <button onClick={() => setShowFolderInput(true)}>New Folder</button> {/* Always open modal */}
      </div>

      {showUpload && (
        <div className="modal-overlay"> {/* Overlay for upload modal */}
          <div className="upload-box modal-content" ref={uploadModalRef}> {/* Add ref here */}
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={handleUpload} disabled={!file}>Confirm Upload</button> {/* Disable if no file selected */}
            <button onClick={() => setShowUpload(false)} className="close-button">X</button> {/* Close button */}
          </div>
        </div>
      )}

      {showFolderInput && (
        <div className="modal-overlay"> {/* Overlay for folder modal */}
          <div className="folder-box modal-content" ref={folderModalRef}> {/* Add ref here */}
            <input
              type="text"
              placeholder="New folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }} // Allow Enter to create
            />
            <button onClick={handleCreateFolder} disabled={!folderName.trim()}>Create</button> {/* Disable if no name */}
            <button onClick={() => setShowFolderInput(false)} className="close-button">X</button> {/* Close button */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;