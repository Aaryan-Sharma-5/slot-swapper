import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { swapAPI, eventAPI } from '../api/client';
import type { SwappableSlot, Event } from '../types/index.js';

const Marketplace: React.FC = () => {
  const [slots, setSlots] = useState<SwappableSlot[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SwappableSlot | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotsData, eventsData] = await Promise.all([
        swapAPI.getSwappableSlots(),
        eventAPI.getMyEvents(),
      ]);
      setSlots(slotsData.slots);
      setMySwappableSlots(eventsData.events.filter((e) => e.status === 'SWAPPABLE'));
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = (slot: SwappableSlot) => {
    if (mySwappableSlots.length === 0) {
      alert('You need to have at least one swappable slot to request a swap!');
      return;
    }
    setSelectedSlot(slot);
    setShowModal(true);
  };

  const handleConfirmSwap = async (mySlotId: number) => {
    if (!selectedSlot) return;

    try {
      await swapAPI.createSwapRequest({
        mySlotId,
        theirSlotId: selectedSlot.id,
      });
      alert('Swap request sent successfully!');
      setShowModal(false);
      setSelectedSlot(null);
      fetchData();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to send swap request');
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'PPp');
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="marketplace">
      <h1>Marketplace</h1>
      <p className="subtitle">Browse and request swaps for available time slots</p>

      {error && <div className="error-message">{error}</div>}

      {slots.length === 0 ? (
        <p className="empty-state">No swappable slots available at the moment.</p>
      ) : (
        <div className="slots-grid">
          {slots.map((slot) => (
            <div key={slot.id} className="slot-card">
              <div className="slot-header">
                <h3>{slot.title}</h3>
                <span className="user-badge">by {slot.userName}</span>
              </div>
              <div className="slot-time">
                <p><strong>Start:</strong> {formatDateTime(slot.startTime)}</p>
                <p><strong>End:</strong> {formatDateTime(slot.endTime)}</p>
              </div>
              <button
                onClick={() => handleRequestSwap(slot)}
                className="btn-primary"
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedSlot && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Request Swap</h2>
            <div className="swap-preview">
              <div className="slot-preview">
                <h3>Their Slot:</h3>
                <p><strong>{selectedSlot.title}</strong></p>
                <p>{formatDateTime(selectedSlot.startTime)} - {formatDateTime(selectedSlot.endTime)}</p>
              </div>
              <div className="arrow">↔</div>
              <div className="slot-preview">
                <h3>Choose Your Slot:</h3>
                {mySwappableSlots.length === 0 ? (
                  <p className="error-message">You have no swappable slots!</p>
                ) : (
                  <div className="my-slots-list">
                    {mySwappableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleConfirmSwap(slot.id)}
                        className="slot-option"
                      >
                        <strong>{slot.title}</strong>
                        <span>{formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
