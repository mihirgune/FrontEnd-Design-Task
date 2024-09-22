import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AlertPage.css';
import NetworkPage from './NetworkPage';

const AlertPage = () => {
    const { alertId } = useParams();
    const navigate = useNavigate();
    const [alertData, setAlertData] = useState(null);
    const [showNetworkPage, setShowNetworkPage] = useState(false);
    const networkPageRef = useRef(null); // Reference to SecondPage

    const handleToggleSecondPage = () => {
        setShowNetworkPage(!showNetworkPage); // Toggle between showing and hiding SecondPage

        // If showing the second page, scroll to it
        if (!showNetworkPage && networkPageRef.current) {
            networkPageRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/alert/${alertId}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then((data) => setAlertData(data))
            .catch((error) =>
                console.error('There was a problem with the fetch operation:', error)
            );
    }, [alertId]);

    if (!alertData) return <div className="loading">Loading...</div>;

    const getSeverityColor = (severity) => {
        switch (severity.toLowerCase()) {
            case 'low':
                return '#FFC000';
            case 'medium':
                return '#F08000';
            case 'high':
                return 'orangered';
            case 'critical':
                return 'red';
        }
    };


    return (
        <div className="alert-page">
            <div className="content-container">
                <div className="alert-details-panel">
                    <h2 className="panel-title">Alert Details</h2>
                    <div className="details-row">
                        <span className="label">ID:</span>
                        <span className="value">{alertData.id}</span>
                    </div>
                    <div className="details-row">
                        <span className="label">Name:</span>
                        <span className="value">{alertData.name}</span>
                    </div>
                    <div className="details-row">
                        <span className="label">Severity:</span>
                        <span className="value">
                            <div className="colored-rectangle" style={{backgroundColor: getSeverityColor(alertData.severity)}}>
                                {alertData.severity}
                            </div>
                        </span>
                    </div>
                    <div className="details-row">
                        <span className="label">Description:</span>
                        <span className="value">{alertData.description}</span>
                    </div>
                    <div className="details-row">
                        <span className="label">Machine:</span>
                        <span className="value">{alertData.machine}</span>
                    </div>
                    <div className="details-row">
                        <span className="label">Occurred On:</span>
                        <span className="value">{alertData.occurred_on}</span>
                    </div>
                    <div className="details-row">
                        <span className="label">Program:</span>
                        <span className="value">{alertData.program}</span>
                    </div>
                </div>
            </div>
            <div>
                <button className="view-graph-button" onClick={handleToggleSecondPage}>
                    {showNetworkPage ? 'Hide Graph' : 'View Graph'}
                </button>
            </div>

            {/* Rendering Graph Below The Alert Details Page */}
            {showNetworkPage && (
                <div ref={networkPageRef}>
                    <NetworkPage alertId={alertId} />
                </div>
            )}
        </div>
    );
};

export default AlertPage;
