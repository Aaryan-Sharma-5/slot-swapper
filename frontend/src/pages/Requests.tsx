import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { swapAPI } from '../api/client';
import type { SwapRequest } from '../types/index.js';

const Requests: React.FC = () => {
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await swapAPI.getMySwapRequests();
      setIncomingRequests(data.incoming);
      setOutgoingRequests(data.outgoing);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to fetch swap requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: number, accept: boolean) => {
    try {
      await swapAPI.respondToSwapRequest(requestId, { accept });
      alert(accept ? 'Swap accepted! Your calendar has been updated.' : 'Swap rejected.');
      fetchRequests();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to respond to swap request');
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'PPp');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'ACCEPTED':
        return 'green';
      case 'REJECTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="requests">
      <h1>Swap Requests</h1>

      {error && <div className="error-message">{error}</div>}

      <section className="requests-section">
        <h2>Incoming Requests</h2>
        <p className="subtitle">Requests from other users who want to swap with you</p>
        
        {incomingRequests.length === 0 ? (
          <p className="empty-state">No incoming requests.</p>
        ) : (
          <div className="requests-list">
            {incomingRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <span className={`status-badge ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                  <span className="requester">from {request.requester?.name}</span>
                </div>
                
                <div className="swap-details">
                  <div className="slot-detail">
                    <h4>They offer:</h4>
                    <p><strong>{request.theirSlot.title}</strong></p>
                    <p className="time-range">
                      {formatDateTime(request.theirSlot.startTime)}
                      <br />
                      to {formatDateTime(request.theirSlot.endTime)}
                    </p>
                  </div>
                  
                  <div className="swap-arrow">↔</div>
                  
                  <div className="slot-detail">
                    <h4>For your:</h4>
                    <p><strong>{request.mySlot.title}</strong></p>
                    <p className="time-range">
                      {formatDateTime(request.mySlot.startTime)}
                      <br />
                      to {formatDateTime(request.mySlot.endTime)}
                    </p>
                  </div>
                </div>

                {request.status === 'PENDING' && (
                  <div className="request-actions">
                    <button
                      onClick={() => handleResponse(request.id, true)}
                      className="btn-success"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleResponse(request.id, false)}
                      className="btn-danger"
                    >
                      Reject
                    </button>
                  </div>
                )}
                
                <p className="request-date">
                  Requested on {format(new Date(request.createdAt), 'PPp')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="requests-section">
        <h2>Outgoing Requests</h2>
        <p className="subtitle">Your swap requests to other users</p>
        
        {outgoingRequests.length === 0 ? (
          <p className="empty-state">No outgoing requests.</p>
        ) : (
          <div className="requests-list">
            {outgoingRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <span className={`status-badge ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                  <span className="requester">to {request.receiver?.name}</span>
                </div>
                
                <div className="swap-details">
                  <div className="slot-detail">
                    <h4>You offer:</h4>
                    <p><strong>{request.mySlot.title}</strong></p>
                    <p className="time-range">
                      {formatDateTime(request.mySlot.startTime)}
                      <br />
                      to {formatDateTime(request.mySlot.endTime)}
                    </p>
                  </div>
                  
                  <div className="swap-arrow">↔</div>
                  
                  <div className="slot-detail">
                    <h4>For their:</h4>
                    <p><strong>{request.theirSlot.title}</strong></p>
                    <p className="time-range">
                      {formatDateTime(request.theirSlot.startTime)}
                      <br />
                      to {formatDateTime(request.theirSlot.endTime)}
                    </p>
                  </div>
                </div>

                {request.status === 'PENDING' && (
                  <p className="pending-note">Waiting for response...</p>
                )}
                
                <p className="request-date">
                  Requested on {format(new Date(request.createdAt), 'PPp')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Requests;
