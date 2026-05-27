export default {
  async fetch(request, env) {
    // 将所有请求直接交给 Cloudflare 的原生 ASSETS 绑定去处理静态文件
    // 以后如果你想做拦截、API、边缘计算等硬核操作，可以在这上面写代码
    return env.ASSETS.fetch(request);
  },
};
