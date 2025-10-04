import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MoveModel.css';

const MoveModel = ({ isOpen, onClose, item, onMove }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchFolders = async () => {
      try {
        const res = await axios.get('/api/v1/folders', { withCredentials: true });
        setFolders(res.data.data.folders || []);
      } catch (err) {
        console.error('Failed to fetch folders:', err);
      }
    };
    fetchFolders();
  }, [isOpen]);

  const renderTree = (parentId = null, level = 0) => {
    return folders
      .filter(f => f.parent === parentId)
      .map(f => {
        const isDisabled = item?.type === 'folder' && f._id === item.id;
        return (
          <div key={f._id} style={{ marginLeft: level * 20 }}>
            <div
              className={`folder-node ${isDisabled ? 'disabled' : ''} ${selectedFolder === f._id ? 'selected' : ''}`}
              onClick={() => !isDisabled && setSelectedFolder(f._id)}
            >
              {f.name} {selectedFolder === f._id && '✔'}
            </div>
            {renderTree(f._id, level + 1)}
          </div>
        );
      });
  };

  const handleMove = async () => {
    await onMove(selectedFolder);
    setSelectedFolder(null);
    onClose(); 
  };

  if (!isOpen) return null;

  return (
    <div className="move-modal-backdrop" onClick={onClose}>
      <div className="move-modal-container" onClick={e => e.stopPropagation()}>
        <h3>Move {item?.type}</h3>
        <div className="folder-tree">
          {/* Root option */}
          <div
            className={`folder-node ${selectedFolder === null ? 'selected' : ''}`}
            onClick={() => setSelectedFolder(null)}
          >
            Root {selectedFolder === null && '✔'}
          </div>
          {renderTree()}
        </div>
        <div className="move-modal-buttons">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="submit-btn"
            onClick={handleMove}
            disabled={selectedFolder === item?.id}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveModel;
