/**
 * Utility functions for exporting data to CSV, Excel, and triggering Print / PDF views.
 */

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","));

  // Add row data
  rows.forEach((row) => {
    csvRows.push(row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\n"); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  // Generate HTML table for Excel download to preserve formatting
  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
  tableHtml += `<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>`;
  tableHtml += `<table border="1" style="border-collapse: collapse; font-family: Arial, sans-serif;">`;

  // Header row
  tableHtml += `<tr style="background-color: #0284c7; color: #ffffff; font-weight: bold;">`;
  headers.forEach((header) => {
    tableHtml += `<th style="padding: 8px 12px; text-align: left;">${header}</th>`;
  });
  tableHtml += `</tr>`;

  // Data rows
  rows.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    tableHtml += `<tr style="background-color: ${bg};">`;
    row.forEach((cell) => {
      tableHtml += `<td style="padding: 6px 12px;">${cell ?? ""}</td>`;
    });
    tableHtml += `</tr>`;
  });

  tableHtml += `</table></body></html>`;

  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, headers: string[], rows: (string | number)[][]) {
  // Opens a dedicated printable clean layout in a new tab/window for PDF saving
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Gagal membuka jendela cetak. Mohon izinkan popup di browser Anda.");
    return;
  }

  let html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - TMS SMKN 1 Cimahi</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0284c7; padding-bottom: 12px; }
          .header h1 { margin: 0; font-size: 20px; color: #0f172a; }
          .header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
          .meta { margin-bottom: 16px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
          th { background-color: #0284c7; color: white; padding: 8px 10px; text-align: left; font-weight: bold; border: 1px solid #0284c7; }
          td { border: 1px solid #cbd5e1; padding: 6px 10px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; text-align: right; font-size: 11px; color: #64748b; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>TAARUF MANAGEMENT SYSTEM (TMS)</h1>
          <p>SMKN 1 CIMAHI - LAPORAN RESMI ACARA TAARUF</p>
        </div>
        <div class="meta">
          <span><strong>Jenis Laporan:</strong> ${title}</span>
          <span><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}</span>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `<tr>${row.map((c) => `<td>${c ?? "-"}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>Dicetak otomatis oleh Sistem TMS SMKN 1 Cimahi</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export function triggerPrint() {
  if (typeof window !== "undefined") {
    window.print();
  }
}
