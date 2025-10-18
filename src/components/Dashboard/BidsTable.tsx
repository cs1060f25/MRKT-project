import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bid } from "@/types/ticket";

interface BidsTableProps {
  bids: Bid[];
}

export const BidsTable = ({ bids }: BidsTableProps) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: Bid['status']) => {
    const variants = {
      active: 'default',
      filled: 'secondary',
      cancelled: 'outline',
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Buyer</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price/Ticket</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Time</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.map((bid) => (
            <TableRow key={bid.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">{bid.buyerName}</TableCell>
              <TableCell className="text-right">{bid.quantity}</TableCell>
              <TableCell className="text-right font-semibold text-success">
                ${bid.pricePerTicket.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-bold">
                ${bid.totalPrice.toFixed(2)}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {formatTime(bid.timestamp)}
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(bid.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
