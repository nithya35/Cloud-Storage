import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Modal.css';

const ManageAccessModal = ({ isOpen, onClose, item }) => {
  const [sharedUsers, setSharedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the latest shared users when the modal opens
  useEffect(() => {
    const fetchSharedUsers = async () => {
      if (!item) return;
      setIsLoading(true);
      try {
        const res = await axios.get(
          `/api/v1/${item.type}s/share/${item.id}`,
          { withCredentials: true }
        );
        setSharedUsers(res.data.data.sharedWith);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch shared users:', err);
        setMessage('Failed to load shared users. Please try again.');
        setIsLoading(false);
      }
    };

    if (isOpen) {
      setMessage('');
      fetchSharedUsers();
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleUnshareUser = async (email) => {
    setMessage('');
    try {
      await axios.delete(
        `/api/v1/${item.type}s/unshare/${item.id}`,
        { data: { email }, withCredentials: true }
      );
      // Update the state locally
      setSharedUsers(prev => prev.filter(user => user.email !== email));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to unshare user.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Manage Access for "{item.name}"</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <h4>Shared with:</h4>
          {isLoading ? (
            <p>Loading shared users...</p>
          ) : (
            <ul className="shared-users-list">
              {sharedUsers.length > 0 ? (
                sharedUsers.map(user => (
                  <li key={user._id || user.user}>
                    <span>{user.email}</span>
                    <div className="user-controls">
                      <button className="btn-simple" onClick={() => handleUnshareUser(user.email)}>
                        Unshare
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p>This resource has not been shared with any users.</p>
              )}
            </ul>
          )}
          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ManageAccessModal;