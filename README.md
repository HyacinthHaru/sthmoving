# sthmoving

单组织共享物品管理微信小程序。产品需求与架构见[产品需求与架构.md](./产品需求与架构.md)。

## 技术栈

- 微信原生小程序 + TypeScript
- 微信云开发
- Vitest
- ESLint

## 本地准备

1. 安装依赖：`npm install`
2. 将官方 `SupvanT50ProWeChat.zip` 放到 `%LOCALAPPDATA%\Temp`，执行
   `npm run install:supvan-sdk` 安装本机打印 SDK。
3. 将 `project.private.config.example.json` 复制为
   `project.private.config.json`，并填写实际微信小程序 AppID。
4. 确认 `miniprogram/config/env.ts` 中的云环境 ID 与当前微信云开发环境一致。
5. 使用微信开发者工具打开项目根目录。
6. 执行 `npm run check` 验证代码。

仓库中的 `project.config.json` 使用游客 AppID；实际 AppID 只保存在被
`.gitignore` 排除的 `project.private.config.json` 中。云环境 ID 是客户端运行所需的公开标识。
AppSecret、访问令牌及云密钥不得写入小程序代码或提交到仓库。

提交前执行 `npm run check`。该命令会先扫描仓库文件中的常见凭据模式，
再运行 ESLint、TypeScript 类型检查和自动化测试；GitHub CI 会执行相同检查。

阶段 1 的数据库集合、索引、首位所有者初始化和人工验收步骤见
[阶段 1 云环境配置](./docs/阶段1云环境配置.md)。

阶段 2 分类批次的集合、索引、部署和人工验收步骤见
[阶段 2 分类云环境配置](./docs/阶段2分类云环境配置.md)。

阶段 3 物品查询批次的索引、部署和人工验收步骤见
[阶段 3 物品查询云环境配置](./docs/阶段3物品查询云环境配置.md)。

阶段 3 小程序码批次的集合、索引、云调用权限和人工验收步骤见
[阶段 3 小程序码云环境配置](./docs/阶段3小程序码云环境配置.md)。

## 自建后端

`server/` 是正在迁移中的自建后端，与云函数共用 `cloudfunctions/api/src` 下的
业务代码，只替换仓储与外部依赖的实现。

启动开发环境：

```
docker compose -f docker-compose.dev.yml up
```

服务监听 8080 端口，端点如下：

| 端点 | 鉴权 | 说明 |
|---|---|---|
| `GET /health` | 无 | 数据库连通状态 |
| `POST /auth/session` | 无 | 用 `{code}` 换取访问令牌 |
| `POST /api` | Bearer 令牌 | 与云函数相同的 `{module, action, payload}` |

访问令牌是随机串，服务端只保存它的 SHA-256 摘要；权限每次请求都回数据库查，成员
被停用后立即失效，不必等令牌过期。可用的环境变量：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | 8080 | 监听端口 |
| `DATABASE_URL` | 无，必填 | PostgreSQL 连接串 |
| `DATABASE_POOL_MAX` | 10 | 连接池上限 |
| `RUN_MIGRATIONS` | true | 启动时执行 `server/migrations` |
| `MIGRATIONS_DIR` | `<工作目录>/server/migrations` | 迁移脚本目录 |
| `SESSION_TTL_DAYS` | 30 | 访问令牌有效期 |
| `WECHAT_APP_ID` | 无，必填 | 小程序 AppID |
| `WECHAT_APP_SECRET` | 无，必填 | 小程序密钥，只允许放在服务端环境变量 |
| `OWNER_BOOTSTRAP_TOKEN` | 无 | 首位所有者初始化口令，至少 16 位 |

只跑数据库时使用 `docker compose -f docker-compose.test.yml up -d`，并把
`TEST_DATABASE_URL` 指向它，`npm run test` 才会执行真实数据库用例；未配置时这些
用例自动跳过。

## 当前实现范围

- 微信登录、成员申请与审核
- 分类选择、自定义分类和管理员分类管理
- 物品登记、图片上传和首条操作日志
- 物品列表、文字搜索、分类筛选和详情
- 微信小程序码生成、云存储、标签预览和扫码路由
- 硕方 T50 Pro 蓝牙搜索、连接、断开、错误映射和 30 × 30 mm 标签打印入口

硕方 SDK 本体没有提交到公有仓库，通过固定 SHA256 的安装脚本放入本机 Git
忽略目录。真机打印、参数校准和连续 20 张验收步骤见
[阶段 8 硕方 T50 Pro 打印验收](./docs/阶段8硕方T50Pro打印验收.md)。
