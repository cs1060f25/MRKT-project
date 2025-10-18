import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ask } from "@/types/ticket";

interface AsksTableProps {
  asks: Ask[];
}

export const AsksTable = ({ asks }: AsksTableProps) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: Ask['status']) => {
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
            <TableHead>Seller</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Price/Ticket</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Time</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {asks.map((ask) => (
            <TableRow key={ask.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">{ask.sellerName}</TableCell>
              <TableCell className="text-right">{ask.quantity}</TableCell>
              <TableCell className="text-right font-semibold text-destructive">
                ${ask.pricePerTicket.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-bold">
                ${ask.totalPrice.toFixed(2)}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                {formatTime(ask.timestamp)}
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(ask.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
