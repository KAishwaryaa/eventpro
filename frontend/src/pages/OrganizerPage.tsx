import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, BarChart3, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import { Event } from '../types';
import toast from 'react-hot-toast';

export default function OrganizerPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'checkin' | 'analytics'>('events');

  useEffect(() => {
    if (activeTab === 'events') {
      fetchMyEvents();
    }
  }, [activeTab]);

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      // This would need a backend endpoint to filter by organizer
      const response = await api.get('/events', { params: { page: 1, page_size: 50 } });
      setEvents(response.data.results);
    } catch (error: any) {
      toast.error('Failed to load events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishEvent = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/publish`);
      toast.success('Event published successfully!');
      fetchMyEvents();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to publish event';
      toast.error(message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchMyEvents();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to delete event';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Organizer Panel</h1>
            <Link
              to="/organizer/create-event"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium gap-2"
            >
              <Plus size={20} />
              Create Event
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'events'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Events
              </button>
              <button
                onClick={() => setActiveTab('checkin')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'checkin'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Check-In
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'analytics'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No events yet</h2>
                <p className="text-gray-600 mb-6">Create your first event to get started!</p>
                <Link
                  to="/organizer/create-event"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium gap-2"
                >
                  <Plus size={20} />
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              event.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {event.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{event.description.slice(0, 150)}...</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>{format(new Date(event.start_datetime), 'PPP')}</span>
                          <span>•</span>
                          <span>{event.venue_city}</span>
                          <span>•</span>
                          <span>{event.category}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Link
                          to={`/events/${event.id}`}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye size={20} />
                        </Link>
                        <button
                          onClick={() => {}}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit size={20} />
                        </button>
                        {event.status === 'draft' && (
                          <button
                            onClick={() => handlePublishEvent(event.id)}
                            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                          >
                            Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Check-In Tab */}
        {activeTab === 'checkin' && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="max-w-2xl mx-auto text-center">
              <QrCode size={64} className="mx-auto text-indigo-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">QR Code Check-In</h2>
              <p className="text-gray-600 mb-6">
                Scan attendee QR codes to check them in to your events
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter QR Code Data
                </label>
                <input
                  type="text"
                  placeholder="Paste QR code data here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
                  Check In
                </button>
              </div>

              <p className="text-sm text-gray-500">
                Or use a QR code scanner app to scan attendee tickets
              </p>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <BarChart3 size={64} className="mx-auto text-indigo-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Analytics</h2>
            <p className="text-gray-600 mb-6">
              View detailed analytics for your events
            </p>
            <Link
              to="/analytics"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              View Analytics Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
