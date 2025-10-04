import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Modal.css';

const ShareModal = ({ isOpen, onClose, item }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Reset state when the modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleShareUser = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post(
        `/api/v1/${item.type}s/share/${item.id}`,
        { email, permission: 'viewer' },
        { withCredentials: true }
      );
      setMessage(res.data.message);
      setEmail('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to share resource.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Share "{item.name}"</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <h4 className="share-heading">Share with a new user:</h4>
          <form onSubmit={handleShareUser}>
            <div className="form-content">
              <div className="form-row">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="button-container">
              <button type="submit" className="btn-simple">Share</button>
            </div>
            {message && <p className="message">{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;