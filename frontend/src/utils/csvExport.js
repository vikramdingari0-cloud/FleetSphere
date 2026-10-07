/**
 * Utility for exporting tabular dataset to clean CSV format
 */
export const exportToCSV = (filename, headers, rows) => {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => escapeCell(h.label)).join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => escapeCell(typeof h.accessor === 'function' ? h.accessor(row) : row[h.accessor])).join(',')
  );

  const csvContent = [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
