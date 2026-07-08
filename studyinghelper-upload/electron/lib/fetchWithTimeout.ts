export function fetchWithTimeout(url: string, init?: RequestInit, ms = 12_000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('请求超时（网络不可达或响应过慢）')), ms)
    fetch(url, init)
      .then(r => { clearTimeout(timer); resolve(r) })
      .catch(e => { clearTimeout(timer); reject(e) })
  })
}
