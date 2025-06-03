'use client';

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface SSEMessage {
  type: string;
  chunk: string;
  rule?: string;
}

interface ContentMessage {
  id: number;
  content: string;
  rule?: string;
  timestamp: string;
}

interface ParsedContent {
  relatedText: string;
  originalRegulation: string;
  complianceAssessment: {
    detailedAnalysis: string;
    specialSituations: string;
  };
  conclusion: string;
}

export default function MessagePage() {
  const [messages, setMessages] = useState<ContentMessage[]>([]);
  const [currentContent, setCurrentContent] = useState('');
  const [currentRule, setCurrentRule] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const searchParams = useSearchParams();
  const reviewId = searchParams.get('reviewId') || 'default-review-id';

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;
  const totalPages = Math.ceil(messages.length / itemsPerPage);

  // 分页控制函数
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // 统计评审结论
  const getReviewStatistics = () => {
    let notCompliant = 0; // 不符合
    let pending = 0; // 待定
    let compliant = 0; // 符合

    messages.forEach((message, index) => {
      const parsedContent = parseMessageContent(message.content);
      const conclusion = parsedContent.conclusion.toLowerCase();
      
      console.log(`评审项 ${index + 1} 结论:`, parsedContent.conclusion);
      
      // 检查结论中的关键词
      if (conclusion.includes('不符合') || conclusion.includes('不合规') || conclusion.includes('违反')) {
        notCompliant++;
        console.log(`  -> 归类为: 不符合`);
      } else if (conclusion.includes('待定') || conclusion.includes('需要') || conclusion.includes('建议')) {
        pending++;
        console.log(`  -> 归类为: 待定`);
      } else if (conclusion.includes('符合') || conclusion.includes('通过') || conclusion.includes('合规')) {
        compliant++;
        console.log(`  -> 归类为: 符合`);
      } else {
        // 如果结论字段为空或不包含明确关键词，默认为待定
        pending++;
        console.log(`  -> 归类为: 待定(默认)`);
      }
    });

    console.log(`统计结果: 不符合${notCompliant}条, 待定${pending}条, 符合${compliant}条`);
    return { notCompliant, pending, compliant };
  };

  // 生成页码数组
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 5) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        if (totalPages > 5) {
          pages.push('...');
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // 使用 useRef 来跟踪实时状态，避免异步更新问题
  const collectingRef = useRef(false);
  const currentContentRef = useRef('');
  const currentRuleRef = useRef('');

  // 用于自动滚动到最新内容的ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const collectingContentRef = useRef<HTMLDivElement>(null);

  // 简单的markdown解析函数
  const parseMarkdown = (content: string) => {
    if (!content || content.trim() === '') return '';

    let parsed = content;

    // 处理 ```markdown ``` 代码块
    parsed = parsed.replace(/```markdown\n([\s\S]*?)```/g, (match, code) => {
      return `<div class="markdown-content">${parseBasicMarkdown(code.trim())}</div>`;
    });

    // 处理其他代码块
    parsed = parsed.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const langLabel = lang ? `<div class="text-xs text-gray-600 mb-1">${lang}</div>` : '';
      return `<div class="code-block">${langLabel}<pre class="bg-gray-100 p-2 rounded text-xs overflow-x-auto"><code class="font-mono">${escapeHtml(
        code.trim()
      )}</code></pre></div>`;
    });

    // 处理基本markdown格式
    parsed = parseBasicMarkdown(parsed);

    return parsed;
  };

  // HTML转义函数
  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // 解析基本markdown格式
  const parseBasicMarkdown = (content: string) => {
    let parsed = content;

    // 标题
    parsed = parsed.replace(/^# (.*$)/gm, '<h1 class="font-bold text-gray-900">$1</h1>');
    parsed = parsed.replace(/^## (.*$)/gm, '<h2 class="font-semibold text-gray-800">$1</h2>');
    parsed = parsed.replace(/^### (.*$)/gm, '<h3 class="font-medium text-gray-700">$1</h3>');

    // 粗体
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // 斜体
    parsed = parsed.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // 处理列表
    const lines = parsed.split('\n');
    let inList = false;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^- /)) {
        if (!inList) {
          result.push('<ul class="ml-2">');
          inList = true;
        }
        result.push(`<li class="list-disc">${line.substring(2)}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        if (line.trim() !== '') {
          result.push(line);
        } else if (result.length > 0 && result[result.length - 1] !== '<br/>') {
          result.push('<br/>');
        }
      }
    }

    if (inList) {
      result.push('</ul>');
    }

    // 处理段落
    parsed = result.join('\n');
    parsed = parsed.replace(/\n/g, '<br/>');

    return parsed;
  };

  // 解析消息内容的函数
  const parseMessageContent = (content: string): ParsedContent => {
    const result: ParsedContent = {
      relatedText: '',
      originalRegulation: '',
      complianceAssessment: {
        detailedAnalysis: '',
        specialSituations: '',
      },
      conclusion: '',
    };

    // 按照markdown标题来分割内容
    const sections = content.split(/^#\s+/m).filter(Boolean);

    sections.forEach((section) => {
      const lines = section.trim().split('\n');
      const title = lines[0]?.toLowerCase().trim();
      const contentText = lines.slice(1).join('\n').trim();

      if (title.includes('关联文本') || title.includes('related')) {
        result.relatedText = contentText;
      } else if (
        title.includes('条例原文') ||
        title.includes('原文') ||
        title.includes('regulation')
      ) {
        result.originalRegulation = contentText;
      } else if (
        title.includes('合规性评估') ||
        title.includes('评估') ||
        title.includes('compliance')
      ) {
        // 如果是合规性评估，进一步解析详细分析和特殊情况说明
        const subSections = contentText.split(/^##\s+/m).filter(Boolean);

        if (subSections.length > 1) {
          // 有子标题，按子标题分割
          subSections.forEach((subSection) => {
            const subLines = subSection.trim().split('\n');
            const subTitle = subLines[0]?.toLowerCase().trim();
            const subContent = subLines.slice(1).join('\n').trim();

            if (subTitle.includes('详细分析') || subTitle.includes('分析')) {
              result.complianceAssessment.detailedAnalysis = subContent;
            } else if (subTitle.includes('特殊情况') || subTitle.includes('说明')) {
              result.complianceAssessment.specialSituations = subContent;
            } else {
              // 默认放入详细分析
              if (result.complianceAssessment.detailedAnalysis === '') {
                result.complianceAssessment.detailedAnalysis = subContent;
              }
            }
          });
        } else {
          // 没有子标题，整个内容作为详细分析
          result.complianceAssessment.detailedAnalysis = contentText;
        }
      } else if (
        title.includes('特殊情况') ||
        title.includes('说明') ||
        title.includes('special')
      ) {
        result.complianceAssessment.specialSituations = contentText;
      } else if (title.includes('结论') || title.includes('conclusion')) {
        result.conclusion = contentText;
      } else {
        // 如果没有明确的标题匹配，尝试其他方式解析
        if (result.relatedText === '' && contentText.length > 0) {
          result.relatedText = contentText;
        }
      }
    });

    // 如果没有按标题分割成功，尝试按其他方式解析
    if (
      result.relatedText === '' &&
      result.originalRegulation === '' &&
      result.complianceAssessment.detailedAnalysis === '' &&
      result.complianceAssessment.specialSituations === '' &&
      result.conclusion === ''
    ) {
      // 查找特定的内容模式
      const patterns = [
        { key: 'relatedText', patterns: ['关联文本', '相关内容', '背景信息'] },
        { key: 'originalRegulation', patterns: ['条例原文', '原文内容', '第.*条'] },
        { key: 'detailedAnalysis', patterns: ['详细分析', '合规性评估', '评估结果'] },
        { key: 'specialSituations', patterns: ['特殊情况', '注意事项', '说明'] },
        { key: 'conclusion', patterns: ['结论', '总结', '建议'] },
      ];

      patterns.forEach(({ key, patterns: patternList }) => {
        patternList.forEach((pattern) => {
          const regex = new RegExp(
            `${pattern}[：:]?\\s*([\\s\\S]*?)(?=${patterns
              .map((p) => p.patterns)
              .flat()
              .join('|')}|$)`,
            'i'
          );
          const match = content.match(regex);
          if (match && match[1]?.trim()) {
            if (key === 'detailedAnalysis') {
              result.complianceAssessment.detailedAnalysis = match[1].trim();
            } else if (key === 'specialSituations') {
              result.complianceAssessment.specialSituations = match[1].trim();
            } else {
              result[key as keyof Omit<ParsedContent, 'complianceAssessment'>] = match[1].trim();
            }
          }
        });
      });
    }

    // 如果仍然无法解析，将整个内容放入关联文本
    if (
      result.relatedText === '' &&
      result.originalRegulation === '' &&
      result.complianceAssessment.detailedAnalysis === '' &&
      result.complianceAssessment.specialSituations === '' &&
      result.conclusion === ''
    ) {
      result.relatedText = content;
    }

    return result;
  };

  // 自动滚动到最新内容的函数
  const scrollToLatest = () => {
    // 如果正在收集内容，滚动到收集区域
    if (collectingRef.current && collectingContentRef.current) {
      collectingContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
    // 否则滚动到消息列表底部
    else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  };

  // 监听消息变化和收集状态变化，自动滚动
  useEffect(() => {
    scrollToLatest();
  }, [messages, currentContent]);

  // 监听传输完成状态，滚动到表格
  useEffect(() => {
    if (isCompleted && messages.length > 0) {
      const timer = setTimeout(() => {
        const tableElement = document.querySelector('table');
        if (tableElement) {
          tableElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 500); // 延迟500ms确保DOM更新完成

      return () => clearTimeout(timer);
    }
  }, [isCompleted, messages.length]);

  const startSSEStream = () => {
    setMessages([]);
    setCurrentContent('');
    setCurrentRule('');
    setIsCompleted(false);

    // 重置 ref 状态
    collectingRef.current = false;
    currentContentRef.current = '';
    currentRuleRef.current = '';

    const ctrl = new AbortController();
    const data = new FormData();
    data.append('review_id', reviewId);

    fetchEventSource('/api/sse', {
      method: 'POST',
      headers: {
        // 不要手动设置 Content-Type，浏览器会自动设置 multipart/form-data
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        Connection: 'keep-alive',
        // 强力禁用各种缓冲的请求头
        'X-Accel-Buffering': 'no', // Nginx 禁用缓冲
        'X-Proxy-Buffering': 'no', // 代理禁用缓冲
        'X-Nginx-Buffering': 'no', // Nginx 禁用缓冲 (备用)
        'Proxy-Buffering': 'no', // 通用代理禁用缓冲
        'X-Stream': 'true', // 标识为流式请求
        'X-Real-Time': 'true', // 标识为实时请求
      },
      body: data,
      signal: ctrl.signal,

      onopen: async function () {
        console.log('SSE connection opened');
      },

      onmessage: function (event) {
        try {
          const messageData: SSEMessage = JSON.parse(event?.data || '{}');

          switch (messageData.type) {
            case 'connection':
              console.log('SSE连接建立:', messageData.chunk);
              break;

            case 'start':
              console.log('🟢 START - 开始新的消息块:', messageData.rule);
              // 开始收集新的内容块
              const newRule = messageData.rule || '';

              setCurrentContent('');
              setCurrentRule(newRule);

              // 同步更新 ref 状态
              collectingRef.current = true;
              currentContentRef.current = '';
              currentRuleRef.current = newRule;

              console.log('🔧 开始收集新内容块，规则:', newRule);
              break;

            case 'content':
              // 只有在收集状态下才累积 content 类型的内容
              if (collectingRef.current) {
                // 累积 content 类型的 chunk 内容
                const newContent = currentContentRef.current + messageData.chunk;
                currentContentRef.current = newContent;

                setCurrentContent(newContent);
                console.log('📝 CONTENT - 累积内容, 当前长度:', newContent.length);
              }
              break;

            case 'end':
              console.log('🔴 END - 消息块结束');
              // 使用 ref 检查实时状态和内容
              if (collectingRef.current) {
                const finalContent = currentContentRef.current;
                const finalRule = currentRuleRef.current;

                console.log('✅ 完成收集 - 内容长度:', finalContent.length);

                // 将完整的内容块添加到消息列表
                const newMessage: ContentMessage = {
                  id: Date.now() + Math.random(),
                  content: finalContent,
                  rule: finalRule,
                  timestamp: new Date().toLocaleTimeString(),
                };
                setMessages((prev) => [...prev, newMessage]);

                // 重置收集状态
                setCurrentContent('');
                setCurrentRule('');

                // 同步重置 ref 状态
                collectingRef.current = false;
                currentContentRef.current = '';
                currentRuleRef.current = '';

                console.log('🧹 状态已重置');
              }
              break;

            default:
              // 忽略其他类型的消息
              if (messageData.type !== 'error') {
                console.log('🔍 忽略的消息类型:', messageData.type);
              }
          }
        } catch (parseError) {
          console.error('JSON解析错误:', parseError);
        }
      },

      onerror: function (error) {
        console.error('SSE error:', error);
      },

      onclose: function () {
        console.log('SSE 传输完成');
        setIsCompleted(true);
      },
    });

    return () => {
      ctrl.abort();
    };
  };

  useEffect(() => {
    // 自动开始流传输
    const cleanup = startSSEStream();
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen  p-6">
      {/* 添加markdown样式 */}
      <style jsx global>{`
        .prose h1,
        .prose h2,
        .prose h3 {
          margin-top: 0.25rem;
          margin-bottom: 0.125rem;
          line-height: 1.2;
        }
        .prose h1 {
          font-size: 0.875rem;
        }
        .prose h2 {
          font-size: 0.75rem;
        }
        .prose h3 {
          font-size: 0.75rem;
        }
        .prose p {
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
          line-height: 1.3;
        }
        .prose ul {
          margin-left: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .prose li {
          margin-bottom: 0.0625rem;
          font-size: 0.75rem;
          line-height: 1.3;
        }
        .prose strong {
          color: #1f2937;
        }
        .prose em {
          color: #6b7280;
        }
        .prose pre {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 0.5rem;
          overflow-x: auto;
          margin: 0.25rem 0;
        }
        .prose code {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          color: #374151;
        }
        .markdown-content {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 0.5rem;
          margin: 0.25rem 0;
          font-size: 0.75rem;
        }
        .code-block {
          margin: 0.25rem 0;
        }
        .code-block .text-xs {
          background: #e5e7eb;
          padding: 0.125rem 0.25rem;
          border-radius: 2px 2px 0 0;
          display: inline-block;
          font-size: 0.625rem;
        }
        /* 表格内的markdown样式优化 */
        td .prose {
          font-size: 0.75rem;
        }
        td .prose > *:first-child {
          margin-top: 0;
        }
        td .prose > *:last-child {
          margin-bottom: 0;
        }

        /* 表格横向滚动优化 */
        .table-container {
          position: relative;
        }
        .table-container::-webkit-scrollbar {
          height: 6px;
        }
        .table-container::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }
        .table-container::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }

        /* 表格列宽度控制 */
        .table-cell-content {
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* 统一的内容展示 */}
        <div className="mb-6">
          {/* 已完成的消息 */}
          {messages.map((message, index) => (
            <div key={message.id} className="mb-6">
              <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
                {message.content}
              </pre>
            </div>
          ))}

          {/* 正在收集中的内容 */}
          {collectingRef.current && currentContent && (
            <div ref={collectingContentRef} className="mb-6">
              <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
                {currentContent}
                <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
              </pre>
            </div>
          )}

          {/* 消息列表底部标记，用于自动滚动 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 传输完成后的表格展示 */}
        {isCompleted && messages.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* 表格提示信息 */}
            {/* <div className="px-4 py-2 bg-blue-50 border-b border-gray-200">
              <p className="text-xs text-blue-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                表格内容较宽，可左右滑动查看完整信息
              </p>
            </div> */}
            {/* 表格容器 */}
            <div className="overflow-x-auto table-container">
              <table className="table-auto border-collapse" style={{ minWidth: '1200px' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-r border-b border-gray-300 px-4 py-3 text-left font-medium text-gray-900 w-20 min-w-[80px] first:rounded-tl-lg">
                      序号
                    </th>
                    <th className="border-r border-b border-gray-300 px-4 py-3 text-left font-medium text-gray-900 min-w-[200px] max-w-[400px]">
                      关联文本
                    </th>
                    <th className="border-r border-b border-gray-300 px-4 py-3 text-left font-medium text-gray-900 min-w-[200px] max-w-[400px]">
                      条例原文
                    </th>
                    <th className="border-r border-b border-gray-300 px-4 py-3 text-left font-medium text-gray-900 min-w-[200px] max-w-[400px]">
                      详细分析
                    </th>
                    <th className="border-r border-b border-gray-300 px-4 py-3 text-left font-medium text-gray-900 min-w-[200px] max-w-[400px]">
                      特殊情况说明
                    </th>
                    <th className="border-b border-gray-300 px-4 py-3 text-left font-medium text-gray-900 min-w-[200px] max-w-[400px] last:rounded-tr-lg">
                      结论
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {messages
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((message, index) => {
                      const parsedContent = parseMessageContent(message.content);
                      return (
                        <tr
                          key={message.id}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="border-r border-b border-gray-300 px-4 py-3 text-center font-medium text-gray-900">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="border-r border-b border-gray-300 px-4 py-3 align-top min-w-[200px] max-w-[400px]">
                            <div className="text-sm text-gray-700 leading-relaxed break-words table-cell-content">
                              {parsedContent.relatedText ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(parsedContent.relatedText),
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs italic">暂无内容</span>
                              )}
                            </div>
                          </td>
                          <td className="border-r border-b border-gray-300 px-4 py-3 align-top min-w-[200px] max-w-[400px]">
                            <div className="text-sm text-gray-700 leading-relaxed break-words table-cell-content">
                              {parsedContent.originalRegulation ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(parsedContent.originalRegulation),
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs italic">暂无内容</span>
                              )}
                            </div>
                          </td>
                          <td className="border-r border-b border-gray-300 px-4 py-3 align-top min-w-[200px] max-w-[400px]">
                            <div className="text-sm text-gray-700 leading-relaxed break-words table-cell-content">
                              {parsedContent.complianceAssessment.detailedAnalysis ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(
                                      parsedContent.complianceAssessment.detailedAnalysis
                                    ),
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs italic">暂无内容</span>
                              )}
                            </div>
                          </td>
                          <td className="border-r border-b border-gray-300 px-4 py-3 align-top min-w-[200px] max-w-[400px]">
                            <div className="text-sm text-gray-700 leading-relaxed break-words table-cell-content">
                              {parsedContent.complianceAssessment.specialSituations ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(
                                      parsedContent.complianceAssessment.specialSituations
                                    ),
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs italic">暂无内容</span>
                              )}
                            </div>
                          </td>
                          <td className="border-b border-gray-300 px-4 py-3 align-top min-w-[200px] max-w-[400px]">
                            <div className="text-sm text-gray-700 leading-relaxed break-words table-cell-content">
                              {parsedContent.conclusion ? (
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(parsedContent.conclusion),
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs italic">暂无内容</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {messages.length > itemsPerPage && (
          <div className="flex items-center justify-between py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">共 {messages.length} 项数据</div>

            <div className="flex items-center space-x-2">
              {/* 上一页按钮 */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center text-sm rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                &lt;
              </button>

              {/* 页码按钮 */}
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  disabled={page === '...'}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded font-medium ${
                    page === currentPage
                      ? 'bg-teal-600 text-white'
                      : page === '...'
                      ? 'cursor-default text-gray-400 bg-transparent border-transparent'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* 下一页按钮 */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center text-sm  rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                &gt;
              </button>
            </div>
          </div>
        )}

        {/* 评审结果总结 */}
        {isCompleted && messages.length > 0 && (
          <div className="bg-white rounded-lg mb-6">
            <div className="space-y-4">
              <div className="text-gray-700 leading-relaxed">
                <p className="mb-3">已完成本项目评审工作，具体结论如下：</p>
                {(() => {
                  const { notCompliant, pending, compliant } = getReviewStatistics();
                  return (
                    <>
                      <p className="mb-1">{notCompliant}条评审项不符合，</p>
                      <p className="mb-1">{pending}条评审项待定，</p>
                      <p className="mb-1">{compliant}条评审项符合，</p>
                    </>
                  );
                })()}
                <p className="mb-4">建议评审人员结合评审结果进行二次人工复核。</p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center text-teal-600">
                  <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">已完成本次评审</span>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  人工复核
                </button>

                <button className="flex items-center px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  导出评审报告
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
