export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get('review_id');
  
  if (!reviewId) {
    return new Response('review_id parameter is required', { status: 400 });
  }

  try {
    // 直接代理到后端服务器，保持流式特性
    const backendUrl = `http://172.16.1.47:5000/review?review_id=${reviewId}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        // 传递原始请求的一些头部
        'User-Agent': request.headers.get('user-agent') || 'Next.js-Proxy',
      },
      signal: request.signal, // 支持请求取消
    });

    if (!response.ok) {
      return new Response(`Backend error: ${response.status} ${response.statusText}`, {
        status: response.status,
      });
    }

    // 检查是否为流式响应
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      console.warn('Backend did not return SSE content type:', contentType);
    }

    // 创建新的响应，直接传递后端的流式数据
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Connection', 'keep-alive');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 禁用各种可能的缓冲
    headers.set('X-Accel-Buffering', 'no');
    headers.set('X-Proxy-Buffering', 'no');
    headers.set('Proxy-Buffering', 'no');

    // 直接返回后端的流式响应体
    return new Response(response.body, {
      status: response.status,
      headers: headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const reviewId = formData.get('review_id');
    
    if (!reviewId) {
      return new Response('review_id parameter is required', { status: 400 });
    }

    // 代理 POST 请求到后端
    const backendUrl = 'http://172.16.1.47:5000/review';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      signal: request.signal,
    });

    if (!response.ok) {
      return new Response(`Backend error: ${response.status} ${response.statusText}`, {
        status: response.status,
      });
    }

    // 设置 SSE 响应头
    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Connection', 'keep-alive');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('X-Accel-Buffering', 'no');
    headers.set('X-Proxy-Buffering', 'no');
    headers.set('Proxy-Buffering', 'no');

    return new Response(response.body, {
      status: response.status,
      headers: headers,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
} 