
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';
import Spinner from './ui/Spinner';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setUploadedFile(file);
        onFileUpload(file);
      } else {
        alert('Invalid file type. Please upload a CSV file.');
        setUploadedFile(null);
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: isLoading,
  });

  return (
    <div className="w-full p-4 sm:p-6 md:p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
          ${isDragActive ? 'border-[var(--hnai-primary)] bg-yellow-50' : 'border-gray-300 hover:border-[var(--hnai-primary)] bg-gray-50 hover:bg-yellow-50'}
          ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        {isLoading ? (
          <>
            <Spinner />
            <p className="mt-2 text-gray-600">Processing file...</p>
          </>
        ) : uploadedFile ? (
           <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700">{uploadedFile.name}</p>
            <p className="text-sm text-gray-500">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
            <p className="mt-4 text-sm text-[var(--hnai-primary-text-on-secondary)]" style={{color: 'var(--hnai-secondary)'}}>Drop another file or click to replace.</p>
          </div>
        ) : (
          <div className="text-center">
            <UploadCloud className="w-16 h-16 text-[var(--hnai-secondary)] mx-auto mb-3" /> {/* Changed icon color */}
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop the CSV file here...' : 'Drag & drop a CSV file here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-1">.CSV files only</p>
          </div>
        )}
      </div>
      {!isLoading && !uploadedFile && (
        <p className="mt-4 text-xs text-gray-500 text-center">
          Ensure your CSV has headers: transaction_id, date, amount, account, category, vendor, policy_code
        </p>
      )}
    </div>
  );
};

export default FileUpload;