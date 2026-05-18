import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Event, TicketType } from '../types';
import { format } from 'date-fns';
import { Calendar, MapPin, Ticket, CreditCard } from 'lucide-react';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketType, setTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [seatIds, setSeatIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const eventId = searchParams.get('event');
  const ticketTypeId = searchParams.get('ticket_type');
  const seatsParam = searchParams.get('seats');

  useEffect(() => {
    if (seatsParam) {
      setSeatIds(seatsParam.split(','));
    }
    fetchEventDetails();
  }, [eventId, ticketTypeId]);

  const fetchEventDetails = async () => {
    if (!eventId || !ticketTypeId) {
      toast.error('Invalid checkout parameters');
      navigate('/events');
      return;
    }

    try {
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
      const tt = response.data.ticket_types.find((t: TicketType) => t.id === ticketTypeId);
      if (tt) {
        setTicketType(tt);
        if (seatsParam) {
          setQuantity(seatsParam.split(',').length);
        }
      } else {
        toast.error('Ticket type not found');
        navigate('/events');
      }
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!event || !ticketType) return;

    setProcessing(true);
    try {
      const payload: any = {
        event_id: event.id,
        ticket_type_id: ticketType.id,
        quantity,
        currency: 'USD',
        payment_method: paymentMethod,
      };

      if (seatIds.length > 0) {
        payload.seat_ids = seatIds;
      }

      const response = await api.post('/bookings', payload);
      const { checkout_url } = response.data;

      // Redirect to Stripe checkout
      window.location.href = checkout_url;
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to create booking';
      toast.error(message);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event || !ticketType) {
    return null;
  }

  const totalAmount = ticketType.current_price * quantity;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.category}</p>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  {format(new Date(event.start_datetime), 'PPP p')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  {event.venue_name}, {event.venue_city}
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ticket Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticket Type</span>
                  <span className="font-semibold text-gray-900">{ticketType.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-semibold text-gray-900">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per Ticket</span>
                  <span className="font-semibold text-gray-900">${ticketType.current_price.toFixed(2)}</span>
                </div>
                {seatIds.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Selected Seats</span>
                    <span className="font-semibold text-gray-900">{seatIds.length} seats</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attendee Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Attendee Information</h2>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Name:</span> {user?.full_name || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service Fee</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900 mb-6">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Select Payment Method</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'upi', label: 'UPI', icon: '📱' },
                    { id: 'card', label: 'Card', icon: '💳' },
                    { id: 'netbanking', label: 'Netbanking', icon: '🏦' },
                    { id: 'qr', label: 'QR Code', icon: '📷' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === method.id 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xl">{method.icon}</span>
                      <span className="font-semibold text-sm">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={processing}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Proceed to Payment
                  </>
                )}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                You will be redirected to our secure payment processor
              </p>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-600">
                  <strong>Cancellation Policy:</strong> Free cancellation up to 24 hours before the event
                  starts. No refunds after that.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
