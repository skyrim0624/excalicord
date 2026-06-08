# 开发日志

## 2026-06-07 AI 原型草图工具首版

- [决策]: 在 Excalicord 基础上保留 Excalidraw 白板能力，首版产品方向改为“给 AI Agent 理解的低保真原型草图工具”。
- [进展]: 首屏改成桌面顶栏感的浮窗工作台，包含左侧绘制工具、中央 Excalidraw 画布、右侧 iPhone/Web/弹窗模板，以及“复制给 AI”和“导出”动作。
- [进展]: 移除登录、录制、摄像头、美颜、AI avatar 作为首屏主流程；旧模块源码暂时保留。
- [验证]: `npm run build` 通过；桌面与窄屏浏览器检查通过；结果记录在 `design-qa.md`。
- [踩坑]: npm 默认缓存有权限问题，本轮安装改用项目内临时缓存完成，缓存已清理。

## 2026-06-07 全屏工作台修正

- [进展]: 用户指出界面外层有问题后，去掉伪桌面顶栏和内嵌窗口感，改为真正占满可用区域的工具工作台。
- [进展]: Excalidraw 初始化后自动 fit 全部 starter 元素，避免只看到 iPhone 模板、右侧和底部出现大面积空白。
- [验证]: `npm run build` 通过；桌面浏览器复查通过，无当前 app 控制台错误。

## 2026-06-08 Cloudflare Pages 上线

- [进展]: 创建 Cloudflare Pages 项目 `ai-prototype-sketch-tool`，生产分支设置为 `main`。
- [进展]: 将本地 `dist` 直接上传到 Cloudflare Pages，正式地址为 `https://ai-prototype-sketch-tool.pages.dev/`。
- [验证]: `npm run build` 通过；Cloudflare 部署 `bcc0259e-c252-4e07-a54f-1a84e27bdcaf` 为 Production / main；正式域名与部署域名均返回 `200`。
- [决策]: 将 Wrangler 固定为开发依赖，方便后续继续从本地直接部署 Pages。
