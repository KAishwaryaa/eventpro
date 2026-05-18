import sys
import os
import uuid
from datetime import datetime, timedelta

# Add the current directory to sys.path so 'app' can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.event import Event, TicketType, Seat
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # 1. Create a default Organizer
        organizer = db.query(User).filter(User.email == "organizer@example.com").first()
        if not organizer:
            print("Creating default organizer...")
            organizer = User(
                email="organizer@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="Event Pro Organizer",
                role="organizer",
                status="active"
            )
            db.add(organizer)
            db.commit()
            db.refresh(organizer)

        # 2. Define Event Generation Data
        categories = {
            "Music": ["https://images.unsplash.com/photo-1459749411177-042180ceea72", "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4", "https://images.unsplash.com/photo-1470225620780-dba8ba36b745"],
            "Technology": ["https://images.unsplash.com/photo-1485827404703-89b55fcc595e", "https://images.unsplash.com/photo-1504384308090-c894fdcc538d", "https://images.unsplash.com/photo-1518770660439-4636190af475"],
            "Food & Drink": ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1", "https://images.unsplash.com/photo-1504674900247-0877df9cc836", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd"],
            "Wellness": ["https://images.unsplash.com/photo-1506126613408-eca07ce68773", "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b", "https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539"],
            "Sports": ["https://images.unsplash.com/photo-1533560904424-a0c61dc306fc", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211", "https://images.unsplash.com/photo-1517649763962-0c6234278a0b"],
            "Arts": ["https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b", "https://images.unsplash.com/photo-1513364776144-60967b0f800f", "https://images.unsplash.com/photo-1492033204158-53bf2de441df"],
            "Business": ["https://images.unsplash.com/photo-1477281765962-ef34e8bb0967", "https://images.unsplash.com/photo-1515187029135-18ee286d815b", "https://images.unsplash.com/photo-1491336477066-31156b5e4f35"]
        }

        cities = ["New York", "San Francisco", "London", "Austin", "Berlin", "Tokyo", "Mumbai", "Paris"]
        venues = ["Central Park", "Grand Hall", "Innovation Lab", "Riverside Arena", "The Loft", "City Square", "Sky Garden"]
        
        adjectives = ["Global", "Epic", "Neon", "Creative", "Modern", "Classic", "Ultimate", "Zen", "The Great"]
        nouns = ["Summit", "Festival", "Expo", "Workshop", "Conference", "Showcase", "Fair", "Marathon", "Night"]

        now = datetime.utcnow()
        import random

        print("Generating 100 events...")
        for i in range(1, 101):
            category = random.choice(list(categories.keys()))
            title = f"{random.choice(adjectives)} {category} {random.choice(nouns)} {i}"
            
            # Check if event already exists
            existing = db.query(Event).filter(Event.title == title).first()
            if existing:
                continue

            event = Event(
                title=title,
                description=f"Join us for this amazing {category} event! Experience the best of {category} in {random.choice(cities)}. This event will be unforgettable.",
                category=category,
                start_datetime=now + timedelta(days=random.randint(5, 90)),
                end_datetime=now + timedelta(days=91),
                venue_name=random.choice(venues),
                venue_city=random.choice(cities),
                image_url=random.choice(categories[category]),
                status="published",
                organizer_id=organizer.id
            )
            db.add(event)
            db.flush()

            # Create ticket types for each event
            ticket_configs = [
                {"name": "Standard Admission", "price": random.randint(20, 100)},
                {"name": "VIP Experience", "price": random.randint(150, 500)}
            ]

            for t_cfg in ticket_configs:
                tt = TicketType(
                    event_id=event.id,
                    name=t_cfg["name"],
                    base_price=float(t_cfg["price"]),
                    current_price=float(t_cfg["price"]),
                    quantity=random.randint(50, 1000),
                    seating_type="general_admission"
                )
                db.add(tt)
                db.flush()

                if tt.seating_type == "assigned":
                    for row in ["A", "B", "C"]:
                        for num in range(1, 6):
                            seat = Seat(
                                ticket_type_id=tt.id,
                                row=row,
                                number=str(num),
                                status="available"
                            )
                            db.add(seat)
        
        db.commit()
        print("100 events generated successfully!")

        # 3. Create some Attendees
        print("Creating attendee users...")
        attendees = []
        for i in range(1, 4):
            email = f"user{i}@example.com"
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=get_password_hash("password123"),
                    full_name=f"Test Attendee {i}",
                    role="attendee",
                    status="active"
                )
                db.add(user)
            attendees.append(user)
        db.commit()

        # 4. Create some Bookings
        print("Creating sample bookings...")
        from app.models.booking import Booking
        
        # Get some events and ticket types
        all_events = db.query(Event).all()
        for i, attendee in enumerate(attendees):
            # Each attendee books one ticket for the first few events
            if i < len(all_events):
                event = all_events[i]
                ticket_type = event.ticket_types[0]
                
                # Check if already booked
                existing_booking = db.query(Booking).filter(
                    Booking.attendee_id == attendee.id,
                    Booking.event_id == event.id
                ).first()
                
                if not existing_booking:
                    booking = Booking(
                        attendee_id=attendee.id,
                        event_id=event.id,
                        ticket_type_id=ticket_type.id,
                        quantity=1,
                        price_paid=ticket_type.current_price,
                        status="confirmed",
                        payment_reference=f"PAY-{uuid.uuid4().hex[:8].upper()}"
                    )
                    db.add(booking)
                    ticket_type.sold_count += 1
        
        db.commit()
        print("Database seeded with events and sample bookings successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
