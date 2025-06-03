// SSE 流式数据处理函数
async function startSSEStream() {
  const ctrl = new AbortController();

  // 消息计数器和时间追踪
  let messageCount = 0;
  let startTime = Date.now();
  let lastMessageTime = startTime;

  console.log('🚀 开始使用原生 fetch 测试 SSE 连接...');

  try {
    // 发送请求
    const response = await fetch(
      'http://172.16.1.47:5000/review?review_id=9cc80c0a-62c8-4ae4-afb8-918298a2836b',
      {
        method: 'GET',
        signal: ctrl.signal,
      }
    );

    // 检查响应状态
    console.log('✅ 连接已建立');
    console.log('📊 Response status:', response.status, response.statusText);
    console.log('📋 Content-Type:', response.headers.get('content-type'));
    console.log('📏 Content-Length:', response.headers.get('content-length'));

    if (!response.ok) {
      throw new Error(`❌ HTTP错误: ${response.status} ${response.statusText}`);
    }

    // 检查是否为流式响应
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      console.warn('⚠️ 响应类型不是 text/event-stream，但继续处理...');
      console.warn('📄 实际类型:', contentType);
    }

    // 获取流读取器
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('❌ 无法获取响应流读取器');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    console.log('🔄 开始读取流数据...');
    console.log('===================================');

    // 处理消息的函数
    function processMessage(eventData) {
      messageCount++;
      const now = Date.now();
      const elapsed = now - startTime;
      const interval = messageCount > 1 ? now - lastMessageTime : 0;
      const timestamp = new Date(now).toLocaleTimeString() + '.' + (now % 1000);

      // 详细的调试信息
      console.log(`=== 第 ${messageCount} 条消息 ===`);
      console.log(`🕐 时间戳: ${timestamp}`);
      console.log(`⏱️  从开始: ${elapsed}ms`);
      console.log(`⏰ 消息间隔: ${interval}ms ${interval < 10 ? '⚠️ 缓冲问题!' : '✅ 正常'}`);
      console.log(`📨 原始数据:`, eventData);
      console.log(`📏 数据长度:`, eventData?.length);

      // 尝试解析JSON
      try {
        const messageData = JSON.parse(eventData);
        console.log(`🎯 JSON解析成功:`, messageData);
        console.log(`📌 消息类型:`, messageData.type);

        if (messageData.type === 'content') {
          console.log(`📝 内容块:`, JSON.stringify(messageData.chunk));
        } else if (messageData.type === 'start') {
          console.log(`🟢 开始块:`, messageData.rule);
        } else if (messageData.type === 'end') {
          console.log(`🔴 结束块`);
        }
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError.message);
        console.log('🔍 原始内容:', JSON.stringify(eventData));

        // 如果不是JSON，检查是否包含有用信息
        if (eventData.includes('type') || eventData.includes('chunk')) {
          console.log('🎯 检测到可能的消息关键字');
        }
      }

      lastMessageTime = now;
      console.log('---');
    }

    // 逐字节读取流数据
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('✅ 流读取完成');
        break;
      }

      // 解码数据块
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      console.log('📥 收到数据块，长度:', chunk.length, '字节');
      console.log('📦 数据块内容:', JSON.stringify(chunk));

      // 处理 SSE 格式的数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留可能不完整的最后一行

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          continue; // 跳过空行
        }

        // 标准SSE格式: data: {...}
        if (trimmedLine.startsWith('data: ')) {
          const eventData = trimmedLine.slice(6); // 移除 'data: ' 前缀

          if (eventData.trim()) {
            processMessage(eventData);
          }
        }
        // 其他SSE字段
        else if (trimmedLine.startsWith('event: ')) {
          console.log('📌 事件类型:', trimmedLine.slice(7));
        } else if (trimmedLine.startsWith('id: ')) {
          console.log('🆔 事件ID:', trimmedLine.slice(4));
        } else if (trimmedLine.startsWith('retry: ')) {
          console.log('🔄 重试间隔:', trimmedLine.slice(7));
        }
        // 尝试直接解析JSON（如果不是标准SSE格式）
        else if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
          console.log('🎯 发现直接JSON数据');
          processMessage(trimmedLine);
        } else {
          console.log('❓ 未识别的行格式:', JSON.stringify(trimmedLine));
        }
      }
    }

    // 完成统计
    const totalTime = Date.now() - startTime;
    console.log('===================================');
    console.log('🏁 SSE传输完成');
    console.log(`📊 最终统计:`);
    console.log(`   - 总消息数: ${messageCount}`);
    console.log(`   - 总耗时: ${totalTime}ms`);
    console.log(
      `   - 平均间隔: ${messageCount > 1 ? Math.round(totalTime / (messageCount - 1)) : 0}ms`
    );

    // 缓冲诊断
    if (messageCount > 5) {
      const avgInterval = totalTime / (messageCount - 1);
      if (avgInterval < 10) {
        console.log('🚨 检测到缓冲问题！消息间隔过短，数据可能被缓冲了');
        console.log('💡 建议检查：');
        console.log('   - 后端是否使用了 flush()');
        console.log('   - Nginx 配置 proxy_buffering off');
        console.log('   - CDN 缓冲设置');
      } else {
        console.log('✅ 流式输出正常');
      }
    }
  } catch (error) {
    console.error('❌ SSE连接错误:', error);
    console.error('🔍 错误详情:', {
      message: error.message,
      name: error.name,
      type: typeof error,
    });

    // 错误类型诊断
    if (error.message) {
      if (error.message.includes('fetch')) {
        console.log('🌐 可能是网络连接问题');
      } else if (error.message.includes('parse')) {
        console.log('📄 可能是数据格式问题');
      } else if (error.message.includes('timeout')) {
        console.log('⏰ 可能是连接超时');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('🔌 服务器拒绝连接，请检查服务器是否启动');
      }
    }

    // 统计信息
    if (messageCount > 0) {
      const avgInterval = (Date.now() - startTime) / messageCount;
      console.log(`📊 错误前收到 ${messageCount} 条消息，平均间隔 ${Math.round(avgInterval)}ms`);
    }
  }
}

// 启动测试
startSSEStream();
