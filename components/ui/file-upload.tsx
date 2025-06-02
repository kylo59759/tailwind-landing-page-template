'use client';

import { useState, useRef, useCallback } from 'react';
import {
  PaperClipIcon,
  XMarkIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  reviewId?: string;
  projectName?: string;
}

interface FileUploadProps {
  onFilesChange?: (files: UploadedFile[]) => void;
  maxFileSize?: number; // MB
  maxFiles?: number;
  acceptedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  compact?: boolean; // 新增compact模式
  onUploadSuccess?: (record: any[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFileSize = 10, // 10MB 默认
  maxFiles = 5,
  acceptedTypes = [
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
  ],
  multiple = true,
  disabled = false,
  className = '',
  compact = false, // 默认不是compact模式
  onUploadSuccess,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // 验证文件
  const validateFile = useCallback(
    (file: File): string | null => {
      // 检查文件大小
      if (file.size > maxFileSize * 1024 * 1024) {
        return `文件大小不能超过 ${maxFileSize}MB`;
      }

      // 检查文件类型
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.some((type) => extension === type.toLowerCase())) {
        return `不支持的文件类型：${extension}`;
      }

      return null;
    },
    [maxFileSize, acceptedTypes]
  );

  // 真实文件上传
  const uploadFile = useCallback(async (fileItem: UploadedFile): Promise<void> => {
    const formData = new FormData();
    formData.append('file', fileItem.file);

    try {
      // 开始上传，设置初始进度
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f))
      );

      const response = await fetch('/api/review/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '上传失败' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // 上传成功
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                status: 'success',
                progress: 100,
                // 可以存储服务器返回的额外信息
                reviewId: result.review_id,
                projectName: result.project_name,
              }
            : f
        )
      );

      console.log('文件上传成功:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败，请重试';

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id
            ? {
                ...f,
                status: 'error',
                error: errorMessage,
                progress: 0,
              }
            : f
        )
      );

      console.error('文件上传失败:', error);
    }
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || disabled) return;

      setError('');

      // 检查文件数量限制
      if (uploadedFiles.length + files.length > maxFiles) {
        setError(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }

      const newFiles: UploadedFile[] = [];
      const uploadFiles: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validationError = validateFile(file);

        if (validationError) {
          setError(validationError);
          continue;
        }

        // 检查重复文件
        const isDuplicate = uploadedFiles.some(
          (f) => f.name === file.name && f.size === formatFileSize(file.size)
        );
        if (isDuplicate) {
          setError(`文件 "${file.name}" 已存在`);
          continue;
        }

        const fileItem: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          status: 'pending',
          progress: 0,
        };

        newFiles.push(fileItem);
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);
        onFilesChange?.(updatedFiles);

        // 开始真实上传
        for (const fileItem of newFiles) {
          try {
            const result = await uploadFile(fileItem);
            uploadFiles.push(result);
          } catch (error) {
            // 错误已在 uploadFile 中处理
            console.error('处理文件上传时出错:', error);
          }
        }
      }

      onUploadSuccess?.(uploadFiles);
    },
    [uploadedFiles, maxFiles, validateFile, formatFileSize, onFilesChange, uploadFile, disabled]
  );

  // 点击上传按钮
  const handleUploadClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // 删除文件
  const removeFile = useCallback(
    (id: string) => {
      if (disabled) return;
      const updatedFiles = uploadedFiles.filter((file) => file.id !== id);
      setUploadedFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    },
    [uploadedFiles, onFilesChange, disabled]
  );

  // 重试上传
  const retryUpload = useCallback(
    async (id: string) => {
      if (disabled) return;
      const fileItem = uploadedFiles.find((f) => f.id === id);
      if (!fileItem) return;

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: 'uploading', progress: 0, error: undefined } : f
        )
      );

      try {
        await uploadFile(fileItem);
      } catch (error) {
        // 错误已在 uploadFile 中处理
      }
    },
    [uploadedFiles, uploadFile, disabled]
  );

  // 拖拽处理
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) {
        const files = e.dataTransfer.files;
        handleFileSelect(files);
      }
    },
    [handleFileSelect, disabled]
  );

  // 获取文件图标
  const getFileIcon = useCallback((type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📑';
    return '📄';
  }, []);

  // 获取状态图标
  const getStatusIcon = useCallback((file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }, []);

  // compact模式只显示上传按钮
  if (compact) {
    return (
      <div className={className}>
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept={acceptedTypes.join(',')}
          disabled={disabled}
        />

        {/* 简洁的上传按钮 */}
        <button
          onClick={handleUploadClick}
          disabled={disabled}
          className={`px-5 py-3 rounded-2xl transition-colors border border-gray-200  ${
            disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          } flex items-center gap-2`}
          title="上传文件"
        >
          <PaperClipIcon className="h-5 w-5" />
          上传文件
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <ExclamationCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 上传文件按钮 */}
      <div className="mb-4">
        <button
          onClick={handleUploadClick}
          disabled={disabled}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <PaperClipIcon className="h-4 w-4" />
          上传文件
        </button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept={acceptedTypes.join(',')}
        disabled={disabled}
      />

      {/* 拖拽上传区域 */}
      {uploadedFiles.length === 0 && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            disabled
              ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
              : isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!disabled ? handleUploadClick : undefined}
        >
          <DocumentIcon
            className={`h-12 w-12 mx-auto mb-4 ${disabled ? 'text-gray-300' : 'text-gray-400'}`}
          />
          <p className={`mb-2 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
            {disabled ? '上传功能已禁用' : '拖拽文件到此处或点击选择文件'}
          </p>
          {!disabled && (
            <>
              <p className="text-xs text-gray-400 mt-2">支持格式：{acceptedTypes.join(', ')}</p>
              <p className="text-xs text-gray-400">
                最大文件大小：{maxFileSize}MB，最多 {maxFiles} 个文件
              </p>
            </>
          )}
        </div>
      )}

      {/* 已上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            已上传文件 ({uploadedFiles.length}/{maxFiles})：
          </h3>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <span className="text-lg">{getFileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  {getStatusIcon(file)}
                </div>
                <p className="text-xs text-gray-500">{file.size}</p>

                {/* 进度条 */}
                {file.status === 'uploading' && file.progress !== undefined && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{Math.round(file.progress)}%</p>
                  </div>
                )}

                {/* 错误信息 */}
                {file.status === 'error' && file.error && (
                  <p className="text-xs text-red-500 mt-1">{file.error}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {/* 重试按钮 */}
                {file.status === 'error' && (
                  <button
                    onClick={() => retryUpload(file.id)}
                    disabled={disabled}
                    className="p-1 text-blue-500 hover:text-blue-700 transition-colors disabled:opacity-50"
                    title="重试上传"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                )}

                {/* 删除按钮 */}
                <button
                  onClick={() => removeFile(file.id)}
                  disabled={disabled || file.status === 'uploading'}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  title="删除文件"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* 添加更多文件按钮 */}
          {uploadedFiles.length < maxFiles && (
            <button
              onClick={handleUploadClick}
              disabled={disabled}
              className={`w-full p-3 border-2 border-dashed rounded-lg text-sm transition-colors ${
                disabled
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              + 添加更多文件
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
