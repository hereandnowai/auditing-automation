
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, FlaggedTransaction, AuditSummary, /*CategorySpending, TimeSeriesDataPoint, PolicyComplianceDataPoint,*/ ProcessedData, CsvParseError as AppCsvParseError } from './types'; // Renamed CsvParseError to avoid conflict if any
import { CSV_HEADERS } from './constants';
import FileUpload from './components/FileUpload';
import TransactionTable from './components/TransactionTable';
import SpendByCategoryChart from './components/charts/SpendByCategoryChart';
import PolicyComplianceChart from './components/charts/PolicyComplianceChart';
import SpendTrendChart from './components/charts/SpendTrendChart';
import Spinner from './components/ui/Spinner';
import Alert from './components/ui/Alert';
import { parseCSV } from './services/csvParser';
import { processTransactions } from './services/auditLogic';
import { generateGeminiInsights } from './services/geminiService';
import { BarChart2, CheckCircle, FileText, LayoutDashboard, AlertTriangle, Cpu, Download, Github, Linkedin, Instagram, Youtube, Rss, Twitter, Globe } from 'lucide-react';
import { exportToCSV } from './utils/dataTransformations';

const BRAND_CONFIG = {
  "brand": {
    "organizationShortName": "HERE AND NOW AI",
    "organizationLongName": "HERE AND NOW AI - Artificial Intelligence Research Institute",
    "website": "https://hereandnowai.com",
    "email": "info@hereandnowai.com",
    "mobile": "+91 996 296 1000",
    "slogan": "designed with passion for innovation",
    "colors": {
      "primary": "#FFDF00",
      "secondary": "#004040"
    },
    "logo": {
      "title": "https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/HNAI%20Title%20-Teal%20%26%20Golden%20Logo%20-%20DESIGN%203%20-%20Raj-07.png",
      "favicon": "https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/favicon-logo-with-name.png"
    },
    "chatbot": {
      "avatar": "https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/caramel.jpeg",
      "face": "https://raw.githubusercontent.com/hereandnowai/images/refs/heads/main/logos/caramel-face.jpeg"
    },
    "socialMedia": {
      "blog": "https://hereandnowai.com/blog",
      "linkedin": "https://www.linkedin.com/company/hereandnowai/",
      "instagram": "https://instagram.com/hereandnow_ai",
      "github": "https://github.com/hereandnowai",
      "x": "https://x.com/hereandnow_ai",
      "youtube": "https://youtube.com/@hereandnow_ai"
    }
  }
};

const App: React.FC = () => {
  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [geminiApiKeyAvailable, setGeminiApiKeyAvailable] = useState<boolean>(false);
  const [geminiInsights, setGeminiInsights] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState<boolean>(false);

  const APP_SPECIFIC_NAME = "Auditing Automation";

  useEffect(() => {
    const apiKey = process.env.API_KEY; 
    if (apiKey && apiKey.trim() !== "") {
      setGeminiApiKeyAvailable(true);
    } else {
      setGeminiApiKeyAvailable(false);
      console.warn("Gemini API key not found. AI features will be disabled. Ensure the API_KEY environment variable is set.");
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setRawTransactions([]);
    setProcessedData(null);
    setGeminiInsights(null);
    try {
      const parsedOutput = await parseCSV(file);
      if (parsedOutput.errors.length > 0) {
        const errorMessages = parsedOutput.errors.map((err: AppCsvParseError) => `Row ${err.row}: ${err.message}`).join('\n');
        setError(`CSV Parsing Errors:\n${errorMessages}`);
      }
      const validTransactions = parsedOutput.data.filter(t => t.transaction_id && t.date && t.amount != null && t.category);
      setRawTransactions(validTransactions as Transaction[]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV.');
      setRawTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (rawTransactions.length > 0) {
      setIsLoading(true);
      try {
        const result = processTransactions(rawTransactions);
        setProcessedData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error processing transactions.');
        setProcessedData(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setProcessedData(null);
    }
  }, [rawTransactions]);

  const handleGetGeminiInsights = useCallback(async () => {
    if (!processedData || !processedData.flaggedTransactions || processedData.flaggedTransactions.length === 0) {
      setGeminiInsights("No transactions flagged for audit to analyze.");
      return;
    }
    if (!geminiApiKeyAvailable) {
      setGeminiInsights("Gemini API Key not available. Cannot fetch AI insights. Please ensure the API_KEY environment variable is set.");
      return;
    }

    setIsGeminiLoading(true);
    setGeminiInsights(null);
    setError(null);
    try {
      const insights = await generateGeminiInsights(processedData.flaggedTransactions.slice(0, 20));
      setGeminiInsights(insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI insights.');
      setGeminiInsights(null);
    } finally {
      setIsGeminiLoading(false);
    }
  }, [processedData, geminiApiKeyAvailable]);

  const { auditSummary, flaggedTransactions, policyViolations, spendByCategory, policyCompliance, spendTrend } = useMemo(() => {
    if (!processedData) {
      return {
        auditSummary: { totalTransactions: 0, totalAmount: 0, flaggedForAuditCount: 0, policyViolationsCount: 0 },
        flaggedTransactions: [],
        policyViolations: [],
        spendByCategory: [],
        policyCompliance: [],
        spendTrend: [],
      };
    }
    return processedData;
  }, [processedData]);

  const renderKPIs = (summary: AuditSummary) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
        <p className="text-3xl font-semibold text-gray-800">{summary.totalTransactions.toLocaleString()}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
        <p className="text-3xl font-semibold text-gray-800">${summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-red-500">Flagged for Audit</h3>
        <p className="text-3xl font-semibold text-red-600">{summary.flaggedForAuditCount.toLocaleString()}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-amber-500">Policy Violations</h3>
        <p className="text-3xl font-semibold text-amber-600">{summary.policyViolationsCount.toLocaleString()}</p>
      </div>
    </div>
  );
  
  const handleExport = (type: 'all_flagged' | 'policy_violations' | 'sampled_for_review') => {
    if (!processedData) return;
    let dataToExport: any[] = [];
    let fileName = "audit_report.csv";

    switch (type) {
      case 'all_flagged':
        dataToExport = processedData.flaggedTransactions.map(t => ({...t, riskReasons: t.riskReasons.join('; ')}));
        fileName = "auditable_transactions_flagged.csv";
        break;
      case 'policy_violations':
        dataToExport = processedData.policyViolations;
        fileName = "policy_violations_list.csv";
        break;
      case 'sampled_for_review':
        dataToExport = processedData.flaggedTransactions.filter(t => t.isFlagged).map(t => ({...t, riskReasons: t.riskReasons.join('; ')}));
        fileName = "sampled_transactions_for_review.csv";
        break;
    }
    if (dataToExport.length > 0) {
      exportToCSV(dataToExport, fileName);
    } else {
      alert("No data available for this report.");
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Upload', icon: LayoutDashboard },
    { id: 'transactions', label: 'All Transactions', icon: FileText },
    { id: 'dashboard', label: 'Dashboard Insights', icon: BarChart2 },
    { id: 'audit_sample', label: 'Audit Sample', icon: AlertTriangle },
    { id: 'ai_insights', label: 'AI Analysis', icon: Cpu },
    { id: 'reports', label: 'Export Reports', icon: Download },
  ];

  const socialIcons: { [key: string]: React.ElementType } = {
    blog: Rss,
    linkedin: Linkedin,
    instagram: Instagram,
    github: Github,
    x: Twitter, // Lucide uses Twitter for X
    youtube: Youtube
  };
  
  return (
    <div className="min-h-screen bg-[var(--hnai-secondary)] text-gray-800 p-4 sm:p-6 md:p-8">
      <header className="mb-8 text-center">
        <img src={BRAND_CONFIG.brand.logo.title} alt={BRAND_CONFIG.brand.organizationShortName + " Logo"} className="h-16 sm:h-20 mx-auto mb-4" />
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--hnai-primary)] tracking-tight">{APP_SPECIFIC_NAME}</h1>
        <p className="text-md text-yellow-100 opacity-90 mt-2">{BRAND_CONFIG.brand.slogan}</p>
      </header>

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      
      <div className="bg-[rgba(0,0,0,0.2)] p-1 rounded-lg shadow-md mb-6">
        <nav className="flex flex-wrap -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center text-sm sm:text-base font-medium mr-1 sm:mr-2 py-3 px-3 sm:px-4 border-b-2 rounded-t-md focus:outline-none transition-colors duration-150
                ${activeTab === tab.id 
                  ? 'border-[var(--hnai-primary)] text-[var(--hnai-primary)] bg-[rgba(255,223,0,0.1)]' // primary color for border and text, slightly tinted bg
                  : 'border-transparent text-gray-300 hover:text-[var(--hnai-primary)] hover:border-[var(--hnai-primary)]' // Lighter text for inactive
                }
                ${(tab.id !== 'overview' && rawTransactions.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={(tab.id !== 'overview' && rawTransactions.length === 0) || (isLoading && activeTab !== tab.id)}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="bg-white p-4 sm:p-6 rounded-lg shadow-xl min-h-[60vh]">
        {isLoading && activeTab !== 'overview' && <div className="flex justify-center items-center h-64"><Spinner /> <p className="ml-2 text-lg text-gray-700">Processing Data...</p></div>}
        
        {activeTab === 'overview' && (
          <div>
            <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
            {isLoading && activeTab === 'overview' && <div className="mt-4 flex justify-center items-center"><Spinner /> <p className="ml-2 text-lg text-gray-700">Parsing CSV...</p></div>}
            {rawTransactions.length > 0 && processedData && !isLoading && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Audit Summary</h2>
                {renderKPIs(auditSummary)}
              </div>
            )}
             {rawTransactions.length === 0 && !isLoading && !error && (
              <div className="mt-8 text-center text-gray-500">
                <FileText size={48} className="mx-auto mb-2" />
                <p className="text-lg">Please upload a CSV file to begin analysis.</p>
                <p className="text-sm mt-1">Expected columns: {CSV_HEADERS.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {rawTransactions.length > 0 && processedData && !isLoading && (
          <>
            {activeTab === 'transactions' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">All Transactions</h2>
                <TransactionTable transactions={processedData.allTransactionsWithFlags} />
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Dashboard Insights</h2>
                {renderKPIs(auditSummary)}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="text-xl font-medium mb-2 text-gray-700">Spend by Category</h3>
                    {spendByCategory.length > 0 ? <SpendByCategoryChart data={spendByCategory} /> : <p className="text-gray-500">No category spending data available.</p>}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="text-xl font-medium mb-2 text-gray-700">Policy Compliance</h3>
                    {policyCompliance.length > 0 ? <PolicyComplianceChart data={policyCompliance} /> : <p className="text-gray-500">No policy compliance data available.</p>}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg shadow mt-6">
                  <h3 className="text-xl font-medium mb-2 text-gray-700">Spend Trend Over Time (Monthly)</h3>
                  {spendTrend.length > 0 ? <SpendTrendChart data={spendTrend} /> : <p className="text-gray-500">No spend trend data available.</p>}
                </div>
              </div>
            )}

            {activeTab === 'audit_sample' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Flagged Transactions for Audit</h2>
                {flaggedTransactions.length > 0 ? (
                  <TransactionTable transactions={flaggedTransactions} defaultSortField="amount" defaultSortDirection="desc" />
                ) : (
                  <div className="text-center py-10">
                    <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                    <p className="text-lg text-gray-600">No transactions were flagged for audit based on current criteria.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai_insights' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">AI-Powered Insights</h2>
                {!geminiApiKeyAvailable && (
                    <Alert message="Gemini API Key is not configured. AI insights are unavailable. Please ensure the API_KEY environment variable is set." type="warning" />
                )}
                {geminiApiKeyAvailable && (
                    <>
                        <button
                            onClick={handleGetGeminiInsights}
                            disabled={isGeminiLoading || flaggedTransactions.length === 0}
                            className="mb-6 bg-[var(--hnai-primary)] hover:bg-yellow-300 text-[var(--hnai-secondary-text-on-primary)] font-semibold py-2 px-4 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isGeminiLoading ? <Spinner size="sm" /> : <Cpu size={20} className="mr-2" />}
                            {isGeminiLoading ? 'Generating Insights...' : (flaggedTransactions.length > 0 ? 'Generate AI Insights for Flagged Transactions' : 'No Flagged Transactions for AI Insight')}
                        </button>
                        {geminiInsights && (
                        <div className="bg-gray-50 p-4 rounded-lg shadow">
                            <h3 className="text-xl font-medium mb-2 text-gray-700">Gemini Analysis:</h3>
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white p-3 rounded shadow-inner max-h-96 overflow-y-auto">{geminiInsights}</pre>
                        </div>
                        )}
                    </>
                )}
                 {geminiApiKeyAvailable && flaggedTransactions.length === 0 && !isGeminiLoading && !geminiInsights && (
                    <div className="text-center py-10 text-gray-500">
                        <Cpu size={48} className="mx-auto mb-2" />
                        <p className="text-lg">No transactions flagged for audit. AI insights are generated for flagged items.</p>
                    </div>
                )}
              </div>
            )}
            
            {activeTab === 'reports' && (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">Export Reports</h2>
                <div className="space-y-4">
                  <button
                    onClick={() => handleExport('all_flagged')}
                    className="w-full sm:w-auto flex items-center justify-center bg-[var(--hnai-primary)] hover:bg-yellow-300 text-[var(--hnai-secondary-text-on-primary)] font-semibold py-3 px-6 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={flaggedTransactions.length === 0}
                  >
                    <Download size={20} className="mr-2" /> Export Auditable Transactions (Flagged)
                  </button>
                  <button
                    onClick={() => handleExport('policy_violations')}
                    className="w-full sm:w-auto flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={policyViolations.length === 0}
                  >
                    <Download size={20} className="mr-2" /> Export Policy Violations List
                  </button>
                  <button
                    onClick={() => handleExport('sampled_for_review')}
                    className="w-full sm:w-auto flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     disabled={flaggedTransactions.length === 0}
                  >
                    <Download size={20} className="mr-2" /> Export Sampled Transactions for Review
                  </button>
                </div>
                {flaggedTransactions.length === 0 && policyViolations.length === 0 && (
                     <div className="mt-6 text-center text-gray-500">
                        <FileText size={48} className="mx-auto mb-2" />
                        <p className="text-lg">No data available to export. Process a file first.</p>
                    </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <footer className="text-center mt-8 text-yellow-100 opacity-80 text-sm">
        <p>&copy; {new Date().getFullYear()} {BRAND_CONFIG.brand.organizationShortName}. {BRAND_CONFIG.brand.slogan}.</p>
        <p>Developed by Sakthi Kannan [ AI Products Engineering Team ]</p>
        <div className="mt-2 flex justify-center space-x-4">
          {Object.entries(BRAND_CONFIG.brand.socialMedia).map(([platform, url]) => {
            const IconComponent = socialIcons[platform.toLowerCase()] || Globe;
            return (
              <a 
                key={platform} 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label={BRAND_CONFIG.brand.organizationShortName + ' on ' + platform}
                className="hover:text-[var(--hnai-primary)] transition-colors"
              >
                <IconComponent size={20} />
              </a>
            );
          })}
        </div>
      </footer>
    </div>
  );
};

export default App;