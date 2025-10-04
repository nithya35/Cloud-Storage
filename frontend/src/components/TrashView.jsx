import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getIconByContentType } from '../utils/getIconByContentType';
import { FiFolder, FiMoreVertical } from 'react-icons/fi';
import TrashFilePreview from './TrashFilePreview';
import './FileView.css';

const TrashView = () => {
  const [trashedFiles, setTrashedFiles] = useState([]);
  const [trashedFolders, setTrashedFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  // Dropdown menu
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fileRes = await axios.get('/api/v1/files/trash', { withCredentials: true });
        const folderRes = await axios.get('/api/v1/folders/trash', { withCredentials: true });

        const allTrashedFiles = fileRes.data.data.files || [];
        const allTrashedFolders = folderRes.data.data.folders || [];

        const trashedFolderIds = new Set(allTrashedFolders.map(f => f._id));

        const filteredFiles = allTrashedFiles.filter(file => {
          return file.folder === null || !trashedFolderIds.has(file.folder);
        });

        const filteredFolders = allTrashedFolders.filter(folder => {
          return folder.parent === null || !trashedFolderIds.has(folder.parent);
        });

        setTrashedFiles(filteredFiles);
        setTrashedFolders(filteredFolders);

        setIsLoggedIn(true);
      } catch (err) {
        if (err.response && err.response.status === 401) setIsLoggedIn(false);
        else console.error('Error fetching trashed data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.three-dots-container')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleRestore = async (id, type) => {
    try {
      if (type === 'file') {
        await axios.patch(`/api/v1/files/restore/${id}`, {}, { withCredentials: true });
        setTrashedFiles(prevFiles => prevFiles.filter(file => file._id !== id));
      } else if (type === 'folder') {
        await axios.patch(`/api/v1/folders/restore/${id}`, {}, { withCredentials: true });
        setTrashedFolders(prevFolders => prevFolders.filter(folder => folder._id !== id));
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error(`Error restoring ${type}:`, err);
    }
  };

  const handleDeletePermanently = async (id, type) => {
    try {
      if (type === 'file') {
        await axios.delete(`/api/v1/files/deletepermanent/${id}`, { withCredentials: true });
        setTrashedFiles(prevFiles => prevFiles.filter(file => file._id !== id));
      } else if (type === 'folder') {
        await axios.delete(`/api/v1/folders/deletepermanent/${id}`, { withCredentials: true });
        setTrashedFolders(prevFolders => prevFolders.filter(folder => folder._id !== id));
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error(`Error deleting ${type} permanently:`, err);
    }
  };

  const handleEmptyTrash = async () => {
    if (window.confirm("Are you sure you want to permanently empty your trash? This action cannot be undone.")) {
      setIsLoading(true);
      try {
        await axios.delete('/api/v1/trash/empty', { withCredentials: true });
        setTrashedFiles([]);
        setTrashedFolders([]);
        console.log("Trash emptied successfully!");
      } catch (err) {
        console.error("Error emptying trash:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  if (isLoading) return <p className="loading-text">Loading trash...</p>;

  if (!isLoggedIn) return <p className="not-logged-in">Please log in to view your trash.</p>;

  const isTrashEmpty = trashedFiles.length === 0 && trashedFolders.length === 0;

  return (
    <>
      <div className="folder-header">
        {!isTrashEmpty && (
          <>
            <p className="trash-info-text">Items are deleted forever after 30 days.</p>
            <button className="empty-trash-btn" onClick={handleEmptyTrash}>Empty Trash</button>
          </>
        )}
      </div>

      {isTrashEmpty ? (
        <p className="no-files">Your trash is empty.</p>
      ) : (
        <div className="file-grid">
          {/* Trashed Folders */}
          {trashedFolders.map((folder) => (
            <div key={folder._id} className="file-card folder-card trashed-item" style={{ position: 'relative' }}>
              <div className="file-preview">
                <FiFolder className="file-icon" />
              </div>
              <div className="file-info">
                <p className="file-name">{folder.name}</p>
              </div>

              <div className="three-dots-container">
                <FiMoreVertical
                  className="three-dots-icon"
                  onClick={() => setOpenMenuId(openMenuId === folder._id ? null : folder._id)}
                />
                {openMenuId === folder._id && (
                  <div className="dropdown-menu">
                    <p onClick={() => handleRestore(folder._id, 'folder')}>Restore</p>
                    <p onClick={() => handleDeletePermanently(folder._id, 'folder')}>
                      Delete Permanently
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Trashed Files */}
          {trashedFiles.map((file) => {
            const IconComponent = getIconByContentType(file.contentType);
            return (
              <div key={file._id} className="file-card trashed-item" style={{ position: 'relative' }}>
                <div className="file-preview" onClick={() => handleFileClick(file)}>
                  {file.contentType?.startsWith('image/') ? (
                    <img src={`/api/v1/files/download/${file._id}`} alt={file.filename} className="image-thumb" />
                  ) : (
                    <IconComponent className="file-icon" />
                  )}
                </div>
                <div className="file-info">
                  <p className="file-name">{file.filename}</p>
                  <p className="file-size">{(file.size / 1000).toFixed(1)} KB</p>
                </div>

                <div className="three-dots-container">
                  <FiMoreVertical
                    className="three-dots-icon"
                    onClick={() => setOpenMenuId(openMenuId === file._id ? null : file._id)}
                  />
                  {openMenuId === file._id && (
                    <div className="dropdown-menu">
                      <p onClick={() => handleRestore(file._id, 'file')}>Restore</p>
                      <p onClick={() => handleDeletePermanently(file._id, 'file')}>
                        Delete Permanently
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedFile && <TrashFilePreview file={selectedFile} onClose={() => setSelectedFile(null)} />}
    </>
  );
};

export default TrashView;