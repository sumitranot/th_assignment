import React from 'react';

export const SubmitterDashboard = () => {
  return (
    <div id="submitter-dashboard">
      <div className="page-header">
        <h1>Submit Document</h1>
        <p>Submit documents for review and track your pending and historical requests.</p>
      </div>
      <div className="dashboard-grid submitter-grid">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">New Submission</h2>
          </div>
          <p>Submission form will load here.</p>
        </div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">My Submissions</h2>
          </div>
          <p>Documents list will load here.</p>
        </div>
      </div>
    </div>
  );
};

export default SubmitterDashboard;
