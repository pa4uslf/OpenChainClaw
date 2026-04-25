# OpenChainClaw

> A transparent, local-first, Web3-verifiable personal AI assistant.

[![Status](https://img.shields.io/badge/status-planning-blue)](#roadmap)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Local First](https://img.shields.io/badge/local--first-by%20default-6f42c1)](#privacy-and-safety)

OpenChainClaw 是一个融合 Web3 可验证记录能力的透明个人 AI 助手项目。它不把第一版目标放在“更强的 agent 能力”上，而是优先验证一个更关键的问题：

**用户是否愿意因为 AI 操作过程透明、可验证、可回溯，而选择使用 OpenChainClaw。**

## Why OpenChainClaw

现有个人 AI 助手和 agent 项目已经能完成越来越多任务，但它们的实际运行过程往往不够透明。用户很难独立确认：

- AI 读取了哪些文件；
- AI 修改了哪些内容；
- AI 访问了哪些网站；
- AI 调用了哪些 API；
- 是否有隐私数据被发送给第三方；
- 操作记录是否完整、可验证、可回溯。

OpenChainClaw 的核心方向是：**让 AI 助手的关键操作可见、可验证、可拦截、可恢复。**

## Core Idea

OpenChainClaw 第一版采用：

**Local Web Console + Local Agent Runtime**

![OpenChainClaw MVP architecture](docs/assets/architecture.png)

The diagram source is available as [Mermaid](docs/architecture.mmd) and [SVG](docs/assets/architecture.svg).

## Highlights

- **Transparent timeline**: 展示任务执行过程、工具调用、文件读写、网页访问和 API 调用。
- **Local audit log**: 原始操作日志默认保存在本地，作为完整审计源。
- **Web3-verifiable proof**: 链上只保存哈希、索引、时间戳和证明字段，不保存原始隐私数据。
- **Risk guard**: 高风险操作执行前暂停，等待用户确认。
- **Rollback-first file edits**: 文件修改前创建快照，支持 diff 和回滚。
- **Optional wallet flow**: 钱包连接可选，可用于身份绑定和高风险操作签名确认。

## MVP Scope

MVP 优先实现透明审计层，不追平 OpenClaw、Hermes、Mercury 的全部 agent 能力。

第一版必须包含：

- 本地 Web 控制台；
- 最小 Agent Runtime；
- 本地文件读写；
- 网页浏览；
- API 调用；
- 操作时间线；
- 本地审计日志；
- 本地日志哈希；
- 链上记录或提交队列；
- 高风险操作确认；
- Blocked 操作禁止；
- 文件修改快照与回滚；
- 审计报告。

## Privacy and Safety

OpenChainClaw 第一版遵循：

**默认本地、最小外发、可验证记录。**

| Area | MVP Rule |
| --- | --- |
| Raw file content | 不默认上传，不上链 |
| User prompt | 本地保存，原文不上链 |
| API request body | 本地脱敏记录，原文不上链 |
| Private keys / tokens / cookies | 默认禁止读取，不上链 |
| Hidden files | 默认 `Blocked` |
| Paid API calls | 执行前必须确认 |
| Sensitive data transfer | 执行前必须确认 |
| File modification | 修改前快照，支持回滚 |

## Risk Levels

| Level | Meaning | Behavior |
| --- | --- | --- |
| `Low` | 读取授权目录普通文件、访问用户确认过的白名单网站 | 自动执行并记录 |
| `Medium` | 修改文件、调用普通 API | 执行并完整记录 |
| `High` | 读取私密目录、上传文件、调用付费服务、外发疑似敏感数据、删除文件 | 暂停并请求用户确认 |
| `Blocked` | 读取私钥、上传 token、读取或上传隐藏文件、删除大量文件、未经确认发送隐私数据 | 默认禁止 |

## Differentiation

OpenChainClaw 不是单纯更强的 AI 助手，而是一个让个人 AI 助手操作过程透明、可验证、可回溯的 Web3-native AI assistant。

相较传统黑箱式 agent，OpenChainClaw 更关注：

- 用户能看到 AI 做了什么；
- 高风险操作不会悄悄发生；
- 本地日志可以和链上证明对照；
- 文件修改可以回滚；
- 链上记录用于证明，而不是泄露数据。

## Documentation

- [License](LICENSE)

## Roadmap

### V0.1 Prototype

- 本地 Web 控制台；
- 最小 Agent Runtime；
- 文件读取和文件修改；
- 文件修改前快照；
- 操作时间线；
- 本地审计日志；
- 本地日志哈希；
- 高风险操作确认；
- 审计报告；
- 本地可验证账本。

### V0.2 MVP

- 网页浏览；
- API 调用；
- 链上记录或链上提交队列；
- 钱包可选连接；
- 钱包签名确认；
- 白名单管理；
- 审计日志检索；
- 文件 diff 和回滚；
- 任务历史；
- 用户偏好；
- Markdown / JSON 审计报告导出。

### Later

- GitHub、邮箱、日历、知识库等更多工具；
- 外部 agent 审计 SDK；
- 插件注册机制；
- 更多链或可验证存储方案；
- 多 agent 安全评审；
- 更完整的开发者文档和社区贡献机制。

## Non-goals for MVP

OpenChainClaw 第一版明确不做：

- 企业权限系统；
- DAO 治理；
- 完整多 agent 投票；
- 复杂长期知识图谱；
- 复杂跨设备同步；
- 浏览器 cookie 读取；
- 钱包私钥读取；
- 原始隐私数据上链；
- 完整桌面端；
- 移动端 App；
- 企业合规审计报表。

## Project Status

当前仓库处于 **PRD and architecture planning** 阶段。下一步重点是：

1. 基于本地产品需求制定技术方案；
2. 确定本地日志、哈希和链上记录的数据结构；
3. 设计本地 Web 控制台核心页面；
4. 制定 V0.1 原型开发范围；
5. 准备早期用户试用脚本和反馈问卷。
