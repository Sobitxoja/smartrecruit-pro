import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNotification } from './NotificationProvider';
import { extractResumeData } from '../services/resumeService';

interface ResumeUploadProps {
  onDataExtracted: (data: any) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onDataExtracted }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { notify } = useNotification();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const file = acceptedFiles[0];

    try {
      const data = await extractResumeData(file);
      notify(`Successfully parsed ${file.name}`, 'success');
      onDataExtracted(data);
    } catch (error: any) {
      console.error("Resume parsing error:", error);
      const errorMessage = error.message || "Unknown error occurred";
      notify(`Failed to parse ${file.name}: ${errorMessage}`, 'error');
    } finally {
      setIsUploading(false);
    }
  }, [notify, onDataExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={`p-8 border-2 border-dashed rounded-3xl transition-all cursor-pointer text-center group ${
        isDragActive 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 animate-pulse">Analyzing resume...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">📄</div>
          <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            {isDragActive ? "Drop it here!" : "Auto-fill with Resume"}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Drag & drop your PDF/DOCX here to magically fill your profile
          </p>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
