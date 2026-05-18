import { Link } from 'react-router-dom';
import { Event } from '../types';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const minPrice = Math.min(...event.ticket_types.map((tt) => tt.current_price));
  const maxPrice = Math.max(...event.ticket_types.map((tt) => tt.current_price));
  const baseMinPrice = Math.min(...event.ticket_types.map((tt) => tt.base_price));

  const priceDisplay =
    minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  const hasDynamicPricing = event.ticket_types.some((tt) => tt.dynamic_pricing_enabled);

  return (
    <Link
      to={`/events/${event.id}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative h-48 bg-gray-200">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Calendar size={48} />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {event.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar size={16} className="mr-2 flex-shrink-0" />
            <span>{format(new Date(event.start_datetime), 'PPP p')}</span>
          </div>

          <div className="flex items-center">
            <MapPin size={16} className="mr-2 flex-shrink-0" />
            <span className="line-clamp-1">
              {event.venue_name}, {event.venue_city}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center">
              <DollarSign size={16} className="mr-1 flex-shrink-0" />
              <span className="font-semibold text-gray-900">{priceDisplay}</span>
            </div>
            {hasDynamicPricing && minPrice !== baseMinPrice && (
              <span className="text-xs text-orange-600 font-medium">Dynamic Pricing</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
