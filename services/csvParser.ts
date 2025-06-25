
import Papa from 'papaparse';
import { Transaction, CsvParseError } from '../types';
import { CSV_HEADERS } from '../constants';

// Type guard for CsvParseError
function isCsvParseError(error: any): error is CsvParseError {
  return error && typeof error.type === 'string' && typeof error.code === 'string' && typeof error.message === 'string' && typeof error.row === 'number';
}


export const parseCSV = (file: File): Promise<{ data: Partial<Transaction>[]; errors: CsvParseError[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: (header) => header === 'amount', // Ensure 'amount' is parsed as number
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        // Validate headers
        const presentHeaders = results.meta.fields || [];
        const missingHeaders = CSV_HEADERS.filter(h => !presentHeaders.includes(h));
        if (missingHeaders.length > 0) {
          reject(new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`));
          return;
        }

        const typedData = results.data.map((row: any) => {
          const transaction: Partial<Transaction> = {};
          CSV_HEADERS.forEach(header => {
            if (row[header] !== undefined && row[header] !== null && String(row[header]).trim() !== "") {
              if (header === 'amount') {
                transaction[header] = parseFloat(String(row[header]));
              } else if (header === 'policy_code' && String(row[header]).trim() === "") {
                // Explicitly do not set policy_code if it's an empty string after trim
                // It will remain undefined
              }
              else {
                transaction[header] = String(row[header]).trim();
              }
            }
          });
          // Ensure essential fields are present enough to be considered a transaction
          if (!transaction.transaction_id || !transaction.date || transaction.amount === undefined || !transaction.category) {
            return null; // Invalid row, will be filtered out
          }
          return transaction;
        }).filter(item => item !== null) as Partial<Transaction>[];
        
        const errors: CsvParseError[] = results.errors.filter(isCsvParseError) as CsvParseError[];
        resolve({ data: typedData, errors });
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
};
