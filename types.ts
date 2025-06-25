
export interface Transaction {
  transaction_id: string;
  date: string; 
  amount: number;
  account: string;
  category: string;
  vendor: string;
  policy_code?: string;
}

export interface FlaggedTransaction extends Transaction {
  riskReasons: string[];
  isFlagged: boolean;
}

export interface PolicyViolation {
  transaction_id: string;
  date: string;
  amount: number;
  category: string;
  vendor: string;
  reason: string;
  details: string;
}

export interface AuditSummary {
  totalTransactions: number;
  totalAmount: number;
  flaggedForAuditCount: number;
  policyViolationsCount: number;
}

export interface CategorySpending {
  name: string;
  amount: number;
}

export interface TimeSeriesDataPoint {
  date: string; // 'YYYY-MM'
  amount: number;
}

export interface PolicyComplianceDataPoint {
  name: string;
  value: number; // count
}

export interface SpendingLeader {
  name: string;
  amount: number;
}

// Represents all data derived from raw transactions
export interface ProcessedData {
  allTransactionsWithFlags: FlaggedTransaction[];
  flaggedTransactions: FlaggedTransaction[];
  auditSummary: AuditSummary;
  policyViolations: PolicyViolation[];
  spendByCategory: CategorySpending[];
  policyCompliance: PolicyComplianceDataPoint[];
  spendTrend: TimeSeriesDataPoint[];
  highestSpendingCategories: SpendingLeader[];
  highestSpendingVendors: SpendingLeader[];
  highestSpendingAccounts: SpendingLeader[];
}

export interface CsvParseError {
  type: string;
  code: string;
  message: string;
  row: number;
}
