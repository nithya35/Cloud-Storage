import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import FileView from '../components/FileView';
import FolderView from '../components/FolderView';

const Dashboard = () => {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <Header 
          currentFolderId={currentFolderId} 
          setRefreshFlag={setRefreshFlag} 
        />
        <Routes>
          <Route
            path="/"
            element={
              <FileView 
                setCurrentFolderId={setCurrentFolderId} 
                refreshFlag={refreshFlag} 
                setRefreshFlag={setRefreshFlag}
              />
            }
          />
          <Route
            path="/folder/:id"
            element={
              <FolderView 
                setCurrentFolderId={setCurrentFolderId} 
                refreshFlag={refreshFlag}
                setRefreshFlag={setRefreshFlag}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
