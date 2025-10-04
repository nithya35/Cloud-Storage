import React from 'react';
import Sidebar from '../components/Sidebar';
import TrashView from '../components/TrashView';
import HeaderTrash from '../components/HeaderTrash';

const TrashPage = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <HeaderTrash />
        <TrashView />
      </div>
    </div>
  );
};

export default TrashPage;