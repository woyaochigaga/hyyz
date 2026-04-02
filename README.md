# 杭艺云展前端

杭艺云展是一个围绕杭州手工艺、线上展览、匠人展示、AI 导览与内容创作流构建的 Next.js 前端项目。

![preview](preview.png)

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- next-intl
- next-auth
- Supabase
- Stripe
- Vercel AI SDK

## 本地开发

1. 安装依赖

```bash
pnpm install
```

2. 初始化环境变量

```bash
cp .env.example .env.local
```

3. 启动开发环境

```bash
pnpm dev
```

默认地址为 `http://localhost:3000`。

## 高德地图接入

如果你要启用线下展览申请页里的地图预览、地址解析和“获取当前位置”功能，请在你本地的 `.env.local` 里补充：

```bash
NEXT_PUBLIC_AMAP_KEY=你的高德Web端JSAPI Key
NEXT_PUBLIC_AMAP_SECURITY_JS_CODE=你的安全密钥
```

说明：

- `NEXT_PUBLIC_AMAP_KEY`：必填，否则地图 SDK 无法加载
- `NEXT_PUBLIC_AMAP_SECURITY_JS_CODE`：多数开启安全校验的高德项目也需要配置
- 线下展览页现在只保存文本地址，不保存经纬度；地图预览时会临时解析位置
- “获取当前位置”依赖浏览器定位权限，请在本地开发或正式域名环境下允许定位

## 主要目录

- `app/`：页面与 API 路由
- `components/`：界面组件
- `models/`：Supabase 数据访问
- `services/`：业务服务层
- `i18n/`：国际化消息与落地页文案
- `data/`：数据库初始化脚本

## 常用命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm analyze
pnpm db:migrate
pnpm cf:build
pnpm cf:preview
pnpm cf:deploy
```

## 部署说明

- Vercel：配置 `.env` 后直接部署
- Cloudflare Pages：复制 `wrangler.toml.example` 为 `wrangler.toml` 后执行 `pnpm cf:deploy`

## 说明

- 示例环境变量文件已改为占位值，请按实际环境填写
- `LICENSE` 保留了上游模板授权文本，若准备对外发布，请自行确认授权与法律文案是否需要重写
