import { Transaction } from './types';

export const VALID_POLICY_CODES: string[] = ['P001', 'P002', 'P003', 'P004', 'P005', 'P006', 'P007', 'P008', 'P009', 'P010']; 

export const CATEGORY_SPECIFIC_AMOUNT_THRESHOLDS: { [category: string]: number } = {
  'Software Licensing': 2000,
  'Consulting Services': 5000,
  'Travel & Expenses': 1000,
  'Hardware Purchases': 3000,
  'Marketing & Advertising': 2500,
  'Office Supplies': 500,
  'Legal Fees': 7000,
  'Training & Development': 1500,
  // Add more category-specific thresholds
};

export const GENERAL_HIGH_AMOUNT_THRESHOLD = 10000; // General threshold for any transaction if not covered by category
export const OUTLIER_STD_DEV_FACTOR = 2.5; // For statistical outlier detection (e.g. amount > mean + N * std_dev)
export const MIN_SAMPLES_FOR_OUTLIER_DETECTION = 10; // Minimum samples in a category to perform outlier detection

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

// Column headers expected in CSV (must match Transaction interface keys for parser mapping)
export const CSV_HEADERS: (keyof Transaction)[] = [
  'transaction_id', 'date', 'amount', 'account', 'category', 'vendor', 'policy_code'
];