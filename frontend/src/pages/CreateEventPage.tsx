import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: 'Music',
    start_datetime: '',
    end_datetime: '',
    venue_name: '',
    venue_address: '',
    venue_city: '',
    image_url: '',
    status: 'draft',
    ticket_types: [
      { name: 'Standard', description: '', base_price: 0, current_price: 0, quantity: 100, seating_type: 'general_admission', dynamic_pricing_enabled: false }
    ]
  });

  const handleAddTicketType = () => {
    setEventData({
      ...eventData,
      ticket_types: [
        ...eventData.ticket_types,
        { name: '', description: '', base_price: 0, current_price: 0, quantity: 100, seating_type: 'general_admission', dynamic_pricing_enabled: false }
      ]
    });
  };

  const handleRemoveTicketType = (index: number) => {
    const newTicketTypes = [...eventData.ticket_types];
    newTicketTypes.splice(index, 1);
    setEventData({ ...eventData, ticket_types: newTicketTypes });
  };

  const handleTicketTypeChange = (index: number, field: string, value: any) => {
    const newTicketTypes = [...eventData.ticket_types];
    (newTicketTypes[index] as any)[field] = value;
    if (field === 'base_price') {
      newTicketTypes[index].current_price = value;
    }
    setEventData({ ...eventData, ticket_types: newTicketTypes });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/events', eventData);
      toast.success('Event created successfully!');
      navigate('/organizer');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to create event';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <button
            onClick={() => navigate('/organizer')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <X size={20} />
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  required
                  type="text"
                  value={eventData.title}
                  onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  placeholder="e.g. Summer Music Festival"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  placeholder="Tell people what your event is about..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={eventData.category}
                    onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Music</option>
                    <option>Technology</option>
                    <option>Food & Drink</option>
                    <option>Wellness</option>
                    <option>Sports</option>
                    <option>Arts</option>
                    <option>Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={eventData.image_url}
                    onChange={(e) => setEventData({ ...eventData, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date & Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Date & Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                <input
                  required
                  type="datetime-local"
                  value={eventData.start_datetime}
                  onChange={(e) => setEventData({ ...eventData, start_datetime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                <input
                  required
                  type="datetime-local"
                  value={eventData.end_datetime}
                  onChange={(e) => setEventData({ ...eventData, end_datetime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                <input
                  required
                  type="text"
                  value={eventData.venue_name}
                  onChange={(e) => setEventData({ ...eventData, venue_name: e.target.value })}
                  placeholder="e.g. Madison Square Garden"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  required
                  type="text"
                  value={eventData.venue_city}
                  onChange={(e) => setEventData({ ...eventData, venue_city: e.target.value })}
                  placeholder="e.g. New York"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  required
                  type="text"
                  value={eventData.venue_address}
                  onChange={(e) => setEventData({ ...eventData, venue_address: e.target.value })}
                  placeholder="e.g. 123 Event St"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ticket Types</h2>
              <button
                type="button"
                onClick={handleAddTicketType}
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                <Plus size={20} />
                Add Type
              </button>
            </div>

            <div className="space-y-6">
              {eventData.ticket_types.map((ticket, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg relative bg-gray-50">
                  {eventData.ticket_types.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTicketType(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Name</label>
                      <input
                        required
                        type="text"
                        value={ticket.name}
                        onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                        placeholder="e.g. Early Bird, VIP"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={ticket.base_price}
                        onChange={(e) => handleTicketTypeChange(index, 'base_price', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={ticket.quantity}
                        onChange={(e) => handleTicketTypeChange(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={24} />
                  Create Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
