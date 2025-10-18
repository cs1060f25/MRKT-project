import { Event, Bid, Ask } from "@/types/ticket";

export const mockEvents: Event[] = [
  {
    id: "1",
    name: "Summer Music Festival 2025",
    date: "2025-07-15",
    venue: "Central Park Amphitheater",
    totalTickets: 5000,
  },
  {
    id: "2",
    name: "Tech Conference 2025",
    date: "2025-09-22",
    venue: "Convention Center Downtown",
    totalTickets: 2000,
  },
  {
    id: "3",
    name: "Broadway Musical Night",
    date: "2025-11-10",
    venue: "Grand Theater",
    totalTickets: 1200,
  },
];

export const mockBids: Bid[] = [
  {
    id: "b1",
    eventId: "1",
    buyerName: "Sarah Johnson",
    quantity: 4,
    pricePerTicket: 125.00,
    totalPrice: 500.00,
    timestamp: "2025-10-15T14:32:00Z",
    status: "active",
  },
  {
    id: "b2",
    eventId: "1",
    buyerName: "Michael Chen",
    quantity: 2,
    pricePerTicket: 130.00,
    totalPrice: 260.00,
    timestamp: "2025-10-15T13:45:00Z",
    status: "active",
  },
  {
    id: "b3",
    eventId: "1",
    buyerName: "Emma Williams",
    quantity: 6,
    pricePerTicket: 120.00,
    totalPrice: 720.00,
    timestamp: "2025-10-15T12:15:00Z",
    status: "filled",
  },
  {
    id: "b4",
    eventId: "1",
    buyerName: "David Rodriguez",
    quantity: 3,
    pricePerTicket: 128.00,
    totalPrice: 384.00,
    timestamp: "2025-10-15T11:20:00Z",
    status: "active",
  },
  {
    id: "b5",
    eventId: "1",
    buyerName: "Lisa Anderson",
    quantity: 5,
    pricePerTicket: 122.00,
    totalPrice: 610.00,
    timestamp: "2025-10-15T10:05:00Z",
    status: "active",
  },
];

export const mockAsks: Ask[] = [
  {
    id: "a1",
    eventId: "1",
    sellerName: "James Wilson",
    quantity: 2,
    pricePerTicket: 135.00,
    totalPrice: 270.00,
    timestamp: "2025-10-15T14:28:00Z",
    status: "active",
  },
  {
    id: "a2",
    eventId: "1",
    sellerName: "Maria Garcia",
    quantity: 4,
    pricePerTicket: 138.00,
    totalPrice: 552.00,
    timestamp: "2025-10-15T13:50:00Z",
    status: "active",
  },
  {
    id: "a3",
    eventId: "1",
    sellerName: "Robert Brown",
    quantity: 3,
    pricePerTicket: 132.00,
    totalPrice: 396.00,
    timestamp: "2025-10-15T12:30:00Z",
    status: "filled",
  },
  {
    id: "a4",
    eventId: "1",
    sellerName: "Jennifer Taylor",
    quantity: 5,
    pricePerTicket: 140.00,
    totalPrice: 700.00,
    timestamp: "2025-10-15T11:45:00Z",
    status: "active",
  },
  {
    id: "a5",
    eventId: "1",
    sellerName: "Thomas Martinez",
    quantity: 2,
    pricePerTicket: 136.00,
    totalPrice: 272.00,
    timestamp: "2025-10-15T10:30:00Z",
    status: "active",
  },
];

export interface SalesVolumeData {
  eventId: string;
  date: string;
  volume: number;
}

export interface BidAskSpreadData {
  eventId: string;
  time: string;
  bid: number;
  ask: number;
}

export const salesVolumeData: SalesVolumeData[] = [
  { eventId: "1", date: "Oct 8", volume: 45 },
  { eventId: "1", date: "Oct 9", volume: 62 },
  { eventId: "1", date: "Oct 10", volume: 78 },
  { eventId: "1", date: "Oct 11", volume: 95 },
  { eventId: "1", date: "Oct 12", volume: 112 },
  { eventId: "1", date: "Oct 13", volume: 128 },
  { eventId: "1", date: "Oct 14", volume: 145 },
  { eventId: "1", date: "Oct 15", volume: 163 },
  { eventId: "1", date: "Oct 16", volume: 187 },
  { eventId: "1", date: "Oct 17", volume: 203 },
  { eventId: "2", date: "Oct 8", volume: 28 },
  { eventId: "2", date: "Oct 9", volume: 35 },
  { eventId: "2", date: "Oct 10", volume: 42 },
  { eventId: "2", date: "Oct 11", volume: 55 },
  { eventId: "2", date: "Oct 12", volume: 68 },
  { eventId: "2", date: "Oct 13", volume: 82 },
  { eventId: "2", date: "Oct 14", volume: 95 },
  { eventId: "2", date: "Oct 15", volume: 110 },
  { eventId: "2", date: "Oct 16", volume: 125 },
  { eventId: "2", date: "Oct 17", volume: 142 },
  { eventId: "3", date: "Oct 8", volume: 18 },
  { eventId: "3", date: "Oct 9", volume: 25 },
  { eventId: "3", date: "Oct 10", volume: 32 },
  { eventId: "3", date: "Oct 11", volume: 38 },
  { eventId: "3", date: "Oct 12", volume: 47 },
  { eventId: "3", date: "Oct 13", volume: 55 },
  { eventId: "3", date: "Oct 14", volume: 64 },
  { eventId: "3", date: "Oct 15", volume: 73 },
  { eventId: "3", date: "Oct 16", volume: 85 },
  { eventId: "3", date: "Oct 17", volume: 98 },
];

export const bidAskSpreadData: BidAskSpreadData[] = [
  { eventId: "1", time: "10:00", bid: 120, ask: 135 },
  { eventId: "1", time: "10:30", bid: 122, ask: 136 },
  { eventId: "1", time: "11:00", bid: 123, ask: 137 },
  { eventId: "1", time: "11:30", bid: 125, ask: 138 },
  { eventId: "1", time: "12:00", bid: 126, ask: 136 },
  { eventId: "1", time: "12:30", bid: 128, ask: 135 },
  { eventId: "1", time: "13:00", bid: 127, ask: 137 },
  { eventId: "1", time: "13:30", bid: 129, ask: 138 },
  { eventId: "1", time: "14:00", bid: 130, ask: 136 },
  { eventId: "1", time: "14:30", bid: 130, ask: 135 },
  { eventId: "2", time: "10:00", bid: 95, ask: 108 },
  { eventId: "2", time: "10:30", bid: 96, ask: 109 },
  { eventId: "2", time: "11:00", bid: 97, ask: 110 },
  { eventId: "2", time: "11:30", bid: 98, ask: 109 },
  { eventId: "2", time: "12:00", bid: 99, ask: 108 },
  { eventId: "2", time: "12:30", bid: 100, ask: 107 },
  { eventId: "2", time: "13:00", bid: 101, ask: 108 },
  { eventId: "2", time: "13:30", bid: 102, ask: 109 },
  { eventId: "2", time: "14:00", bid: 103, ask: 108 },
  { eventId: "2", time: "14:30", bid: 104, ask: 107 },
  { eventId: "3", time: "10:00", bid: 145, ask: 162 },
  { eventId: "3", time: "10:30", bid: 147, ask: 163 },
  { eventId: "3", time: "11:00", bid: 148, ask: 164 },
  { eventId: "3", time: "11:30", bid: 150, ask: 163 },
  { eventId: "3", time: "12:00", bid: 151, ask: 162 },
  { eventId: "3", time: "12:30", bid: 153, ask: 161 },
  { eventId: "3", time: "13:00", bid: 154, ask: 162 },
  { eventId: "3", time: "13:30", bid: 155, ask: 163 },
  { eventId: "3", time: "14:00", bid: 156, ask: 162 },
  { eventId: "3", time: "14:30", bid: 157, ask: 161 },
];
