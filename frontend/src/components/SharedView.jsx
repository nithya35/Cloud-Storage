import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getIconByContentType } from '../utils/getIconByContentType';
import { FiFolder, FiMoreVertical, FiDownload } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import FilePreview from './FilePreview';
import './FileView.css';

const SharedView = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const res = await axios.get('/api/v1/users/shared-with-me', { withCredentials: true });
        const data = res.data.data;
        
        const allFiles = data.files || [];
        const allFolders = data.folders || [];
        
        // Only show files and folders at root level (where folder/parent is null)
        setFiles(allFiles.filter(file => file.folder === null));
        setFolders(allFolders.filter(folder => folder.parent === null));
        setIsLoggedIn(true);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          setIsLoggedIn(false);
        } else {
          console.error('Error fetching shared data:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedData();
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

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await axios.get(`/api/v1/files/download/${fileId}`, {
        withCredentials: true,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setOpenMenuId(null);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file.');
    }
  };

  if (isLoading) return <p className="loading-text">Loading...</p>;
  if (!isLoggedIn) return <p className="not-logged-in">Please log in to view shared files.</p>;
  if (files.length === 0 && folders.length === 0) {
    return <p className="no-files">No files or folders shared with you yet.</p>;
  }

  return (
    <>
      <div className="file-grid">
        {/* Shared Folders */}
        {folders.map(folder => (
          <div key={folder._id} className="file-card folder-card" style={{ position: 'relative' }}>
            <div className="file-preview" onClick={() => navigate(`/shared/folder/${folder._id}`)}>
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
                  <p onClick={() => navigate(`/shared/folder/${folder._id}`)}>Open</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Shared Files */}
        {files.map(file => {
          const IconComponent = getIconByContentType(file.contentType);
          return (
            <div key={file._id} className="file-card" style={{ position: 'relative' }}>
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
                    <p onClick={() => handleDownload(file._id, file.filename)}>
                      <FiDownload style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Download
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedFile && <FilePreview file={selectedFile} onClose={() => setSelectedFile(null)} />}
    </>
  );
};

export default SharedView;