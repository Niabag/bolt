import React from 'react';
import './StatusMessages.scss';

const StatusMessages = ({ messages }) => {
  if (!messages || messages.length === 0) return null;
  
  return (
    <div className="execution-status">
      {messages.map((status, index) => (
        <div key={index} className={`status-message ${status.status}`}>
          <span className="status-icon">
            {status.status === 'completed' ? '✅' : 
             status.status === 'executing' ? '⏳' : 
             status.status === 'form-shown' ? '📝' : 
             status.status === 'ready' ? '🔄' : 
             status.status === 'error' ? '❌' : '❓'}
          </span>
          <span className="status-text">{status.message}</span>
        </div>
      ))}
    </div>
  );
};

export default StatusMessages;