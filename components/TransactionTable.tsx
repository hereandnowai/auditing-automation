
import React, { useState, useMemo } from 'react';
import { FlaggedTransaction } from '../types';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

interface TransactionTableProps {
  transactions: FlaggedTransaction[];
  defaultSortField?: keyof FlaggedTransaction;
  defaultSortDirection?: 'asc' | 'desc';
}

const TransactionTable: React.FC<TransactionTableProps> = ({ 
  transactions, 
  defaultSortField = 'date', 
  defaultSortDirection = 'desc' 
}) => {
  const [sortField, setSortField] = useState<keyof FlaggedTransaction>(defaultSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle undefined policy_code for sorting
      if (sortField === 'policy_code') {
        valA = valA ?? ''; // Treat undefined as empty string for sorting
        valB = valB ?? '';
      }
      
      // Ensure numeric comparison for amount
      if (sortField === 'amount') {
        valA = Number(valA);
        valB = Number(valB);
      }
      
      // Basic string/number comparison
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, sortField, sortDirection]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const handleSort = (field: keyof FlaggedTransaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };
  
  const headers: { key: keyof FlaggedTransaction; label: string; numeric?: boolean }[] = [
    { key: 'transaction_id', label: 'ID' },
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount', numeric: true },
    { key: 'category', label: 'Category' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'account', label: 'Account' },
    { key: 'policy_code', label: 'Policy Code' },
    { key: 'isFlagged', label: 'Status' },
    { key: 'riskReasons', label: 'Risk Reasons' },
  ];

  if (transactions.length === 0) {
    return <p className="text-gray-500 text-center py-4">No transactions to display.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(header => (
              <th
                key={header.key}
                onClick={() => handleSort(header.key)}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${header.numeric ? 'text-right' : ''}`}
              >
                <div className={`flex items-center ${header.numeric ? 'justify-end' : ''}`}>
                  {header.label}
                  {sortField === header.key && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedTransactions.map((transaction) => (
            <tr key={transaction.transaction_id} className={`hover:bg-gray-50 ${transaction.isFlagged ? 'bg-red-50 hover:bg-red-100' : ''}`}>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{transaction.transaction_id}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(transaction.date).toLocaleDateString()}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right">${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{transaction.category}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{transaction.vendor}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{transaction.account}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{transaction.policy_code || 'N/A'}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {transaction.isFlagged ? (
                  <span className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" /> Flagged
                  </span>
                ) : (
                  <span className="flex items-center text-green-600">
                     <CheckCircle className="w-4 h-4 mr-1" /> Clear
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={transaction.riskReasons.join(', ')}>
                {transaction.isFlagged ? transaction.riskReasons.join(', ') : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200 bg-white">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
