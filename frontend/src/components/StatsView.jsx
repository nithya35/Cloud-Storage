import React, { useEffect, useState } from "react";
import axios from 'axios';
import "./StatsView.css";

const StatsView = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/v1/users/my-storage-stats', { withCredentials: true });
        setStats(response.data.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, []);

  if (!stats) return <p>Loading stats...</p>;

  const displayValue = (value) => {
    if (value === null || value === undefined) return 0;
    return value;
  };

  return (
    <div className="stats-container">
      {/* Total Storage */}
      <div className="stats-card">
        <h3>Total Storage</h3>
        <p>{displayValue(stats?.totalStorageGB)} GB of 5GB</p>
      </div>

      {/* Active Stats */}
      <div className="stats-card">
        <h3>Active</h3>
        <div className="active-content">
          <div className="active-info">
            <p><strong>Files:</strong> {displayValue(stats?.active?.totalFiles)}</p>
            <p><strong>Folders:</strong> {displayValue(stats?.active?.totalFolders)}</p>
            <p><strong>Storage:</strong> {displayValue(stats?.active?.storageGB)} GB</p>
          </div>
          <div className="files-by-type">
            <h4>Files by Type</h4>
            <ul>
              {stats?.active?.filesByType &&
                Object.entries(stats.active.filesByType).map(([type, count]) => (
                  <li key={type}>
                    <strong>{type}</strong>
                    <span>{count}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Trash Stats */}
      <div className="stats-card">
        <h3>Trash</h3>
        <p><strong>Files:</strong> {displayValue(stats?.trash?.totalFiles)}</p>
        <p><strong>Folders:</strong> {displayValue(stats?.trash?.totalFolders)}</p>
        <p><strong>Storage:</strong> {displayValue(stats?.trash?.storageGB)} GB</p>
      </div>
    </div>
  );
};

export default StatsView;