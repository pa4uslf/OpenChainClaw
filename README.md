# OpenChainClaw

## 中文

OpenChainClaw 是一个本地优先、可验证、可回溯的个人智能助手原型。项目重点不是先追求更强的自动执行能力，而是验证一个更基础的问题：用户是否愿意因为操作过程透明、风险可拦截、记录可验证而选择使用这个助手。

### 项目定位

- 本地网页控制台用于创建任务、查看时间线、处理风险确认和阅读审计报告。
- 本地运行时负责文件读写、网页访问、接口调用、风险判断、快照、回滚和本地证明记录。
- 原始日志默认只保存在本地。
- 可验证记录只保存哈希、索引、时间戳和风险摘要，不保存原始隐私数据。
- 钱包能力是可选增强，不是使用门槛。

### 当前状态

当前仓库处于 `V0.1` 本地原型阶段，已经具备无依赖本地控制台和确定性演示运行时。

已完成能力包括：

- 从本地控制台创建任务；
- 记录文件读取、文件修改、风险判断、用户确认、网页访问、接口调用和本地证明事件；
- 默认阻止隐藏文件和敏感文件读取；
- 非白名单网页访问前进入高风险确认；
- 文件修改前创建快照；
- 展示文件差异并支持回滚；
- 生成确定性本地审计哈希；
- 写入本地可验证账本记录。

尚未完成能力包括：

- 真实模型规划和执行循环；
- 真实网页自动化和网页内容提取；
- 真实外部接口调用；
- 钱包连接和钱包签名确认；
- 公链提交。

### 架构

![OpenChainClaw 架构图](docs/assets/architecture.png)

架构图源文件：

- [Mermaid](docs/architecture.mmd)
- [SVG](docs/assets/architecture.svg)

### 快速开始

运行要求：`Node.js 20` 或更新版本。

```bash
npm test
npm start
```

启动后访问：

```text
http://127.0.0.1:4173
```

本地审计数据会写入 `.openchainclaw/`，演示工作区会写入 `data/workspace/`。这两个目录都不会进入版本库。

### 原型演示流程

运行本地控制台后，可以用默认任务体验当前原型：

1. 创建一个演示任务；
2. 查看任务时间线中的文件读取、文件修改、风险判断和证明事件；
3. 在非白名单网页访问前批准或拒绝高风险操作；
4. 查看文件修改差异；
5. 执行文件回滚；
6. 查看任务完成后的本地审计哈希和本地账本记录。

这个流程用于验证透明审计、风险拦截、快照、回滚和本地证明，不代表已经接入真实模型、真实网页自动化或公链提交。

### 安全默认值

- 原始审计日志默认只保存在本机。
- 隐藏文件和疑似敏感文件默认禁止读取。
- 非白名单网页访问会先进入高风险确认。
- 文件修改前必须创建快照。
- 回滚操作本身也会进入审计记录。
- 可验证记录只保存哈希、索引、时间戳和风险摘要。
- 原始文件内容、接口请求正文、令牌、私钥和浏览器身份凭据不上链。

### 项目路线图

| 阶段 | 状态 | 公开目标 |
| --- | --- | --- |
| `V0.1` 本地原型 | 已完成 | 验证任务时间线、风险拦截、文件快照、回滚和本地账本证明。 |
| `V0.2` 最小可用内核 | 下一阶段 | 接入真实最小智能助手循环、授权目录、网站白名单、偏好管理、网页访问和接口调用适配器。 |
| `V0.3` 可验证证明闭环 | 计划中 | 完成证明队列、可选钱包连接、签名摘要和本地记录对比。 |
| `V0.4` 早期试用版本 | 计划中 | 打磨任务历史、审计检索、报告导出和早期试用流程。 |
| `V1.0` 最小可用产品 | 目标版本 | 让个人用户完成文件、网页和接口任务，并能验证关键操作过程。 |

### 最小版本边界

第一版明确不做：

- 企业权限系统；
- 团队审批；
- 去中心化治理；
- 完整多智能体投票；
- 复杂长期知识图谱；
- 复杂跨设备同步；
- 浏览器插件；
- 桌面端客户端；
- 移动端应用；
- 企业合规审计报表；
- 浏览器身份凭据读取；
- 钱包私钥读取；
- 原始隐私数据上链。

### 许可证

[MIT](LICENSE)

---

## English

OpenChainClaw is a local-first, verifiable, and recoverable personal AI assistant prototype. The project does not start by chasing stronger autonomous execution. It first tests whether users will choose an assistant because its actions are transparent, interruptible, and independently verifiable.

### Product Positioning

- The local web console creates tasks, shows timelines, handles risk approvals, and displays audit reports.
- The local runtime handles file operations, web visits, API calls, risk checks, snapshots, rollback, and local proof records.
- Raw audit logs stay local by default.
- Verifiable records store only hashes, indexes, timestamps, and risk summaries, not private raw data.
- Wallet support is optional. It is not required for core local use.

### Current Status

The repository is at the `V0.1` local prototype stage. It already includes a no-dependency local console and a deterministic demo runtime.

Completed capabilities:

- create a task from the local console;
- record file read, file modify, risk review, user approval, web visit, API call, and local proof events;
- block hidden and sensitive file reads by default;
- pause non-whitelisted web visits for high-risk approval;
- create a snapshot before file modification;
- show file diffs and support rollback;
- generate deterministic local audit hashes;
- write local verifiable ledger records.

Missing capabilities:

- real model planning and execution loop;
- real browser automation and webpage extraction;
- real external API execution;
- wallet connection and wallet signature approval;
- public-chain submission.

### Architecture

![OpenChainClaw architecture](docs/assets/architecture.png)

Architecture sources:

- [Mermaid](docs/architecture.mmd)
- [SVG](docs/assets/architecture.svg)

### Quickstart

Requirement: `Node.js 20` or newer.

```bash
npm test
npm start
```

Then open:

```text
http://127.0.0.1:4173
```

Local audit data is written to `.openchainclaw/`. The demo workspace is written to `data/workspace/`. Both directories are ignored by git.

### Prototype Walkthrough

After starting the local console, use the default task to try the current prototype:

1. create a demo task;
2. inspect file read, file modify, risk review, and proof events in the task timeline;
3. approve or reject a high-risk non-allowlisted web visit;
4. inspect the file diff;
5. roll back the file change;
6. review the local audit hash and local ledger record after completion.

This walkthrough validates transparent audit trails, risk blocking, snapshots, rollback, and local proofs. It does not mean real model calls, real browser automation, or public-chain submission are already integrated.

### Security Defaults

- Raw audit logs stay on the local machine by default.
- Hidden files and likely sensitive files are blocked by default.
- Non-allowlisted web visits pause for high-risk approval.
- File modification must create a snapshot first.
- Rollback actions are also recorded in the audit trail.
- Verifiable records store only hashes, indexes, timestamps, and risk summaries.
- Raw file content, API request bodies, tokens, private keys, and browser credentials are not written on-chain.

### Project Roadmap

| Phase | Status | Public Goal |
| --- | --- | --- |
| `V0.1` Local Prototype | Done | Validate task timelines, risk blocking, file snapshots, rollback, and local ledger proofs. |
| `V0.2` Minimum Runtime Core | Next | Add a real minimal assistant loop, authorized directories, site allowlists, preferences, web adapters, and API adapters. |
| `V0.3` Verifiable Proof Loop | Planned | Add the proof queue, optional wallet connection, signature summaries, and local record comparison. |
| `V0.4` Early Trial Release | Planned | Improve task history, audit search, report export, and early trial flow. |
| `V1.0` Minimum Viable Product | Target | Let personal users complete file, web, and API tasks while verifying the critical action trail. |

### Minimum Version Boundaries

The first version explicitly excludes:

- enterprise permission systems;
- team approval workflows;
- decentralized governance;
- full multi-agent voting;
- complex long-term knowledge graphs;
- complex cross-device sync;
- browser extensions;
- desktop clients;
- mobile apps;
- enterprise compliance reports;
- browser Cookie reading;
- wallet private-key reading;
- raw private data on-chain.

### License

[MIT](LICENSE)
