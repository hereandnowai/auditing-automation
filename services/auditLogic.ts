
import { Transaction, FlaggedTransaction, PolicyViolation, AuditSummary, CategorySpending, TimeSeriesDataPoint, PolicyComplianceDataPoint, SpendingLeader, ProcessedData } from '../types';
import { VALID_POLICY_CODES, CATEGORY_SPECIFIC_AMOUNT_THRESHOLDS, GENERAL_HIGH_AMOUNT_THRESHOLD, OUTLIER_STD_DEV_FACTOR, MIN_SAMPLES_FOR_OUTLIER_DETECTION } from '../constants';

const checkAmountThresholds = (transaction: Transaction): string[] => {
  const reasons: string[] = [];
  const categoryThreshold = CATEGORY_SPECIFIC_AMOUNT_THRESHOLDS[transaction.category];
  if (categoryThreshold !== undefined && transaction.amount > categoryThreshold) {
    reasons.push(`Amount exceeds category threshold ($${categoryThreshold.toLocaleString()}) for ${transaction.category}.`);
  } else if (transaction.amount > GENERAL_HIGH_AMOUNT_THRESHOLD) {
    reasons.push(`Amount exceeds general high value threshold ($${GENERAL_HIGH_AMOUNT_THRESHOLD.toLocaleString()}).`);
  }
  return reasons;
};

const checkPolicyCodes = (transaction: Transaction): string[] => {
  const reasons: string[] = [];
  if (!transaction.policy_code || transaction.policy_code.trim() === "") {
    reasons.push('Missing policy code.');
  } else if (!VALID_POLICY_CODES.includes(transaction.policy_code)) {
    reasons.push(`Invalid policy code: ${transaction.policy_code}.`);
  }
  return reasons;
};

const checkDuplicates = (transaction: Transaction, allTransactions: Transaction[]): string[] => {
  const reasons: string[] = [];
  const duplicates = allTransactions.filter(
    t => t.transaction_id === transaction.transaction_id && t !== transaction // Ensure not comparing to itself if list contains it
  );
  if (duplicates.length > 0) {
    reasons.push(`Duplicate transaction ID: ${transaction.transaction_id}.`);
  }
  // Could add more complex duplicate checks (e.g., same amount, vendor, date)
  return reasons;
};


const detectOutliers = (transactions: Transaction[]): Map<string, string[]> => {
    const outlierReasons = new Map<string, string[]>(); // Map transaction_id to outlier reasons
    const transactionsByCategory: { [key: string]: Transaction[] } = {};

    transactions.forEach(t => {
        if (!transactionsByCategory[t.category]) {
            transactionsByCategory[t.category] = [];
        }
        transactionsByCategory[t.category].push(t);
    });

    for (const category in transactionsByCategory) {
        const categoryTransactions = transactionsByCategory[category];
        if (categoryTransactions.length < MIN_SAMPLES_FOR_OUTLIER_DETECTION) continue;

        const amounts = categoryTransactions.map(t => t.amount);
        const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
        const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);

        if (stdDev === 0) continue; // Avoid division by zero if all amounts are the same

        const outlierThreshold = mean + OUTLIER_STD_DEV_FACTOR * stdDev;

        categoryTransactions.forEach(t => {
            if (t.amount > outlierThreshold) {
                const reason = `Outlier: Amount $${t.amount.toLocaleString()} is significantly higher than category '${category}' average (>$${outlierThreshold.toLocaleString()}).`;
                if (!outlierReasons.has(t.transaction_id)) {
                    outlierReasons.set(t.transaction_id, []);
                }
                outlierReasons.get(t.transaction_id)!.push(reason);
            }
        });
    }
    return outlierReasons;
};


export const processTransactions = (transactions: Transaction[]): ProcessedData => {
  let totalAmount = 0;
  const policyViolations: PolicyViolation[] = [];
  const allTransactionsWithFlags: FlaggedTransaction[] = [];
  
  const uniqueTransactionIds = new Set<string>();
  const duplicateIdReasons = new Map<string, string[]>();

  // First pass for identifying duplicate IDs
  transactions.forEach(t => {
    if (uniqueTransactionIds.has(t.transaction_id)) {
        if (!duplicateIdReasons.has(t.transaction_id)) {
            duplicateIdReasons.set(t.transaction_id, []);
        }
        duplicateIdReasons.get(t.transaction_id)!.push(`Duplicate transaction ID: ${t.transaction_id}.`);
    } else {
        uniqueTransactionIds.add(t.transaction_id);
    }
  });
  
  const outlierReasons = detectOutliers(transactions);

  transactions.forEach(t => {
    totalAmount += t.amount;
    const riskReasons: string[] = [];

    riskReasons.push(...checkAmountThresholds(t));
    const policyCodeReasons = checkPolicyCodes(t);
    riskReasons.push(...policyCodeReasons);
    
    // Add duplicate reasons if this specific ID was marked as duplicate
    if (duplicateIdReasons.has(t.transaction_id)) {
        riskReasons.push(...duplicateIdReasons.get(t.transaction_id)!);
    }
    
    // Add outlier reasons
    if(outlierReasons.has(t.transaction_id)){
        riskReasons.push(...outlierReasons.get(t.transaction_id)!);
    }

    const isFlagged = riskReasons.length > 0;
    allTransactionsWithFlags.push({ ...t, riskReasons, isFlagged });

    policyCodeReasons.forEach(reason => {
      policyViolations.push({
        transaction_id: t.transaction_id,
        date: t.date,
        amount: t.amount,
        category: t.category,
        vendor: t.vendor,
        reason: reason.startsWith('Missing') ? 'Missing Policy Code' : 'Invalid Policy Code',
        details: reason,
      });
    });
    // Add amount violations to policyViolations list as well
    checkAmountThresholds(t).forEach(reason => {
        policyViolations.push({
            transaction_id: t.transaction_id,
            date: t.date,
            amount: t.amount,
            category: t.category,
            vendor: t.vendor,
            reason: 'Amount Violation',
            details: reason
        });
    });
  });

  const flaggedTransactions = allTransactionsWithFlags.filter(t => t.isFlagged);

  const auditSummary: AuditSummary = {
    totalTransactions: transactions.length,
    totalAmount,
    flaggedForAuditCount: flaggedTransactions.length,
    policyViolationsCount: new Set(policyViolations.map(v => v.transaction_id + v.reason)).size, // Count unique transaction+reason pairs
  };

  // Data Analysis for Charts
  const spendByCategoryMap: { [key: string]: number } = {};
  const spendByVendorMap: { [key: string]: number } = {};
  const spendByAccountMap: { [key: string]: number } = {};
  const spendByMonth: { [key: string]: number } = {}; // 'YYYY-MM'
  let compliantCount = 0;
  let missingPolicyCodeCount = 0;
  let invalidPolicyCodeCount = 0;
  let amountViolationCount = 0; // Simplified for policy compliance chart

  allTransactionsWithFlags.forEach(t => {
    spendByCategoryMap[t.category] = (spendByCategoryMap[t.category] || 0) + t.amount;
    spendByVendorMap[t.vendor] = (spendByVendorMap[t.vendor] || 0) + t.amount;
    spendByAccountMap[t.account] = (spendByAccountMap[t.account] || 0) + t.amount;

    const monthYear = t.date.substring(0, 7); // YYYY-MM
    spendByMonth[monthYear] = (spendByMonth[monthYear] || 0) + t.amount;

    let isCompliant = true;
    if (!t.policy_code || t.policy_code.trim() === "") {
      missingPolicyCodeCount++;
      isCompliant = false;
    } else if (!VALID_POLICY_CODES.includes(t.policy_code)) {
      invalidPolicyCodeCount++;
      isCompliant = false;
    }
    
    // Check for amount violations for the compliance chart
    const amountReasons = checkAmountThresholds(t);
    if (amountReasons.length > 0) {
        amountViolationCount++; // Count transaction once if it has any amount violation
        isCompliant = false;
    }

    if (isCompliant) {
        compliantCount++;
    }
  });
  
  const createSpendingLeaders = (map: { [key: string]: number }): SpendingLeader[] => {
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const spendByCategory: CategorySpending[] = createSpendingLeaders(spendByCategoryMap);
  const highestSpendingCategories = spendByCategory.slice(0, 5);
  const highestSpendingVendors = createSpendingLeaders(spendByVendorMap).slice(0, 5);
  const highestSpendingAccounts = createSpendingLeaders(spendByAccountMap).slice(0, 5);

  const policyCompliance: PolicyComplianceDataPoint[] = [
    { name: 'Compliant', value: compliantCount },
    { name: 'Missing Policy Code', value: missingPolicyCodeCount },
    { name: 'Invalid Policy Code', value: invalidPolicyCodeCount },
    { name: 'Amount Violation', value: amountViolationCount },
  ].filter(item => item.value > 0);


  const spendTrend: TimeSeriesDataPoint[] = Object.entries(spendByMonth)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    allTransactionsWithFlags,
    flaggedTransactions,
    auditSummary,
    policyViolations: [...new Map(policyViolations.map(item => [item.transaction_id + item.reason, item])).values()], // Deduplicate policy violations
    spendByCategory,
    policyCompliance,
    spendTrend,
    highestSpendingCategories,
    highestSpendingVendors,
    highestSpendingAccounts,
  };
};
