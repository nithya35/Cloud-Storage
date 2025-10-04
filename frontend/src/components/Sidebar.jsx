import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>CloudDrive</h2>
      <ul>
        <li><Link to="/">My Drive</Link></li>
        <li><Link to="/shared-page">Shared with me</Link></li>
        <li><Link to="/trash">Trash</Link></li>
        <li><Link to="/stats">Stats</Link></li>
        <li><button onClick={() => localStorage.clear() || window.location.replace('/login')}>Logout</button></li>
      </ul>
    </div>
  );
};

export default Sidebar;
