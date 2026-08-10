const PDFDocument = require('pdfkit');

/**
 * Generate a clean, professional PDF Payout Report Buffer
 * @param {Object} data
 * @param {string} data.sellerName
 * @param {string} data.sellerEmail
 * @param {string} data.reportId
 * @param {string} data.period
 * @param {string} data.payoutDate
 * @param {string} data.payoutStatus
 * @param {Array} data.soldProducts - [{ name, quantity, unitPrice, totalAmount }]
 * @param {number} data.grossSales
 * @param {number} data.commissionRate
 * @param {number} data.commissionAmount
 * @param {number} data.netSellerAmount
 * @returns {Promise<Buffer>}
 */
const generatePayoutPdf = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // Primary colors
      const brandColor = '#0f766e'; // Teal/emerald brand accent
      const textPrimary = '#0f172a';
      const textSecondary = '#475569';
      const tableHeaderBg = '#f1f5f9';
      const borderColor = '#cbd5e1';

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#f8fafc');
      doc.fillColor(brandColor).fontSize(22).font('Helvetica-Bold').text('SmartSpaceAI', 55, 52);
      doc.fillColor(textSecondary).fontSize(12).font('Helvetica').text('Seller Payout Report', 55, 76);
      doc.fillColor(brandColor).fontSize(10).font('Helvetica-Bold').text('CONFIRMED PAYOUT', 430, 62, { align: 'right' });

      doc.moveDown(2);
      let y = 120;

      // Section 1: Seller Information & Report Metadata
      doc.fillColor(brandColor).fontSize(14).font('Helvetica-Bold').text('Seller & Payout Information', 40, y);
      doc.moveTo(40, y + 18).lineTo(555, y + 18).strokeColor(borderColor).lineWidth(1).stroke();

      y += 28;
      doc.fontSize(10).font('Helvetica-Bold').fillColor(textPrimary);
      
      // Left Column
      doc.text('Seller Name:', 40, y);
      doc.font('Helvetica').fillColor(textSecondary).text(data.sellerName || 'N/A', 130, y);
      
      doc.font('Helvetica-Bold').fillColor(textPrimary).text('Seller Email:', 40, y + 18);
      doc.font('Helvetica').fillColor(textSecondary).text(data.sellerEmail || 'N/A', 130, y + 18);

      doc.font('Helvetica-Bold').fillColor(textPrimary).text('Report ID:', 40, y + 36);
      doc.font('Helvetica').fillColor(textSecondary).text(data.reportId || 'N/A', 130, y + 36);

      // Right Column
      doc.font('Helvetica-Bold').fillColor(textPrimary).text('Reporting Period:', 320, y);
      doc.font('Helvetica').fillColor(textSecondary).text(data.period || 'N/A', 430, y);

      doc.font('Helvetica-Bold').fillColor(textPrimary).text('Payout Date:', 320, y + 18);
      doc.font('Helvetica').fillColor(textSecondary).text(data.payoutDate || 'N/A', 430, y + 18);

      doc.font('Helvetica-Bold').fillColor(textPrimary).text('Payout Status:', 320, y + 36);
      doc.font('Helvetica-Bold').fillColor('#16a34a').text(data.payoutStatus || 'Paid', 430, y + 36);

      y += 65;

      // Section 2: Sold Products
      doc.fillColor(brandColor).fontSize(14).font('Helvetica-Bold').text('Sold Products Breakdown', 40, y);
      doc.moveTo(40, y + 18).lineTo(555, y + 18).strokeColor(borderColor).stroke();

      y += 26;

      // Table Headers
      doc.rect(40, y, 515, 22).fill(tableHeaderBg);
      doc.fillColor(textPrimary).fontSize(9).font('Helvetica-Bold');
      doc.text('Product Name', 48, y + 6, { width: 230 });
      doc.text('Quantity', 280, y + 6, { width: 60, align: 'center' });
      doc.text('Unit Price (EGP)', 350, y + 6, { width: 90, align: 'right' });
      doc.text('Total Amount (EGP)', 450, y + 6, { width: 95, align: 'right' });

      y += 24;

      const products = data.soldProducts && data.soldProducts.length > 0 ? data.soldProducts : [];

      if (products.length === 0) {
        doc.font('Helvetica-Oblique').fillColor(textSecondary).fontSize(9);
        doc.text('No individual product records found for this period.', 48, y + 6);
        y += 24;
      } else {
        products.forEach((prod, idx) => {
          if (y > 720) {
            doc.addPage();
            y = 40;
          }
          const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(40, y, 515, 20).fill(rowBg);

          doc.fillColor(textPrimary).fontSize(9).font('Helvetica');
          doc.text(prod.name || 'Product', 48, y + 5, { width: 230, height: 14, ellipsis: true });
          doc.text(String(prod.quantity || 1), 280, y + 5, { width: 60, align: 'center' });
          doc.text((prod.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 350, y + 5, { width: 90, align: 'right' });
          doc.font('Helvetica-Bold').text((prod.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 450, y + 5, { width: 95, align: 'right' });

          y += 20;
        });
      }

      y += 15;

      // Section 3: Financial Summary Box
      if (y > 640) {
        doc.addPage();
        y = 40;
      }

      doc.fillColor(brandColor).fontSize(14).font('Helvetica-Bold').text('Financial Summary', 40, y);
      doc.moveTo(40, y + 18).lineTo(555, y + 18).strokeColor(borderColor).stroke();

      y += 28;

      // Summary Card Container
      doc.rect(40, y, 515, 115).fill('#f8fafc').strokeColor(borderColor).stroke();

      const summaryY = y + 12;
      doc.fontSize(10).font('Helvetica').fillColor(textPrimary);

      // Line 1: Gross Sales Volume
      doc.text('Gross Sales Volume:', 55, summaryY);
      doc.font('Helvetica-Bold').text(`EGP ${(data.grossSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 420, summaryY, { align: 'right', width: 120 });

      // Line 2: Platform Fee Rate
      doc.font('Helvetica').text('Platform Commission Rate:', 55, summaryY + 20);
      doc.font('Helvetica-Bold').text(`${data.commissionRate || 10}%`, 420, summaryY + 20, { align: 'right', width: 120 });

      // Line 3: Platform Commission Fee
      doc.font('Helvetica').text('Platform Commission / Fee:', 55, summaryY + 40);
      doc.font('Helvetica-Bold').fillColor('#b91c1c').text(`- EGP ${(data.commissionAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 420, summaryY + 40, { align: 'right', width: 120 });

      doc.moveTo(55, summaryY + 58).lineTo(540, summaryY + 58).strokeColor('#cbd5e1').stroke();

      // Line 4: Net Seller Payout Amount (Highlighted)
      doc.font('Helvetica-Bold').fontSize(11).fillColor(brandColor).text('Seller Payout Amount (Net):', 55, summaryY + 68);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#15803d').text(`EGP ${(data.netSellerAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 420, summaryY + 67, { align: 'right', width: 120 });

      // Footer line
      doc.fontSize(8).font('Helvetica').fillColor(textSecondary);
      doc.text('SmartSpaceAI Automated Financial System • Confidential Payout Summary', 40, 780, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePayoutPdf };
