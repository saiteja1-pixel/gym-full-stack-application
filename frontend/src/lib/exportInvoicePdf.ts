import jsPDF from "jspdf";
import "jspdf-autotable";

export const exportInvoicePdf = (payment: any, member: any) => {
  const doc = new jsPDF();

  // Draw Dark Obsidian Header Banner
  doc.setFillColor(9, 9, 11); // rgb(9, 9, 11) - Obsidian dark base
  doc.rect(0, 0, 210, 50, "F");

  // Title branding in neon cyan color
  doc.setTextColor(34, 211, 238); // Cyan
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CORE FIT CLUB", 14, 25);
  doc.setFontSize(10);
  doc.text("PREMIUM FITNESS TERMINAL", 14, 32);

  // Invoice Meta on the right side of dark header
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`INVOICE: ${payment.invoiceNumber}`, 145, 22);
  doc.text(
    `DATE: ${new Date(payment.paymentDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`,
    145,
    29
  );
  doc.text(`STATUS: ${payment.status}`, 145, 36);

  // Billing Details
  doc.setTextColor(115, 115, 115); // Neutral 400
  doc.setFontSize(11);
  doc.text("BILLED TO:", 14, 65);

  doc.setTextColor(9, 9, 11); // Neutral 950
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.text(member.name, 14, 73);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(64, 64, 64); // Neutral 700
  doc.text(`Member ID: ${member.memberId}`, 14, 80);
  doc.text(`Phone: ${member.phone}`, 14, 86);
  doc.text(`Email: ${member.user?.email || member.email || "N/A"}`, 14, 92);

  // Plan Details Column headers and rows
  const tableHeaders = [
    ["Description", "Duration", "Base Price", "GST (18%)", "Total Amount"],
  ];
  
  const basePrice = payment.totalAmount - payment.taxAmount;
  const planName = member.membership?.plan?.name || "Gym Membership Subscription";
  const planDuration = member.membership?.plan?.durationDays
    ? `${member.membership.plan.durationDays} Days`
    : "N/A";

  const tableData = [
    [
      planName,
      planDuration,
      `₹${basePrice.toFixed(2)}`,
      `₹${payment.taxAmount.toFixed(2)}`,
      `₹${payment.totalAmount.toFixed(2)}`,
    ],
  ];

  // Render Table with Purple Header row
  (doc as any).autoTable({
    startY: 102,
    head: tableHeaders,
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [124, 58, 237], // HSL Primary Purple: rgb(124, 58, 237)
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 6,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 35 },
    },
  });

  // Summary and GST breakdown
  const finalY = (doc as any).lastAutoTable.finalY + 15;

  doc.setTextColor(115, 115, 115);
  doc.setFontSize(10);
  doc.text(`Payment Method: ${payment.method}`, 14, finalY);
  if (payment.notes) {
    doc.text(`Notes: ${payment.notes}`, 14, finalY + 6);
  }

  // Draw final total box
  doc.setFillColor(244, 244, 245); // Zinc 100
  doc.rect(130, finalY - 5, 66, 32, "F");
  
  doc.setTextColor(64, 64, 64);
  doc.setFontSize(9);
  doc.text(`Subtotal:`, 135, finalY + 2);
  doc.text(`₹${basePrice.toFixed(2)}`, 168, finalY + 2);

  doc.text(`CGST (9%):`, 135, finalY + 8);
  doc.text(`₹ ${(payment.taxAmount / 2).toFixed(2)}`, 168, finalY + 8);

  doc.text(`SGST (9%):`, 135, finalY + 14);
  doc.text(`₹ ${(payment.taxAmount / 2).toFixed(2)}`, 168, finalY + 14);

  doc.setDrawColor(228, 228, 231); // Zinc 200
  doc.line(135, finalY + 18, 191, finalY + 18);

  doc.setTextColor(124, 58, 237); // Purple
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total Paid:`, 135, finalY + 23);
  doc.text(`₹${payment.amountPaid.toFixed(2)}`, 168, finalY + 23);

  // Footer branding message
  doc.setTextColor(163, 163, 163);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Thank you for training with Core Fit Club. Let's push limits!", 14, 280);

  // Save document as PDF
  doc.save(`${payment.invoiceNumber}.pdf`);
};
