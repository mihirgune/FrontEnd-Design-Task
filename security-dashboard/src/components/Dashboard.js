import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';  
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = ({ setAuth }) => {
  const [alerts, setAlerts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/alert');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    setAuth(false);
    localStorage.setItem('auth', 'false');
    navigate('/login');
  };

  // Grouping alerts by severity for the donut chart
  const severitySummary = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {});

  // Define the order of severity levels
  const severityOrder = ['Critical', 'High', 'Medium', 'Low'];

  // Assigning colors based on severity
  const severityColors = {
    Low: '#FFC000', 
    Medium: '#F08000',
    High: 'orangered',
    Critical: 'red',
  };

  // Random color fallback for any undefined severity level
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const chartData = {
    labels: severityOrder.filter(severity => severitySummary[severity] !== undefined),
    datasets: [{
      data: severityOrder.map(severity => severitySummary[severity] || 0),
      backgroundColor: severityOrder.map(
        severity => severityColors[severity] || getRandomColor()
      ),
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
  };



  // Sort severities based on the defined order
  const sortedSeverities = Object.keys(severitySummary).sort((a, b) => {
    const indexA = severityOrder.indexOf(a);
    const indexB = severityOrder.indexOf(b);
    
    if (indexA === -1 && indexB === -1) return 0; // Both are unknown
    if (indexA === -1) return 1; // 'a' is unknown
    if (indexB === -1) return -1; // 'b' is unknown
    
    return indexA - indexB; // Sort by defined order
  });

  return (
    <div className={`dashboard ${menuOpen ? 'menu-open' : ''}`}>
      {/* Top bar with alerts section */}
      <div className="top-bar">
        <div className="left-section">
          <div className="menu-toggle" onClick={toggleMenu}>
            <div className="triangle triangle-left"></div>
            <div className="menu-icon">
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </div>
          </div>
        </div>
        <div className="middle-section"></div>
        <div className="right-section">
          <div className="sign-out" onClick={handleLogout}>
            Sign Out
          </div>
        </div>
      </div>

      {/* Side menu */}
      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="user-info">
          <div className="user-photo"></div>
          <div className="user-name">{username}</div>
        </div>
        <div className="collapse-arrow-container" onClick={toggleMenu}>
          <div className="triangle triangle-left"></div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <h1 className="title">Alerts</h1>

        {/* Summary Section with Bounded Donut Chart and Table */}
        <div className="summary" style={{ display: 'flex', flexDirection: 'row', width: '50%', padding: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ textAlign: 'left' }}>Severity Levels</h2>

            {/* Donut Chart */}
            <div style={{ width: '100%', height: '300px' }}>
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>

          <div style={{ flex: 1, marginLeft: '1rem', fontSize: '0.85rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Severity</th>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {sortedSeverities.map((severity) => (
                  <tr key={severity}>
                    <td style={{ padding: '0.25rem' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: severityColors[severity] || getRandomColor(), marginRight: '0.5rem' }}></span>
                      {severity}
                    </td>
                    <td style={{ padding: '0.25rem' }}>{severitySummary[severity]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts Table */}
        {alerts.length > 0 ? (
          <div className="alerts-table">
            <h2>Alerts</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>More Info</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.id}</td>
                    <td>{alert.name}</td>
                    <td>{alert.severity}</td>
                    <td>{alert.description}</td>
                    <td>
                      <Link to={`/alert/${alert.id}`}>More Info</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-alerts">
            <p>To start, upload a CSV file with your log data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
