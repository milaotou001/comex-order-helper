# AI 协作指引 — COMEX 金银 ETF 挂单换算器

> Claude 和 Codex 打开项目时先读本文件。

---

## 统一口令

用户对任何工具说：**"按工作流继续"**

工具收到后自动执行：

1. 优先读取 STATUS.md
2. 如果没有 STATUS.md，再读取 CURRENT.md
3. 读取 AGENTS.md（本文件）
4. 必要时读取 PRD.md / TODO.md / README.md
5. 根据 STATUS.md / CURRENT.md 中的当前任务继续
6. 允许读取和修改完成当前任务所需的相关文件
7. 禁止做当前任务范围外的功能
8. 禁止扩大 MVP
9. 完成后简短更新 STATUS.md
10. 阶段切换时才更新 CURRENT.md（如存在）

---

## 两套状态文件

| 文件 | 用途 | 更新频率 |
|------|------|---------|
| **STATUS.md** | 日常开发状态 | 每完成一个任务更新 |
| **CURRENT.md** | 阶段交接控制 | 只在阶段切换时更新 |

> 本项目为轻量模式，只有 STATUS.md + AGENTS.md，无 CURRENT.md。

---

## 工具分工

| 工具 | 做什么 | 不做什么 |
|------|--------|---------|
| **ChatGPT** | 白天收集想法、出启动材料 | 不创建项目、不写代码 |
| **Claude** | 需求澄清、MVP确认、项目初始化、阶段审查 | 轻量模式下不逐任务介入 |
| **Codex** | 技术复核、连续实现（轻量模式主导） | 不重新定义需求、不扩大MVP |
| **Task Master** | 把PRD拆成任务列表（重型模式） | 不写代码、不参与需求 |

---

## Codex 日常开发规则

Codex 可以连续执行一组明确任务，但必须：
1. 每次只做一个任务
2. 每完成一个任务就 Git commit
3. 只简短更新 STATUS.md（不长篇更新 CURRENT.md）
4. 不扩大 MVP
5. 不做任务清单以外的功能
6. 技术复核时不写代码，只输出报告

---

## Claude 审查规则

Claude 不需要逐个小任务审查。只在以下情况审查：
- 一个任务组完成
- Codex 明确遇到风险
- 用户要求审查
- 阶段结束前

---

## 项目概况

- **项目名**：COMEX 金银 ETF 挂单换算器
- **Slug**：comex-order-helper
- **类型**：网页工具（手机端优先）
- **当前阶段**：MVP-0 初始化
- **工作流模式**：轻量模式

## 项目定位

输入博主给出的 COMEX 黄金/白银买点和止损点 → 自动按 1:2 盈亏比生成止盈点 → 换算为 IAU/UGL/SLV/AGQ 挂单参考价，一键复制。只做多。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js App Router + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes (/api/quotes) |
| 行情 API | Twelve Data |
| 部署 | Vercel |
| PWA | manifest.json + 移动端图标 |
| 测试 | Vitest |

## 项目文件结构

```
comex-order-helper
├─ app
│  ├─ page.tsx
│  ├─ layout.tsx
│  ├─ globals.css
│  └─ api
│     └─ quotes
│        └─ route.ts
├─ components
│  ├─ QuotePanel.tsx
│  ├─ PointInput.tsx
│  ├─ GoldResultCard.tsx
│  ├─ SilverResultCard.tsx
│  ├─ SettingsPanel.tsx
│  ├─ CopyButton.tsx
│  └─ RiskNotice.tsx
├─ lib
│  ├─ formulas.ts
│  ├─ parser.ts
│  ├─ marketData.ts
│  ├─ settings.ts
│  ├─ types.ts
│  └─ format.ts
├─ tests
│  ├─ formulas.test.ts
│  └─ parser.test.ts
├─ public
│  ├─ manifest.json
│  └─ icons
├─ .env.example
├─ README.md
└─ CLAUDE.md
```

---

## 固定约束（不可讨论，不可修改）

### 交易品种
- **黄金**：IAU（主要挂单对象）、UGL（2 倍杠杆，仅短区间参考）
- **白银**：SLV（普通白银 ETF 参考）、AGQ（2 倍杠杆，仅短区间参考）
- **禁止**：GLD、XAU/USD、XAG/USD 不得出现在项目中

### 口径
- 金银口径固定为 **COMEX 黄金**、**COMEX 白银**
- 不做现货金银切换
- 不让用户选择金银口径

### 交易方向
- 只做多：买点入场 → 止损在买点下方 → 止盈 = 买点 + 2 × (买点 - 止损)
- 盈亏比固定 1:2

### 安全
- API Key 只能放在服务端环境变量
- 前端只能请求 /api/quotes
- .env、密钥不进 Git

---

## MVP-0 验收标准（≤8 条）

1. 网页可正常打开，手机端显示正常
2. 可获取并显示当前行情（COMEX 金银 + 4 个 ETF），失败时不白屏
3. 输入买点+止损，自动生成止盈，三点位分别换算 IAU/UGL
4. 输入买点+止损，自动生成止盈，三点位分别换算 SLV/AGQ
5. 每个价格可一键复制，整行可一键复制
6. 盈亏比 1:2 固定，止盈自动计算
7. UGL/AGQ 有风险提示，距离 >5% 变色警告
8. API Key 不暴露在前端

---

## 换算公式

### 普通 ETF（IAU、SLV）
目标 ETF 价格 = 当前 ETF 价格 × 目标 COMEX 点位 ÷ 当前 COMEX 价格

### 杠杆 ETF（UGL、AGQ）
涨跌幅 = 目标 COMEX 点位 ÷ 当前 COMEX 价格 - 1
杠杆 ETF 参考价 = 当前杠杆 ETF 价格 × (1 + 2 × 涨跌幅)

### 容易成交价 / 捡漏价（买入场景）
容易成交价 = 标准价 × (1 + 上浮%)，默认 0.10%
捡漏价 = 标准价 × (1 - 下浮%)，默认 0.30%

### 止盈自动生成
止盈点 = 买点 + 2 × (买点 - 止损)

---

## 行情 API

- 行情源：Twelve Data
- COMEX 黄金 symbol：GC
- COMEX 白银 symbol：SI
- ETF symbol：IAU、UGL、SLV、AGQ
- 默认手动刷新（省 API 额度）

### 环境变量
```
MARKET_DATA_API_KEY=your_api_key_here
MARKET_DATA_PROVIDER=twelvedata
COMEX_GOLD_SYMBOL=GC
COMEX_SILVER_SYMBOL=SI
IAU_SYMBOL=IAU
UGL_SYMBOL=UGL
SLV_SYMBOL=SLV
AGQ_SYMBOL=AGQ
NEXT_PUBLIC_APP_NAME=COMEX金银挂单换算器
```

---

## 页面布局（手机端优先，深色模式）

1. 顶部标题区
2. 当前行情区（6 个品种 + 刷新按钮 + 更新时间）
3. COMEX 黄金输入区（买点 + 止损 → 自动生成止盈 + 三点位）
4. 黄金换算结果卡片区（买点/止损/止盈各一张卡片）
5. COMEX 白银输入区（买点 + 止损 → 自动生成止盈 + 三点位）
6. 白银换算结果卡片区
7. 设置区（上浮%/下浮%/刷新间隔/是否显示杠杆 ETF/小数位）
8. 风险说明区

---

## 复制格式

### 单个价格
`85.65`

### 整行黄金
`COMEX黄金 4550｜IAU标准 85.65｜IAU容易成交 85.74｜IAU捡漏 85.39｜UGL参考 56.88｜距当前 -1.04%`

### 整行白银
`COMEX白银 70｜SLV标准 63.66｜SLV容易成交 63.72｜SLV捡漏 63.47｜AGQ参考 135.82｜距当前 -3.25%`

---

## 风险提示

页面固定显示：
> UGL、AGQ 为 2 倍日内目标产品，仅适合当前价格附近的短区间参考。目标点位距离当前 COMEX 金银价格越远，参考误差可能越大。最终挂单前请以 IBKR 实时盘口为准。

距离当前 ≤5%：正常显示
距离当前 >5%：黄色提示"杠杆 ETF 参考误差可能放大"
距离当前 >8%：红色提示"距离当前价格较远，杠杆 ETF 仅供粗略参考"

---

## 测试要求

使用 Vitest，至少覆盖：
1. 普通 ETF 换算公式
2. 杠杆 ETF 换算公式
3. 容易成交价计算
4. 捡漏价计算
5. 点位文本解析
6. 异常点位过滤
7. 止盈自动计算

---

## 核心约束

### 禁止扩大 MVP
- 只做任务清单里明确列出的任务
- 不做 Issue 之外的功能，不加"顺带"优化

### 安全规则
- `.env`、密钥、Token 不进 Git
- `node_modules/`、`dist/`、`build/` 不进 Git
- 同一项目同一时间只允许一个工具改文件

---

## 项目链接

- GitHub 仓库：【待创建】
- GitHub Projects：【无】
