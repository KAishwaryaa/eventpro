import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Clock, DollarSign, Users } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import { Event, TicketType } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketType, setSelectedTicketType] = useState<string | null>(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
      if (response.data.ticket_types.length > 0) {
        setSelectedTicketType(response.data.ticket_types[0].id);
      }
    } catch (error: any) {
      toast.error('Failed to load event');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }

    if (!selectedTicketType) {
      toast.error('Please select a ticket type');
      return;
    }

    // Navigate to checkout or seat selection based on seating type
    const ticketType = event?.ticket_types.find((tt) => tt.id === selectedTicketType);
    if (ticketType?.seating_type === 'assigned') {
      navigate(`/events/${id}/seats?ticket_type=${selectedTicketType}`);
    } else {
      navigate(`/checkout?event=${id}&ticket_type=${selectedTicketType}`);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to join waitlist');
      navigate('/login');
      return;
    }

    try {
      await api.post(`/events/${id}/waitlist`);
      toast.success('Successfully joined waitlist!');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to join waitlist';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Event not found</h1>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const selectedTicket = event.ticket_types.find((tt) => tt.id === selectedTicketType);
  const isFullyBooked = selectedTicket ? selectedTicket.sold_count >= selectedTicket.quantity : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gray-900">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-70" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={96} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full mb-4">
              {event.category}
            </span>
            <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Date & Location */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Date & Location</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="mr-3 mt-1 text-indigo-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(event.start_datetime), 'PPPP')}
                    </p>
                    <p className="text-gray-600">
                      {format(new Date(event.start_datetime), 'p')} -{' '}
                      {format(new Date(event.end_datetime), 'p')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="mr-3 mt-1 text-indigo-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">{event.venue_name}</p>
                    <p className="text-gray-600">{event.venue_address}</p>
                    <p className="text-gray-600">{event.venue_city}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Tickets</h2>

              <div className="space-y-3 mb-6">
                {event.ticket_types.map((ticketType) => {
                  const availability = ticketType.quantity - ticketType.sold_count;
                  const availabilityPercent = (availability / ticketType.quantity) * 100;

                  return (
                    <div
                      key={ticketType.id}
                      onClick={() => setSelectedTicketType(ticketType.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTicketType === ticketType.id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{ticketType.name}</h3>
                          {ticketType.description && (
                            <p className="text-sm text-gray-600">{ticketType.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ${ticketType.current_price.toFixed(2)}
                          </p>
                          {ticketType.dynamic_pricing_enabled &&
                            ticketType.current_price !== ticketType.base_price && (
                              <p className="text-xs text-gray-500 line-through">
                                ${ticketType.base_price.toFixed(2)}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          <Users size={14} className="inline mr-1" />
                          {availability} / {ticketType.quantity} available
                        </span>
                        {ticketType.dynamic_pricing_enabled && (
                          <span className="text-orange-600 font-medium text-xs">Dynamic Pricing</span>
                        )}
                      </div>

                      {/* Availability bar */}
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            availabilityPercent > 50
                              ? 'bg-green-500'
                              : availabilityPercent > 20
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${availabilityPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isFullyBooked ? (
                <button
                  onClick={handleJoinWaitlist}
                  className="w-full py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                >
                  Join Waitlist
                </button>
              ) : (
                <button
                  onClick={handleBookNow}
                  disabled={!selectedTicketType}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Book Now
                </button>
              )}

              <p className="mt-4 text-xs text-gray-500 text-center">
                Free cancellation up to 24 hours before the event
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
