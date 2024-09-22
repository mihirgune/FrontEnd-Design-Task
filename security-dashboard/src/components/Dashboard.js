import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';  
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronUp, faChevronDown, faFilter} from '@fortawesome/free-solid-svg-icons';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = ({ setAuth }) => {
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);

  const username = localStorage.getItem('username');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [searchTerm, selectedSeverity]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/alert');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const data = await response.json();
      setAlerts(data.alerts);
      setFilteredAlerts(data.alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleLogout = () => {
    setAuth(false);
    localStorage.setItem('auth', 'false');
    navigate('/login');
  };

  const severitySummary = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {});

  const severityOrder = ['Critical', 'High', 'Medium', 'Low'];
  const severityColors = {
    Low: '#FFC000', 
    Medium: '#F08000',
    High: 'orangered',
    Critical: 'red',
  };

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
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const clickedIndex = elements[0].index;
        const clickedSeverity = severityOrder[clickedIndex];
        setSelectedSeverity(clickedSeverity);
        setIsFiltered(true);
      }
    },
  };

  const handleFilterReset = () => {
    setSelectedSeverity(null); // Reset severity filter
    setIsFiltered(false); // Reset filter state
  };

  const sortedSeverities = Object.keys(severitySummary).sort((a, b) => {
    const indexA = severityOrder.indexOf(a);
    const indexB = severityOrder.indexOf(b);
    return indexA - indexB;
  });

  const filterAlerts = () => {
    let filtered = alerts;
    if (selectedSeverity) {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        alert =>
          alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredAlerts(filtered);
  };

  const sortAlerts = (alerts) => {
    return alerts.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedAlerts = sortAlerts(filteredAlerts);

  return (
    <div className="dashboard">
      <div className="top-bar">
        <div className="profile-section">
          <div className="user-photo"></div>
          <div className="user-info">
            <div className="user-name">{username}</div>
            <div className="sign-out" onClick={handleLogout}>Sign Out</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <h1 className="alerts-title">Alerts</h1>

        <div className="summary" style={{ display: 'flex', flexDirection: 'row', width: '50%', padding: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ textAlign: 'left' }}>Severity Levels</h2>
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

        <div className="search-container">
          <div className="search-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredAlerts.length > 0 ? (
          <div className="alerts-table">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '10%', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      ID
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '5px', alignItems: 'center' }}>
                        <FontAwesomeIcon
                          icon={faChevronUp}
                          className={`sort-icon ${sortField === 'id' && sortOrder === 'asc' ? 'active' : 'inactive'}`}
                          onClick={() => {
                            if (sortField === 'id') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('id');
                              setSortOrder('asc');
                            }
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`sort-icon ${sortField === 'id' && sortOrder === 'desc' ? 'active' : 'inactive'}`}
                          onClick={() => {
                            if (sortField === 'id') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('id');
                              setSortOrder('desc');
                            }
                          }}
                        />
                      </div>
                    </div>
                  </th>
                  <th style={{ width: '15%', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Name
                      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '5px', alignItems: 'center' }}>
                        <FontAwesomeIcon
                          icon={faChevronUp}
                          className={`sort-icon ${sortField === 'name' && sortOrder === 'asc' ? 'active' : 'inactive'}`}
                          onClick={() => {
                            if (sortField === 'name') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('name');
                              setSortOrder('asc');
                            }
                          }}
                        />
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`sort-icon ${sortField === 'name' && sortOrder === 'desc' ? 'active' : 'inactive'}`}
                          onClick={() => {
                            if (sortField === 'name') {
                              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField('name');
                              setSortOrder('desc');
                            }
                          }}
                        />
                      </div>
                    </div>
                  </th>
                  <th style={{ width: '15%', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      Severity
                      <FontAwesomeIcon
                        icon={faFilter}
                        className={`filter-icon ${isFiltered ? 'active' : ''}`}
                        onClick={isFiltered ? handleFilterReset : null} // Reset filter on click if active
                      />
                    </div>
                  </th>
                  <th style={{ width: '60%', textAlign: 'left' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {sortedAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td style={{ width: '10%' }}>
                      <Link to={`/alert/${alert.id}`} className="custom-tooltip">
                        {alert.id}
                        <span className="tooltip-text">Click for more info on this alert.</span>
                      </Link>
                    </td>
                    <td style={{ width: '15%' }}>{alert.name}</td>
                    <td style={{ width: '15%' }}>{alert.severity}</td>
                    <td style={{ width: '60%' }}>{alert.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-alerts">
            <p>No alerts found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
