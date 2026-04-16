import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, OrderStatus } from '@models/order.model';

export function downloadOrderPdf(order: Order): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ── Colors ──────────────────────────────────────────────
  const primary: [number, number, number]   = [255, 107, 53];    // #FF6B35
  const dark: [number, number, number]      = [17, 24, 39];      // #111827
  const gray: [number, number, number]      = [107, 114, 128];   // #6B7280
  const lightGray: [number, number, number] = [243, 244, 246];   // #F3F4F6
  const white: [number, number, number]     = [255, 255, 255];

  // ── Header Background ───────────────────────────────────
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 52, 'F');

  // ── Branding ────────────────────────────────────────────
  doc.setTextColor(...white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SimoVite', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ORDER INVOICE', 14, 32);

  // ── Order Ref Top-Right ─────────────────────────────────
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(order.orderRef, pageWidth - 14, 22, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 30, { align: 'right' });

  // ── Status Badge ────────────────────────────────────────
  const statusColors: Record<OrderStatus, [number, number, number]> = {
    PENDING: [245, 158, 11],
    ACCEPTED: [59, 130, 246],
    REJECTED: [239, 68, 68],
    COMPLETED: [22, 163, 74],
    CANCELLED: [107, 114, 128]
  };
  const sc = statusColors[order.status] || gray;
  doc.setFillColor(...sc);
  doc.roundedRect(pageWidth - 62, 38, 48, 8, 4, 4, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(order.status, pageWidth - 38, 43.5, { align: 'center' });

  // ── Divider Line ────────────────────────────────────────
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(14, 56, pageWidth - 14, 56);

  // ── Info Section ────────────────────────────────────────
  let y = 66;

  doc.setTextColor(...gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER INFORMATION', 14, y);
  y += 8;

  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.fullName}`, 14, y);
  y += 7;
  doc.text(`Email: ${order.email}`, 14, y);
  y += 10;

  doc.setTextColor(...gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT & DELIVERY', 14, y);
  y += 8;

  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const payLabel = order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : 'Online Payment';
  doc.text(`Payment: ${payLabel}`, 14, y);
  y += 7;

  if (order.deliveryAddress) {
    const addr = order.deliveryAddress;
    doc.text(`Delivery Address:`, 14, y);
    y += 7;
    if (addr.street)    { doc.text(`  Street: ${addr.street}`, 14, y); y += 7; }
    if (addr.buildingNumber) { doc.text(`  Building: ${addr.buildingNumber}`, 14, y); y += 7; }
    if (addr.city)      { doc.text(`  City: ${addr.city}`, 14, y); y += 7; }
  }

  y += 4;

  // ── Items Table ─────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['#', 'Product', 'Qty', 'Unit Price', 'Subtotal']],
    body: (order.items || []).map((i, idx) => [
      idx + 1,
      i.productName,
      i.quantity,
      `${i.unitPrice.toFixed(2)} DH`,
      `${i.subTotal.toFixed(2)} DH`
    ]),
    foot: [[
      '', '', '',
      'Delivery',
      `${order.deliveryCost.toFixed(2)} DH`
    ], [
      '', '', '',
      'TOTAL',
      `${order.price.toFixed(2)} DH`
    ]],
    styles: {
      fontSize: 9,
      cellPadding: 5,
      lineColor: lightGray,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: primary,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 9,
    },
    footStyles: {
      fillColor: lightGray,
      textColor: dark,
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    didParseCell: function(data) {
      if (data.section === 'foot' && data.row.index === 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = primary;
      }
    }
  });

  // ── Footer ──────────────────────────────────────────────
  const footerY = pageHeight - 25;
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your order! - SimoVite', pageWidth / 2, footerY + 8, { align: 'center' });

  // ── Save ────────────────────────────────────────────────
  doc.save(`SimoVite_${order.orderRef}.pdf`);
}