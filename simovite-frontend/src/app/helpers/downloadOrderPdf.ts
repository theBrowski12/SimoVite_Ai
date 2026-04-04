import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '@models/order.model';

export function downloadOrderPdf(order: Order): void {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('SimoVite — Order Invoice', 14, 22);
  doc.setFontSize(11);
  doc.text(`Order Ref: ${order.orderRef}`, 14, 35);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 42);
  doc.text(`Client: ${order.fullName}`, 14, 49);

  autoTable(doc, {
    startY: 60,
    head: [['Product', 'Qty', 'Unit Price', 'Total']],
    body: order.items.map(i => [
      i.productName, i.quantity, `${i.unitPrice} DH`, `${i.subTotal} DH`
    ]),
    foot: [['', '', 'Delivery', `${order.deliveryCost} DH`],
           ['', '', 'TOTAL',    `${order.price} DH`]]
  });

  doc.save(`SimoVite_${order.orderRef}.pdf`);
}