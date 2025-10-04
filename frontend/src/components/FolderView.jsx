import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiFolder, FiArrowLeft, FiMoreVertical } from 'react-icons/fi';
import { getIconByContentType } from '../utils/getIconByContentType';
import FilePreview from './FilePreview';
import RenameModel from './RenameModel';
import MoveModel from './MoveModel';
import ShareModal from './ShareModal';
import ManageAccessModal from './ManageAccessModal';
import './FileView.css';

const FolderView = ({ setCurrentFolderId, refreshFlag, setRefreshFlag }) => {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  // Rename
  const [renameItem, setRenameItem] = useState(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);

  // Move
  const [moveItem, setMoveItem] = useState(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  // Share with users
  const [shareItem, setShareItem] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Manage access
  const [manageItem, setManageItem] = useState(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  // Dropdown menu
  const [openMenuId, setOpenMenuId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setCurrentFolderId(id);
  }, [id, setCurrentFolderId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fileRes = await axios.get('/api/v1/files', { withCredentials: true });
        const folderRes = await axios.get('/api/v1/folders', { withCredentials: true });

        const allFiles = fileRes.data.data.files || [];
        const allFolders = folderRes.data.data.folders || [];

        setFiles(allFiles.filter(file => file.folder === id));
        setFolders(allFolders.filter(folder => folder.parent === id));
        setCurrentFolder(allFolders.find(f => f._id === id));
        setIsLoggedIn(true);
      } catch (err) {
        if (err.response && err.response.status === 401) setIsLoggedIn(false);
        else console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, refreshFlag]);

  const handleBackNavigation = () => {
    if (currentFolder?.parent) navigate(`/folder/${currentFolder.parent}`);
    else navigate('/');
  };

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

  const openRenameModal = (type, id, name) => {
    setRenameItem({ type, id, name });
    setRenameModalOpen(true);
    setOpenMenuId(null);
  };

  const handleMoveToTrash = async (id, type) => {
    try {
      if (type === "file") {
        await axios.delete(`/api/v1/files/delete/${id}`, { withCredentials: true });
        setFiles(prevFiles => prevFiles.filter(file => file._id !== id));
      } else {
        await axios.delete(`/api/v1/folders/delete/${id}`, { withCredentials: true });
        setFolders(prevFolders => prevFolders.filter(folder => folder._id !== id));
      }
      setOpenMenuId(null);
    } catch (err) {
      console.error("Error moving to trash:", err);
    }
  };

  const handleRename = async (newName) => {
    try {
      if (renameItem.type === 'file') {
        await axios.patch(`/api/v1/files/rename/${renameItem.id}`, { filename: newName }, { withCredentials: true });
        setFiles(prev => prev.map(f => f._id === renameItem.id ? { ...f, filename: newName } : f));
      } else if (renameItem.type === 'folder') {
        await axios.patch(`/api/v1/folders/rename/${renameItem.id}`, { name: newName }, { withCredentials: true });
        setFolders(prev => prev.map(f => f._id === renameItem.id ? { ...f, name: newName } : f));
      }
      setRenameModalOpen(false);
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  const openMoveModal = (type, id, name) => {
    setMoveItem({ type, id, name });
    setMoveModalOpen(true);
    setOpenMenuId(null);
  };

  const handleMove = async (targetFolderId) => {
    try {
      if (!moveItem) return;

      if (moveItem.type === 'file') {
        await axios.patch(`/api/v1/files/move/${moveItem.id}`, { folder: targetFolderId }, { withCredentials: true });
      } else if (moveItem.type === 'folder') {
        await axios.patch(`/api/v1/folders/move/${moveItem.id}`, { parent: targetFolderId }, { withCredentials: true });
      }

      // Re-fetch updated lists for the current view
      try {
        const fileRes = await axios.get('/api/v1/files', { withCredentials: true });
        const folderRes = await axios.get('/api/v1/folders', { withCredentials: true });

        const allFiles = fileRes.data.data.files || [];
        const allFolders = folderRes.data.data.folders || [];

        setFiles(allFiles.filter(file => file.folder === id));
        setFolders(allFolders.filter(folder => folder.parent === id));
        setCurrentFolder(allFolders.find(f => f._id === id));
      } catch (refetchErr) {
        console.error('Refetch after move failed:', refetchErr);
      }

      setMoveModalOpen(false);
      setMoveItem(null);
    } catch (err) {
      console.error('Move failed:', err);
    }
  };

  const openShareModal = (type, id, name) => {
    setShareItem({ type, id, name });
    setShareModalOpen(true);
    setOpenMenuId(null);
  };
  
  const openManageAccessModal = (type, id, name, sharedWith, shareableLink, linkPermission) => {
    setManageItem({ type, id, name, sharedWith, shareableLink, linkPermission });
    setManageModalOpen(true);
    setOpenMenuId(null);
  };

  if (isLoading) return <p className="loading-text">Loading...</p>;
  if (!isLoggedIn) return <p className="not-logged-in">Please log in to view your files.</p>;

  return (
    <div className="folder-view-container">
      <div className="folder-header">
        <button className="back-button" onClick={handleBackNavigation}>
          <FiArrowLeft />
        </button>
        <h2 className="folder-title">{currentFolder ? currentFolder.name : 'Folder'}</h2>
      </div>

      <div className="file-grid">
        {/* Subfolders */}
        {folders.map(folder => (
          <div key={folder._id} className="file-card folder-card" style={{ position: 'relative' }}>
            <div className="file-preview" onClick={() => navigate(`/folder/${folder._id}`)}>
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
                  <p onClick={() => openShareModal('folder', folder._id, folder.name)}>Share</p>
                  <p onClick={() => openManageAccessModal('folder', folder._id, folder.name, folder.sharedWith, folder.shareableLink, folder.linkPermission)}>Manage Access</p>
                  <p onClick={() => openRenameModal('folder', folder._id, folder.name)}>Rename</p>
                  <p onClick={() => openMoveModal('folder', folder._id, folder.name)}>Move</p>
                  <p onClick={() => handleMoveToTrash(folder._id, 'folder')}>Move to Trash</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Files */}
        {files.map(file => {
          const IconComponent = getIconByContentType(file.contentType);
          return (
            <div key={file._id} className="file-card" style={{ position: 'relative' }}>
              <div className="file-preview" onClick={() => setSelectedFile(file)}>
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
                    <p onClick={() => openShareModal('file', file._id, file.filename)}>Share</p>
                    <p onClick={() => openManageAccessModal('file', file._id, file.filename, file.sharedWith, file.shareableLink, file.linkPermission)}>Manage Access</p>
                    <p onClick={() => openRenameModal('file', file._id, file.filename)}>Rename</p>
                    <p onClick={() => openMoveModal('file', file._id, file.filename)}>Move</p>
                    <p onClick={() => handleMoveToTrash(file._id, 'file')}>Move to Trash</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {files.length === 0 && folders.length === 0 && (
          <div className="empty-folder"><p>This folder is empty.</p></div>
        )}
      </div>

      {selectedFile && <FilePreview file={selectedFile} onClose={() => setSelectedFile(null)} />}

      <RenameModel
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        currentName={renameItem?.name}
        onRename={handleRename}
      />

      <MoveModel
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        item={moveItem}
        onMove={handleMove}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        item={shareItem}
      />

      <ManageAccessModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        item={manageItem}
        onUpdate={() => setRefreshFlag(prev => !prev)}
      />

    </div>
  );
};

export default FolderView;