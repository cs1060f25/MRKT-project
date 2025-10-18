export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  totalTickets: number;
}

export interface Bid {
  id: string;
  eventId: string;
  buyerName: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  timestamp: string;
  status: 'active' | 'filled' | 'cancelled';
}

export interface Ask {
  id: string;
  eventId: string;
  sellerName: string;
  quantity: number;
  pricePerTicket: number;
  totalPrice: number;
  timestamp: string;
  status: 'active' | 'filled' | 'cancelled';
}
