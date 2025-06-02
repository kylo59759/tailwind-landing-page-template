'use client';

import { useState } from 'react';
import Sidebar from './sidebar';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 侧边栏 */}
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      
      {/* 主内容区域 */}
      <div className={`
        flex-1 flex flex-col transition-all duration-300 ease-in-out
        ${isCollapsed ? 'ml-16' : 'ml-80'}
      `}>
        {/* 主内容 */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 