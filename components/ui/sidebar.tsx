'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

// const menuItems = [
//   { name: '首页', href: '/', icon: HomeIcon },
//   { name: '用户管理', href: '/users', icon: UserIcon },
//   { name: '数据分析', href: '/analytics', icon: ChartBarIcon },
//   { name: '文档', href: '/docs', icon: DocumentTextIcon },
//   { name: '消息', href: '/messages', icon: InboxIcon },
//   { name: '设置', href: '/settings', icon: CogIcon },
// ];

const historyList = [
  '下管线如何统筹规划？',
  '如何提高柴油机启动成功率？',
  '总图评审中，地下管线与沟道布置...',
  '场地平整边界线如何确定？',
  '初步设计评审需要哪些关键要件？'
];

const bottomMenuItems = [
  { name: 'Help', icon: QuestionMarkCircleIcon },
  { name: 'Activity', icon: ClockIcon },
  { name: 'Settings', icon: CogIcon },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  return (
    <div className={`
      fixed left-0 top-0 z-40 h-full bg-white transition-all duration-300 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-80'}
      border-r border-gray-200
    `}>
      {/* 顶部工具栏 */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 bg-white">
        {!isCollapsed ? (
          <>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bars3Icon className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mx-auto"
          >
            <Bars3Icon className="h-5 w-5 text-gray-600" />
          </button>
        )}
        
        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* 新对话按钮 */}
          <div className="p-4">
            <Link href="/">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <PlusIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">新对话</span>
              </button>
            </Link>
          </div>

          {/* 历史记录 */}
          <div className="px-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              历史记录
            </h3>
            <div className="space-y-1">
              {historyList.map((item, index) => (
                <Link key={index} href="/chat">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 group">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="truncate leading-relaxed">{item}</span>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          </div>

          {/* 底部菜单 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <div className="space-y-1">
              {bottomMenuItems.map((item) => (
                <button
                  key={item.name}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-900 rounded-lg transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 折叠状态下的展开按钮 */}
      {isCollapsed && (
        <div className="p-4">
          <button
            onClick={onToggle}
            className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="展开侧边栏"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600 mx-auto" />
          </button>
        </div>
      )}
    </div>
  );
} 