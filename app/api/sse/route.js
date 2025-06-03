import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request) {
  const encoder = new TextEncoder();

  // 创建 TransformStream
  const stream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });
  const writer = stream.writable.getWriter();

  try {
    // 读取response.json文件
    const jsonPath = join(process.cwd(), 'app/api/sse/response.json');
    const fileContent = readFileSync(jsonPath, 'utf-8');

    // 按行分割并解析SSE数据
    const lines = fileContent.split('\n').filter((line) => line.trim().startsWith('data:'));

    // 发送初始确认消息
    const initialData = `:ok\n\nevent: message\ndata: {"type": "connection", "chunk": "SSE连接已建立"}\n\n`;
    writer.write(encoder.encode(initialData));

    let lineIndex = 0;

    // 逐行发送数据
    const sendNextLine = async () => {
      if (lineIndex < lines.length) {
        const line = lines[lineIndex].trim();

        if (line.startsWith('data:')) {
          // 提取JSON数据部分
          const jsonStr = line.substring(5).trim(); // 移除"data:"前缀

          try {
            // 验证JSON格式是否正确
            const jsonData = JSON.parse(jsonStr);

            // 按照SSE格式发送
            const sseMessage = `event: message\ndata: ${jsonStr}\n\n`;
            await writer.write(encoder.encode(sseMessage));

            console.log(
              `发送第${lineIndex + 1}行:`,
              jsonData.type,
              jsonData.chunk?.substring(0, 10) + '...'
            );
          } catch (parseError) {
            console.error('JSON解析错误:', parseError, 'Line:', line);
            // 跳过无效的JSON行
          }
        }

        lineIndex++;

        // 设置发送间隔：start类型慢一点，content类型快一点
        const currentData = JSON.parse(lines[lineIndex - 1]?.substring(5).trim() || '{}');
        const delay = currentData.type === 'start' ? 1000 : currentData.chunk === '\n' ? 200 : 50;

        setTimeout(sendNextLine, delay);
      } else {
        // 所有数据发送完毕
        const endMessage = `event: message\ndata: {"type": "end", "chunk": "数据传输完成"}\n\n`;
        await writer.write(encoder.encode(endMessage));
        await writer.close();
        console.log('SSE数据流传输完成');
      }
    };

    // 开始发送数据
    setTimeout(sendNextLine, 500);
  } catch (error) {
    console.error('读取response.json文件失败:', error);

    // 发送错误消息
    const errorMessage = `event: message\ndata: {"type": "error", "chunk": "读取数据文件失败: ${error.message}"}\n\n`;
    await writer.write(encoder.encode(errorMessage));
    await writer.close();
  }

  // 处理连接中断
  request.signal.addEventListener('abort', async () => {
    console.log('SSE连接中断');
    try {
      await writer.ready;
      await writer.close();
    } catch (closeError) {
      console.error('关闭writer时出错:', closeError);
    }
  });

  // 创建 SSE 响应
  const response = new Response(stream.readable);

  // 设置响应头，指定使用 SSE
  response.headers.set('Content-Type', 'text/event-stream');
  response.headers.set('Cache-Control', 'no-cache');
  response.headers.set('Connection', 'keep-alive');
  response.headers.set('Access-Control-Allow-Origin', '*');

  return response;
}
