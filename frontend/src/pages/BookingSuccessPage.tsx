import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    // Optionally trigger confetti or celebration animation
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={64} className="text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>

        <p className="text-gray-600 mb-6">
          Your booking has been successfully confirmed. You will receive a confirmation email shortly.
        </p>

        {bookingId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Booking ID</p>
            <p className="font-mono text-lg font-semibold text-gray-900">{bookingId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            to={bookingId ? `/bookings/${bookingId}` : '/bookings'}
            className="block w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            View Booking Details
          </Link>

          <Link
            to="/events"
            className="block w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Browse More Events
          </Link>
        </div>
      </div>
    </div>
  );
}
