import { Event } from "@/components/EventCard";

const eventNames = [
  "HBS Healthcare Conference 2025",
  "Private Equity Forum",
  "Entrepreneurship Summit",
  "Global Business Leaders Dinner",
  "Tech Venture Capital Symposium",
  "Marketing Strategy Workshop",
  "Finance & Investment Gala",
  "Social Impact Leadership Forum",
  "Alumni Networking Night",
  "Real Estate Investment Conference",
  "Startup Pitch Competition",
  "Executive Leadership Retreat",
];

const locations = [
  "Spangler Auditorium",
  "Klarman Hall",
  "Baker Library",
  "Shad Hall",
  "Aldrich Hall",
  "Burden Auditorium",
];

const generateRandomDate = () => {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 6);
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const generateRandomPrice = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const imageUrls = [
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80",
  "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80",
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80",
];

export const generateMockEvents = (): Event[] => {
  return eventNames.map((name, index) => {
    const startingPrice = generateRandomPrice(17, 86);
    const currentPrice = generateRandomPrice(17, startingPrice);
    const ticketsAvailable = generateRandomPrice(5, 50);
    const totalBids = generateRandomPrice(0, 30);

    return {
      id: `event-${index + 1}`,
      name,
      date: generateRandomDate(),
      location: locations[Math.floor(Math.random() * locations.length)],
      ticketsAvailable,
      currentPrice,
      startingPrice,
      totalBids,
      imageUrl: imageUrls[Math.floor(Math.random() * imageUrls.length)],
    };
  });
};
