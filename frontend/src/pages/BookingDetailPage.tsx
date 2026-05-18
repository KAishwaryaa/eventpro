import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, Download, X, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import api from '../services/api';
import { Booking } from '../types';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
  checked_in: 'bg-blue-100 text-blue-800',
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${id}`);
      setBooking(response.data);
    } catch (error: any) {
      toast.error('Failed to load booking');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { accessToken } = useAuthStore();

  const handleDownloadICS = () => {
    window.open(`${api.defaults.baseURL}/bookings/${id}/calendar.ics?token=${accessToken}`, '_blank');
  };

  const handleAddToGoogleCalendar = () => {
    window.open(`${api.defaults.baseURL}/bookings/${id}/calendar/google?token=${accessToken}`, '_blank');
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    setCancelling(true);
    try {
      await api.delete(`/bookings/${id}`);
      toast.success('Booking cancelled successfully');
      fetchBooking(); // Refresh booking data
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to cancel booking';
      toast.error(message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Booking not found</h1>
          <button
            onClick={() => navigate('/bookings')}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const canCancel = booking.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[booking.status]}`}>
              {booking.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-mono text-gray-900">{booking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-semibold text-gray-900">{booking.quantity} tickets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Paid</span>
                  <span className="font-semibold text-gray-900">
                    ${booking.price_paid.toFixed(2)} {booking.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booked On</span>
                  <span className="text-gray-900">{format(new Date(booking.created_at), 'PPP p')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Reference</span>
                  <span className="font-mono text-sm text-gray-900">{booking.payment_reference}</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {booking.status === 'confirmed' && booking.qr_code_data && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Entry QR Code</h2>
                <div className="flex flex-col items-center">
                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <img
                      src={`${api.defaults.baseURL}/bookings/${booking.id}/qr-code`}
                      alt="QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Show this QR code at the event entrance for check-in
                  </p>
                </div>
              </div>
            )}

            {/* Calendar Integration */}
            {booking.status === 'confirmed' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add to Calendar</h2>
                <div className="flex gap-4">
                  <button
                    onClick={handleDownloadICS}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Download .ics
                  </button>
                  <button
                    onClick={handleAddToGoogleCalendar}
                    className="flex-1 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Calendar size={20} />
                    Google Calendar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {canCancel && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X size={20} />
                      Cancel Booking
                    </>
                  )}
                </button>
                <p className="mt-3 text-xs text-gray-600">
                  Free cancellation up to 24 hours before the event. Full refund will be processed.
                </p>
              </div>
            )}

            <div className="bg-indigo-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions about your booking, please contact our support team.
              </p>
              <a
                href="mailto:support@example.com"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                support@example.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
