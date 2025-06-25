
import Papa from 'papaparse';

export const exportToCSV = (data: any[], filename: string): void => {
  if (!data || data.length === 0) {
    console.warn("No data provided for CSV export.");
    return;
  }

  try {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) { // Check for browser support
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback for older browsers (e.g., IE)
      // This might not work as well, especially for larger files or strict security settings
      // Consider alerting the user or providing the CSV data in a textarea for manual copy-paste
      alert("Your browser doesn't fully support automatic CSV download. The data will be logged to console.");
      console.log("CSV Data for manual copy:\n\n", csv);
    }
  } catch (error) {
    console.error("Error generating CSV:", error);
    alert("An error occurred while generating the CSV file.");
  }
};
