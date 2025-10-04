import Sidebar from '../components/Sidebar';
import StatsView from '../components/StatsView';
import HeaderStats from '../components/HeaderStats';

const StatsPage = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <HeaderStats />
        <StatsView />
      </div>
    </div>
  );
};

export default StatsPage;
