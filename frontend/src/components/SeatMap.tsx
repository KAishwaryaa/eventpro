import { useState, useEffect } from 'react';
import { Seat } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

interface SeatMapProps {
  eventId: string;
  onSeatsSelected: (seatIds: string[]) => void;
}

interface SeatWithTimer extends Seat {
  lockExpiresAt?: number;
}

export default function SeatMap({ eventId, onSeatsSelected }: SeatMapProps) {
  const { accessToken, user } = useAuthStore();
  const [seats, setSeats] = useState<SeatWithTimer[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const wsUrl = accessToken
    ? `ws://localhost:8000/api/v1/ws/events/${eventId}/seats?token=${accessToken}`
    : null;

  const { isConnected } = useWebSocket(wsUrl, {
    onMessage: (data) => {
      if (data.type === 'initial_state') {
        setSeats(data.seats);
        setLoading(false);
      } else if (data.type === 'seat_update') {
        setSeats((prev) =>
          prev.map((seat) =>
            seat.id === data.seat_id
              ? { ...seat, status: data.status, lock_holder: data.lock_holder }
              : seat
          )
        );
      }
    },
    onOpen: () => {
      console.log('WebSocket connected');
    },
    onClose: () => {
      console.log('WebSocket disconnected');
    },
  });

  useEffect(() => {
    onSeatsSelected(Array.from(selectedSeats));
  }, [selectedSeats, onSeatsSelected]);

  // Countdown timer for locked seats
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSeats((prev) =>
        prev.map((seat) => {
          if (seat.lockExpiresAt && seat.lockExpiresAt <= now && selectedSeats.has(seat.id)) {
            // Lock expired, remove from selection
            setSelectedSeats((s) => {
              const newSet = new Set(s);
              newSet.delete(seat.id);
              return newSet;
            });
            toast.error(`Seat ${seat.row}${seat.number} lock expired`);
            return { ...seat, status: 'available', lockExpiresAt: undefined };
          }
          return seat;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedSeats]);

  const handleSeatClick = async (seat: Seat) => {
    if (seat.status === 'booked') {
      toast.error('This seat is already booked');
      return;
    }

    if (seat.status === 'locked' && seat.lock_holder !== `${user?.id}:${seat.id}`) {
      toast.error('This seat is currently locked by another user');
      return;
    }

    // Toggle selection
    if (selectedSeats.has(seat.id)) {
      // Release lock
      try {
        await api.delete(`/seats/${seat.id}/lock`);
        setSelectedSeats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(seat.id);
          return newSet;
        });
      } catch (error: any) {
        toast.error('Failed to release seat');
      }
    } else {
      // Acquire lock
      try {
        await api.post(`/seats/${seat.id}/lock`);
        setSelectedSeats((prev) => new Set(prev).add(seat.id));
        setSeats((prev) =>
          prev.map((s) =>
            s.id === seat.id
              ? { ...s, status: 'locked', lockExpiresAt: Date.now() + 600000 } // 10 minutes
              : s
          )
        );
        toast.success(`Seat ${seat.row}${seat.number} locked for 10 minutes`);
      } catch (error: any) {
        const message = error.response?.data?.error?.message || 'Failed to lock seat';
        toast.error(message);
      }
    }
  };

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.has(seat.id)) return 'bg-blue-500 hover:bg-blue-600';
    if (seat.status === 'booked') return 'bg-red-500 cursor-not-allowed';
    if (seat.status === 'locked') return 'bg-yellow-500 cursor-not-allowed';
    return 'bg-green-500 hover:bg-green-600';
  };

  const getRemainingTime = (seat: SeatWithTimer) => {
    if (!seat.lockExpiresAt || !selectedSeats.has(seat.id)) return null;
    const remaining = Math.max(0, Math.floor((seat.lockExpiresAt - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, SeatWithTimer[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Select Your Seats</h2>
          <div className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '● Live' : '● Disconnected'}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Locked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>

      {/* Stage */}
      <div className="mb-8 text-center">
        <div className="inline-block bg-gray-800 text-white px-8 py-2 rounded-t-lg">STAGE</div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-4 overflow-x-auto">
        {Object.entries(seatsByRow)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-2">
              <div className="w-8 text-center font-semibold text-gray-700">{row}</div>
              <div className="flex gap-2 flex-wrap">
                {rowSeats
                  .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                  .map((seat) => {
                    const remainingTime = getRemainingTime(seat);
                    return (
                      <div key={seat.id} className="relative">
                        <button
                          onClick={() => handleSeatClick(seat)}
                          disabled={
                            seat.status === 'booked' ||
                            (seat.status === 'locked' && seat.lock_holder !== `${user?.id}:${seat.id}`)
                          }
                          className={`w-10 h-10 rounded ${getSeatColor(
                            seat
                          )} text-white text-xs font-semibold transition-colors disabled:cursor-not-allowed`}
                          title={`Row ${seat.row}, Seat ${seat.number}`}
                        >
                          {seat.number}
                        </button>
                        {remainingTime && (
                          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                            {remainingTime}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
      </div>

      {selectedSeats.size > 0 && (
        <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            Selected Seats: {Array.from(selectedSeats).length}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Seats are locked for 10 minutes. Complete your booking before the timer expires.
          </p>
        </div>
      )}
    </div>
  );
}
