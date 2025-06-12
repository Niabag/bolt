export const generateExportPdf = async (exportData, dateStr) => {
  const { default: jsPDF } = await import('jspdf');
  const margin = 10;
  let y = margin + 5;
  const pdf = new jsPDF();

  pdf.setFontSize(18);
  pdf.text('Export CRM', 105, y, { align: 'center' });
  y += 10;
  pdf.setFontSize(12);
  pdf.text(`Date : ${dateStr}`, 105, y, { align: 'center' });
  y += 15;

  pdf.setFontSize(14);
  pdf.text('Utilisateur', margin, y);
  y += 8;
  pdf.setFontSize(10);
  if (exportData.user) {
    if (exportData.user.name) {
      pdf.text(`Nom : ${exportData.user.name}`, margin + 2, y);
      y += 6;
    }
    if (exportData.user.email) {
      pdf.text(`Email : ${exportData.user.email}`, margin + 2, y);
      y += 6;
    }
  }

  if (exportData.clients && exportData.clients.length) {
    y += 4;
    pdf.setFontSize(14);
    pdf.text('Clients', margin, y);
    y += 8;
    pdf.setFontSize(10);
    exportData.clients.forEach((client, idx) => {
      pdf.text(`${idx + 1}. ${client.name || ''} - ${client.email || ''}`, margin + 2, y);
      y += 6;
      if (y > 280) {
        pdf.addPage();
        y = margin;
      }
    });
  }

  if (exportData.devis && exportData.devis.length) {
    y += 4;
    pdf.setFontSize(14);
    pdf.text('Devis', margin, y);
    y += 8;
    pdf.setFontSize(10);
    exportData.devis.forEach((devis, idx) => {
      const date = devis.dateDevis ? devis.dateDevis.split('T')[0] : '';
      pdf.text(`${idx + 1}. ${devis.title || 'Devis'} - ${date}`, margin + 2, y);
      y += 6;
      if (y > 280) {
        pdf.addPage();
        y = margin;
      }
    });
  }

  if (exportData.invoices && exportData.invoices.length) {
    y += 4;
    pdf.setFontSize(14);
    pdf.text('Factures', margin, y);
    y += 8;
    pdf.setFontSize(10);
    exportData.invoices.forEach((invoice, idx) => {
      const date = invoice.createdAt ? invoice.createdAt.split('T')[0] : '';
      pdf.text(
        `${idx + 1}. ${invoice.invoiceNumber || 'Facture'} - ${date}`,
        margin + 2,
        y
      );
      y += 6;
      if (y > 280) {
        pdf.addPage();
        y = margin;
      }
    });
  }

  pdf.save(`crm-export-${dateStr}.pdf`);
};
