import React from 'react';

export const ReviewerDashboard = () => {
  return (
    <div id="reviewer-dashboard">
      <div className="page-header">
        <h1>Document Review Queue</h1>
        <p>Review submitted documents, inspect attached files, and record decisions.</p>
      </div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Submitted Documents</h2>
        </div>
        <p>Review queue table will load here.</p>
      </div>
    </div>
  );
};

export default ReviewerDashboard;
