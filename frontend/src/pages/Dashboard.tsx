import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { eventAPI } from '../api/client';
import type { Event } from '../types/index.js';

const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventAPI.getMyEvents();
      setEvents(data.events);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert datetime-local format to ISO 8601
      const startTimeISO = new Date(formData.startTime).toISOString();
      const endTimeISO = new Date(formData.endTime).toISOString();
      
      await eventAPI.createEvent({
        title: formData.title,
        startTime: startTimeISO,
        endTime: endTimeISO,
      });
      setFormData({ title: '', startTime: '', endTime: '' });
      setShowCreateForm(false);
      fetchEvents();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create event');
    }
  };

  const handleStatusChange = async (eventId: number, newStatus: 'BUSY' | 'SWAPPABLE') => {
    try {
      await eventAPI.updateEventStatus(eventId, { status: newStatus });
      fetchEvents();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await eventAPI.deleteEvent(eventId);
      fetchEvents();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete event');
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'PPp');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Calendar</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
          {showCreateForm ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="create-event-form">
          <h2>Create New Event</h2>
          <form onSubmit={handleCreateEvent}>
            <div className="form-group">
              <label htmlFor="title">Event Title</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="datetime-local"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">Create Event</button>
          </form>
        </div>
      )}

      <div className="events-list">
        <h2>Your Events</h2>
        {events.length === 0 ? (
          <p className="empty-state">No events yet. Create your first event!</p>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className={`event-card status-${event.status.toLowerCase()}`}>
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <span className={`status-badge ${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>
                <div className="event-time">
                  <p><strong>Start:</strong> {formatDateTime(event.startTime)}</p>
                  <p><strong>End:</strong> {formatDateTime(event.endTime)}</p>
                </div>
                <div className="event-actions">
                  {event.status === 'BUSY' && (
                    <button
                      onClick={() => handleStatusChange(event.id, 'SWAPPABLE')}
                      className="btn-secondary"
                    >
                      Make Swappable
                    </button>
                  )}
                  {event.status === 'SWAPPABLE' && (
                    <button
                      onClick={() => handleStatusChange(event.id, 'BUSY')}
                      className="btn-secondary"
                    >
                      Mark as Busy
                    </button>
                  )}
                  {event.status === 'SWAP_PENDING' && (
                    <p className="pending-note">Swap pending...</p>
                  )}
                  {event.status !== 'SWAP_PENDING' && (
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
