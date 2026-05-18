import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function BookingCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle size={64} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Cancelled</h1>

        <p className="text-gray-600 mb-6">
          Your booking was not completed. No charges have been made to your account.
        </p>

        <div className="space-y-3">
          <Link
            to="/events"
            className="block w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse Events
          </Link>

          <Link
            to="/"
            className="block w-full py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
