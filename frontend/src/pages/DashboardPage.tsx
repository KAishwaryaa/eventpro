import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Bell, TrendingUp, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { Event, Booking, Notification } from '../types';
import EventCard from '../components/EventCard';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, accessToken } = useAuthStore();
  const [recommendations, setRecommendations] = useState<Event[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const wsUrl = accessToken && user
    ? `ws://localhost:8000/api/v1/ws/users/${user.id}/notifications?token=${accessToken}`
    : null;

  useWebSocket(wsUrl, {
    onMessage: (data) => {
      // New notification received
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.success(data.message, { icon: '🔔' });
    },
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [recsRes, bookingsRes, notifsRes] = await Promise.all([
        api.get('/recommendations'),
        api.get('/bookings', { params: { page: 1, page_size: 5 } }),
        api.get('/notifications', { params: { page: 1, page_size: 10 } }),
      ]);

      setRecommendations(recsRes.data.recommendations || []);
      setUpcomingBookings(bookingsRes.data.results || []);
      setNotifications(notifsRes.data.results || []);
      setUnreadCount(notifsRes.data.results.filter((n: Notification) => !n.is_read).length);
    } catch (error: any) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.full_name || user?.email}!
              </h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your events</p>
            </div>
            <div className="relative">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommended Events */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                </div>
                <Link to="/events" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  View All Events →
                </Link>
              </div>

              {recommendations.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">
                    No recommendations yet. Browse events to get personalized suggestions!
                  </p>
                  <Link
                    to="/events"
                    className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.slice(0, 6).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Bookings */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Ticket className="text-indigo-600" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                </div>
                <Link to="/bookings" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  View All Bookings →
                </Link>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">You don't have any upcoming bookings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings
                    .filter((b) => b.status === 'confirmed')
                    .map((booking) => (
                      <Link
                        key={booking.id}
                        to={`/bookings/${booking.id}`}
                        className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-gray-900">Booking #{booking.id.slice(0, 8)}</h3>
                            <p className="text-sm text-gray-600">
                              {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''} • $
                              {booking.price_paid.toFixed(2)}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Confirmed
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar - Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-4">No notifications yet</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        notification.is_read ? 'bg-gray-50' : 'bg-indigo-50 border-l-4 border-indigo-600'
                      }`}
                    >
                      <p className="text-sm text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notification.created_at), 'PPp')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
