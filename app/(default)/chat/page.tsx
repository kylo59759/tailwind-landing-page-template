'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import SidebarLayout from '@/components/ui/sidebar-layout';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ProcessStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  content?: string;
  isExpanded?: boolean;
  isStreaming?: boolean;
}

interface ReviewData {
  sequence: number;
  reviewMaterial: string;
  reviewPoint: string;
  reasonableEvaluation: string;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const reviewId = searchParams.get('reviewId');
  const [isConnected, setIsConnected] = useState(false);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [steps, setSteps] = useState<ProcessStep[]>([
    { id: 'upload', title: '正在上传文件至智能体', status: 'pending' },
    { id: 'parse', title: '正在进行文件解析', status: 'pending' },
    { id: 'think', title: '思考过程', status: 'pending', isExpanded: false },
    {
      id: 'search',
      title: '正在检索土建相关评审依据文件，生成本项目相关评审点',
      status: 'pending',
      isExpanded: false,
    },
    {
      id: 'review',
      title: '正在基于上述评审点，针对评审材料进行逐项评审',
      status: 'pending',
      isExpanded: false,
    },
  ]);
  const [reviewResults, setReviewResults] = useState<ReviewData[]>([]);
  const [selectedTab, setSelectedTab] = useState<'不符合' | '待定' | '符合'>('不符合');
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 全局错误处理
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未处理的Promise rejection:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [steps, currentStreamingContent]);

  // 初始化SSE连接
  useEffect(() => {
    if (!reviewId) {
      return;
    }

    const controller = new AbortController();
    startSSEConnection(reviewId, controller);

    return () => {
      controller.abort();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [reviewId]);

  const updateStepStatus = (stepId: string, status: ProcessStep['status'], content?: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? {
              ...step,
              status,
              content: content || step.content,
              isStreaming: status === 'processing',
            }
          : step
      )
    );
  };

  const startSSEConnection = (reviewId: string, controller: AbortController) => {
    try {
      const url = new URL('/api/review', window.location.origin);
      const formData = new FormData();
      formData.append('review_id', reviewId);

      // 开始上传步骤
      updateStepStatus('upload', 'processing');

      fetch(url.toString(), {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: formData,
        signal: controller.signal,
      })
        .then((response) => {
          if (controller.signal.aborted) return;

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('无法获取响应流');
          }

          setIsConnected(true);

          // 完成上传，开始解析
          updateStepStatus('upload', 'completed');
          updateStepStatus('parse', 'processing');

          const processStream = async () => {
            const decoder = new TextDecoder();

            try {
              while (true) {
                if (controller.signal.aborted) break;

                const { done, value } = await reader.read();
                if (done) {
                  setIsConnected(false);
                  break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6));
                      handleSSEMessage(data);
                    } catch (parseError) {
                      console.error('解析SSE数据失败:', parseError, line);
                    }
                  }
                }
              }
            } catch (streamError) {
              if (!controller.signal.aborted) {
                console.error('读取流数据失败:', streamError);
                setIsConnected(false);
              }
            } finally {
              try {
                reader.releaseLock();
              } catch (error) {
                // 忽略释放锁时的错误
              }
            }
          };

          processStream().catch((error) => {
            if (!controller.signal.aborted) {
              console.error('处理流时发生错误:', error);
            }
          });
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          console.error('SSE连接失败:', error);
          setIsConnected(false);
        });
    } catch (error) {
      console.error('启动SSE连接失败:', error);
    }
  };

  const handleSSEMessage = (data: any) => {
    try {
      const { type, rule, chunk, message } = data;
      console.log('收到SSE消息:', data);

      switch (type) {
        case 'start':
          // 根据规则确定当前步骤
          if (rule?.includes('思考') || rule?.includes('分析')) {
            updateStepStatus('parse', 'completed');
            updateStepStatus('think', 'processing');
            setCurrentStep('think');
          } else if (rule?.includes('检索') || rule?.includes('评审点')) {
            updateStepStatus('think', 'completed');
            updateStepStatus('search', 'processing');
            setCurrentStep('search');
          } else if (rule?.includes('评审') || rule?.includes('逐项')) {
            updateStepStatus('search', 'completed');
            updateStepStatus('review', 'processing');
            setCurrentStep('review');
          }

          setCurrentStreamingContent('');
          break;

        case 'content':
          setCurrentStreamingContent((prev) => {
            const newContent = prev + (chunk || '');

            // 更新当前步骤的内容
            if (currentStep) {
              setSteps((prevSteps) =>
                prevSteps.map((step) =>
                  step.id === currentStep ? { ...step, content: newContent } : step
                )
              );
            }

            return newContent;
          });
          break;

        case 'end':
          // 完成当前步骤
          if (currentStep) {
            updateStepStatus(currentStep, 'completed', currentStreamingContent);
          }
          setCurrentStreamingContent('');
          break;

        case 'post_process_complete':
          // 所有处理完成
          updateStepStatus('review', 'completed');
          setIsConnected(false);
          setCurrentStep('');
          setCurrentStreamingContent('');
          break;

        default:
          console.log('未知消息类型:', data);
      }
    } catch (error) {
      console.error('处理SSE消息时发生错误:', error);
    }
  };

  const toggleStepExpansion = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, isExpanded: !step.isExpanded } : step))
    );
  };

  const getStepIcon = (status: ProcessStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-3 h-3 bg-teal-500 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        );
      case 'processing':
        return <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>;
      case 'error':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-300 rounded-full"></div>;
    }
  };

  return (
    <SidebarLayout>
      <div className="h-full bg-white">
        {/* 页面头部 */}
        <div className="px-8 py-6 max-w-5xl mx-auto">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-6 h-6 rounded flex items-center justify-center">
                <img src="/images/file.svg" alt="" />
              </div>
              <h1 className="text-xl font-medium text-gray-900">电网评审智能体</h1>
            </div>
          </div>

          {/* 文件信息卡片 */}
          <div className="flex justify-end mb-6">
            <div className="flex items-center gap-3 bg-[#f9f9f9]  rounded-lg px-4 py-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PDF</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">电网项目可研报告.pdf</div>
                <div className="text-xs text-gray-500">360KB</div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 ml-2">
                <span className="text-lg">×</span>
              </button>
            </div>
          </div>

          {/* 任务描述 */}
          <div className="text mb-8 flex justify-end">
            <div className="text-right text-gray-600 bg-[#f9f9f9] rounded-lg px-4 py-3">
              作为电网智能评审专家，请对上传项目材料进行评审
            </div>
          </div>

          {/* 主要内容区域 */}
          <div className="mx-auto">
            {/* 任务接收提示 */}
            <div className="mb-6">
              <p className="text-gray-700 text-base">已接受到你的任务，我立即开始处理...</p>
            </div>

            {/* 进度步骤 */}
            <div className="space-y-1">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* 连接线 */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-1.5 top-6 w-px h-6 bg-gray-200"></div>
                  )}

                  <div className="flex items-start gap-3">
                    {getStepIcon(step.status)}

                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`text-base ${
                            step.status === 'processing'
                              ? 'text-teal-600 font-medium'
                              : step.status === 'completed'
                              ? 'text-gray-900'
                              : 'text-gray-600'
                          }`}
                        >
                          {step.title}
                        </h3>

                        {step.content && (
                          <button
                            onClick={() => toggleStepExpansion(step.id)}
                            className="text-gray-400 hover:text-gray-600 ml-4"
                          >
                            {step.isExpanded ? (
                              <ChevronUpIcon className="w-4 h-4" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* 展开的内容 */}
                      {step.content && step.isExpanded && (
                        <div className="mt-3 ml-4 pl-4 border-l border-gray-200">
                          <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                            {step.content}
                            {step.isStreaming && (
                              <span className="inline-block w-1 h-4 bg-teal-500 animate-pulse ml-1"></span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 默认展开某些步骤的内容 */}
                      {step.id === 'think' && step.status === 'completed' && !step.isExpanded && (
                        <div className="mt-2 ml-4 pl-4 border-l border-gray-200">
                          <div className="text-sm text-gray-700 leading-relaxed">
                            本次项目报告《后端上传文件名》，经分析为XX专业评审项目，根据XX专业项目评审需求，结合上传的评审材料与知识库文档材料，生成本项目评审点。然后基于生成的评审点与评审资料逐一进行比对分析，生成评审结论。
                          </div>
                        </div>
                      )}

                      {/* 搜索步骤的展开内容 */}
                      {step.id === 'search' && step.status === 'completed' && !step.isExpanded && (
                        <div className="mt-2 ml-4 pl-4 border-l border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-gray-600 text-xs">🔍</span>
                            </div>
                            <span className="text-sm text-gray-500">检索相关文件中...</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            从XX专业相关评审依据文件，生成XX条相关评审点。
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 滚动锚点 */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <img src="/images/chat_input_bg.svg" alt="" className="opacity-50" />
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
