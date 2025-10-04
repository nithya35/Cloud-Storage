import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SharedView from '../components/SharedView';
import SharedFolderView from '../components/SharedFolderView';
import HeaderShared from '../components/HeaderShared';

const SharedPage = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <HeaderShared />
        <Routes>
          <Route path="/" element={<SharedView />} />
          <Route path="folder/:id" element={<SharedFolderView />} />
        </Routes>
      </div>
    </div>
  );
};

export default SharedPage;