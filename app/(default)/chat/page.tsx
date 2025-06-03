'use client';

import { useEffect, useState } from 'react';
import SidebarLayout from '@/components/ui/sidebar-layout';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DocumentTextIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import MessagePage from './message-page';

interface ProcessStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed';
  description?: string;
  expandable?: boolean;
  expanded?: boolean;
}

interface ReviewResult {
  序号: number;
  评审材料原文: string;
  评审点: string;
  合理性评估: string;
}

export default function Chat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get('reviewId');

  // 文件信息
  const [fileInfo] = useState({
    name: '电网项目可研报告.pdf',
    size: '360KB',
  });

  // 处理步骤
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    {
      id: 'upload',
      title: '正在上传文件至智能体',
      status: 'completed',
    },
    {
      id: 'parse',
      title: '正在进行文件解析',
      status: 'completed',
    },
    {
      id: 'think',
      title: '思考过程',
      status: 'processing',
      description:
        '本次项目报告《后续上传文件名》，经分析为XX专业评审项目，根据XX专业项目评审需求，结合上传的评审材料与知识库文档材料，生成本项目评审点。然后基于生成的评审点与评审资料逐一进行比对分析，生成评审结论。',
      expandable: true,
      expanded: true,
    },
    {
      id: 'retrieve',
      title: '正在检索主要相关评审依据文件，生成本项目相关评审点',
      status: 'processing',
    },
    {
      id: 'review',
      title: '正在基于上述评审点，针对评审材料进行逐项评审',
      status: 'pending',
    },
  ]);

  // 评审结果数据
  const [reviewResults] = useState<ReviewResult[]>([
    {
      序号: 1,
      评审材料原文: '变电站场地采用砼石镇设：当场地长宽或高度',
      评审点: '项目内容未明确场地设计材料和技术方案，无',
      合理性评估: '项目内容未明确场',
    },
  ]);

  // 控制步骤展开/收起
  const toggleStepExpansion = (stepId: string) => {
    setProcessSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, expanded: !step.expanded } : step))
    );
  };

  // 获取步骤状态图标
  const getStepIcon = (status: ProcessStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      default:
        return null;
    }
  };

  return (
    <SidebarLayout>
      <div className="min-h-full">
        <div className="max-w-[780px] mx-auto">
          {/* 页面标题 */}
          <div className="flex items-center mb-6 justify-center gap-2 h-[64px]">
            <img src="/images/file.svg" alt="logo" width={20} height={20} />
            <h1 className="text-2xl font-bold text-gray-800">电网评审智能体</h1>
          </div>

          {/* 文件信息区域 */}
          <div className="flex justify-end">
            <div className="w-[340px] bg-[#F9F9F9] rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white text-xs font-bold">PDF</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{fileInfo.name}</h3>
                    <p className="text-sm text-gray-500">{fileInfo.size}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end text-gray-600 mb-6">
            <div className="w-fit  bg-[#F9F9F9] p-4 rounded-2xl">
              作为电网智能评审专家，请对上传项目材料进行评审
            </div>
          </div>

          {/* 处理过程区域 */}
          <div className="mb-6">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">已接受到你的任务，我立即开始处理...</div>

              {processSteps.map((step) => (
                <div key={step.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">{getStepIcon(step.status)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{step.title}</span>
                      {step.expandable && (
                        <button
                          onClick={() => toggleStepExpansion(step.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {step.expanded ? (
                            <ChevronUpIcon className="w-4 h-4" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {step.description && step.expanded && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 评审结果区域 */}
          <div className="">
            <MessagePage />
          </div>

          <div className="py-16">
            <img src="/images/chat_input_bg.svg" alt="" className="w-full" />
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
