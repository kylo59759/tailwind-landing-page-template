'use client';

import { useEffect, useState } from 'react';
import SidebarLayout from '@/components/ui/sidebar-layout';
import FileUpload, { UploadedFile } from '@/components/ui/file-upload';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  PaperClipIcon,
  ArrowUpIcon,
  SparklesIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SelectedAgent {
  id: string;
  name: string;
  color: string;
  displayText: string;
}

export default function Home() {
  const router = useRouter();
  const [displayText, setDisplayText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<SelectedAgent[]>([]);
  const [successUploadedFiles, setSuccessUploadedFiles] = useState<any[]>([]);
  const intelligentAgents = [
    {
      name: '电网评审智能体',
      icon: SparklesIcon,
      color: 'bg-orange-100 text-orange-600',
      tagColor: 'bg-blue-100 text-blue-800',
      displayText: `作为电网评审智能体，请对上传项目材料进行评审。`,
    },
    {
      name: '电网预算智能体',
      icon: CurrencyDollarIcon,
      color: 'bg-red-100 text-red-600',
      tagColor: 'bg-red-100 text-red-800',
      displayText: `作为电网预算智能体，请对上传项目材料进行预算。`,
    },
    {
      name: '文档生成智能体',
      icon: DocumentTextIcon,
      color: 'bg-blue-100 text-blue-600',
      tagColor: 'bg-green-100 text-green-800',
      displayText: `作为文档生成智能体，请对上传项目材料进行文档生成。`,
    },
  ];

  const recommendedQuestions = [
    '下管线如何统筹规划？',
    '初步设计评审需要哪些关键要件？',
    '场地平整边界线如何确定？',
    '总图评审中，地下管线与沟道布置是否考虑了近期期结合原则？',
    '柴油机起速如何保护？',
  ];

  // 处理智能体选择
  const handleAgentSelect = (agent: (typeof intelligentAgents)[0]) => {
    const agentTag: SelectedAgent = {
      id: Math.random().toString(36).substr(2, 9),
      name: agent.name,
      color: agent.tagColor,
      displayText: agent.displayText,
    };

    setSelectedAgents((prev) => [...prev, agentTag]);
    // setDisplayText('作为电网智能评审专家，请对上传项目材料进行评审。');
  };

  // 移除智能体标签
  const removeAgent = (id: string) => {
    setSelectedAgents((prev) => prev.filter((agent) => agent.id !== id));
    // if (selectedAgents.length === 1) {
    //   setDisplayText('');
    // }
  };

  // 处理文件上传变化
  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    console.log('上传的文件:', files);
  };

  const handleUploadSuccess = (files: any[]) => {
    console.log('上传成功:  fuzujian', files);
    setSuccessUploadedFiles(files);
  };

  // 处理发送消息
  const handleSendMessage = () => {
    if (successUploadedFiles.length > 0) {
      console.log('发送消息:', displayText);
      console.log('选择的智能体:', selectedAgents);
      console.log('附带文件:', uploadedFiles);
      // 这里可以添加发送逻辑、

      console.log(successUploadedFiles[0], 'uploadedFiles[0].review_id');

      // 带参数跳转
      router.push(`/chat?reviewId=${successUploadedFiles[0].review_id}`);
    } else {
      console.log('请先上传文件');
      toast.warning('请先上传文件', {
        description: '请先上传文件后再发送消息',
      });
    }
  };

  // 获取文件类型图标
  const getFileTypeIcon = (fileName: string, fileType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      return (
        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">PDF</span>
        </div>
      );
    }

    if (['doc', 'docx'].includes(extension || '')) {
      return (
        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">DOC</span>
        </div>
      );
    }

    if (['xls', 'xlsx'].includes(extension || '')) {
      return (
        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">XLS</span>
        </div>
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return (
        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">IMG</span>
        </div>
      );
    }

    return (
      <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
        <span className="text-white text-xs font-bold">FILE</span>
      </div>
    );
  };

  return (
    <SidebarLayout>
      <div className="min-h-full flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-4xl mx-auto">
          {/* 主标题 */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-normal text-gray-800 mb-12">你好，欢迎使用智能评审系统</h1>

            {/* 输入展示区域容器 */}
            <div className="mx-auto border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
              {/* 已上传文件展示 */}
              {uploadedFiles.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-4">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-4 bg-[#f9f9f9] rounded-lg mb-3 max-w-xs"
                    >
                      {getFileTypeIcon(file.name, file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{file.size}</p>
                      </div>
                      <button
                        onClick={() => {
                          const updatedFiles = uploadedFiles.filter((f) => f.id !== file.id);
                          setUploadedFiles(updatedFiles);
                          // handleFilesChange(updatedFiles);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 智能体标签 */}
              {selectedAgents.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedAgents.map((agent, index) => (
                    <div className="flex items-center gap-2" key={agent.name + index}>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-teal-600`}
                      >
                        <span>{agent.name}</span>
                        <button
                          onClick={() => removeAgent(agent.id)}
                          className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0 text-[#303133]">{agent.displayText}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 静态展示区域 */}
              <div className="relative">
                <div className="w-full min-h-[120px] py-5 pb-8 text-left text-lg rounded-2xl bg-white text-[#909399]">
                  {selectedAgents.length > 0 ? (
                    ''
                  ) : (
                    <div className="pb-4">请给我下达一个任务...</div>
                  )}
                </div>

                {/* 底部按钮区域 */}
                <div className="bottom-4 left-4 right-4 flex items-center justify-between">
                  {/* 左侧上传按钮 */}
                  <FileUpload
                    onFilesChange={handleFilesChange}
                    onUploadSuccess={handleUploadSuccess}
                    maxFileSize={20}
                    maxFiles={5}
                    acceptedTypes={['.pdf']}
                    multiple={true}
                    compact={true}
                  />

                  {/* 右侧发送按钮 */}
                  <div>
                    <button
                      onClick={handleSendMessage}
                      className="cursor-pointer p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-colors shadow-sm"
                    >
                      <ArrowUpIcon className="h-5 w-5 stroke-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 推荐智能体 */}
          <div className="mb-16">
            <h2 className="text-lg font-normal text-gray-800 mb-6">推荐智能体：</h2>
            <div className="flex flex-wrap gap-4">
              {intelligentAgents.map((agent, index) => (
                <button
                  key={agent.name}
                  onClick={() => handleAgentSelect(agent)}
                  className="inline-flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-full hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  <div className={`p-2 rounded-full ${agent.color}`}>
                    <agent.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 推荐问题 */}
          <div>
            <h2 className="text-lg font-normal text-gray-800 mb-6">推荐问题：</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedQuestions.map((question, index) => (
                <Link key={index} href="/chat">
                  <button className="flex items-center gap-4 p-5 text-left bg-white border border-gray-200 rounded-full hover:shadow-lg hover:border-gray-200 transition-all duration-200 group w-full">
                    <div className="flex-shrink-0">
                      <SparklesIcon className="h-5 w-5 text-teal-600 group-hover:text-teal-700" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-relaxed">
                      {question}
                    </span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
