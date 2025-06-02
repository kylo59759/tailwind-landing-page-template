export const metadata = {
  title: "数据分析 - Simple",
  description: "数据分析页面",
};

import SidebarLayout from "@/components/ui/sidebar-layout";

export default function AnalyticsPage() {
  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
          <p className="text-gray-600 mt-1">查看系统的详细分析数据</p>
        </div>

        {/* 关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">页面浏览量</p>
                <p className="text-3xl font-bold text-gray-900">45,231</p>
                <p className="text-sm text-green-600">+12.5% 较上月</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">独立访客</p>
                <p className="text-3xl font-bold text-gray-900">12,543</p>
                <p className="text-sm text-green-600">+8.2% 较上月</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">转化率</p>
                <p className="text-3xl font-bold text-gray-900">3.24%</p>
                <p className="text-sm text-red-600">-2.1% 较上月</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均停留时间</p>
                <p className="text-3xl font-bold text-gray-900">2:34</p>
                <p className="text-sm text-green-600">+15.3% 较上月</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 访问趋势图 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">访问趋势</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">图表占位符</p>
                <p className="text-sm text-gray-400">这里可以集成 Chart.js 或其他图表库</p>
              </div>
            </div>
          </div>

          {/* 流量来源 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">流量来源</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">直接访问</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">45.2%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-9 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">搜索引擎</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">32.1%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-6 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">社交媒体</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">15.7%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-3 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">其他</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">7.0%</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div className="w-1 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 热门页面 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门页面</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-500">页面</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">浏览量</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">独立访客</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">跳出率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 text-sm text-gray-900">/</td>
                  <td className="py-3 text-sm text-gray-900">12,543</td>
                  <td className="py-3 text-sm text-gray-900">8,234</td>
                  <td className="py-3 text-sm text-gray-900">32.1%</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-900">/users</td>
                  <td className="py-3 text-sm text-gray-900">8,432</td>
                  <td className="py-3 text-sm text-gray-900">5,123</td>
                  <td className="py-3 text-sm text-gray-900">28.5%</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-900">/analytics</td>
                  <td className="py-3 text-sm text-gray-900">5,234</td>
                  <td className="py-3 text-sm text-gray-900">3,456</td>
                  <td className="py-3 text-sm text-gray-900">45.2%</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-900">/settings</td>
                  <td className="py-3 text-sm text-gray-900">2,134</td>
                  <td className="py-3 text-sm text-gray-900">1,567</td>
                  <td className="py-3 text-sm text-gray-900">52.3%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
} 