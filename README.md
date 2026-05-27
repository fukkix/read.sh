# read.sh

[ EN | ZH ]

## EN

**STATUS: ONLINE**
**TYPE: PWA READER / TERMINAL EMULATOR UI**

read.sh is a minimal, offline-first progressive web application designed for reading text-based content within a terminal-aesthetic environment. It utilizes regular expressions to parse and apply syntax highlighting to plain text, simulating a code-reading experience.

### SYSTEM FEATURES

- **INTERFACE**: Monochromatic color palette with zero-radius UI components. No graphical ornaments or emojis.
- **PARSER**: Custom regex-based tokenization engine for applying code-like syntax highlighting to natural language.
- **DATA SOURCES**:
  - `[ R ] RANDOM`: Integrates with Wikipedia API. Features a dynamic "Wiki-Walk" algorithm that utilizes user reading history to extract internal links as new seed pools, ensuring continuous, deduplicated knowledge discovery.
  - `[ ≡ ] TOPICS`: Selectable predefined domain keywords (Astrophysics, Computer Science, Cyberpunk, etc.) for targeted pseudo-random fetching. Multi-selection supported.
  - `[ S ] SEARCH`: Direct querying of the Wikipedia database.
  - `[ U ] UPLOAD`: Local parsing of EPUB and Markdown files. Supports bulk import of entire Obsidian vaults via directory selection. No server processing.
- **PERSISTENCE**: Automatically caches reading progress for local files. Enables immediate resumption of the last read document and precise scroll position via the `[ C ] CONTINUE` interface.
- **ANNOTATION**: Line-number based notation system mapping text to `// comment` blocks. Stored via IndexedDB.
- **SYNCHRONIZATION**: Native integration with GitHub API. Pushes local annotations to a private GitHub Gist via Personal Access Token.
- **PWA / IOS COMPATIBILITY**: Full offline capability via Service Workers. Includes predefined `apple-touch-icon` for seamless iOS Home Screen integration as a standalone Web Clip.

### DEPLOYMENT INSTRUCTIONS

Execute the following commands to initialize the environment:

```bash
git clone https://github.com/fukkix/read.sh.git
cd read.sh
python -m http.server 8080
```
Access via browser at `http://localhost:8080`.

For Cloudflare Worker deployment:
```bash
npx wrangler deploy
```

---

## ZH

**状态: 运行中**
**类型: PWA 阅读器 / 终端仿真 UI**

read.sh 是一款极简的、离线优先的渐进式 Web 应用，旨在终端美学环境中提供纯文本阅读功能。它利用正则表达式解析并对自然语言进行类似代码语法的着色渲染。

### 系统特性

- **交互界面**: 单色系终端配色，完全移除圆角 UI 组件。无多余图形修饰及表情符号。
- **解析引擎**: 基于正则匹配的自定义词法分析器，将自然语言转换为高亮的代码风格序列。
- **数据源**:
  - `[ R ] 随机提取`: 接入维基百科 API。内建“维基漫游 (Wiki-Walk)”算法，提取已阅条目的内部链接作为动态种子池，并严格过滤近期阅读历史，确保无重复的内容发现链路。
  - `[ ≡ ] 领域知识库`: 预置特定学科的分类种子词库（如天体物理、计算机科学、赛博朋克等），支持多选及定向伪随机获取。
  - `[ S ] 全文检索`: 对维基百科数据库进行直接检索。
  - `[ U ] 本地载入`: 纯前端解析 EPUB 及 Markdown 格式文件。支持一键导入整个 Obsidian 知识库 (Vault) 目录，无服务端数据驻留。
- **状态持久化**: 自动缓存本地阅读解析数据及章节滚动位置。通过 `[ C ] CONTINUE` 接口实现系统重启后的秒级断点续读。
- **批注系统**: 基于行号定位的注释注入模块，支持在任意文本行生成 `// 备注`。数据持久化依赖系统底层 IndexedDB。
- **云端同步**: 原生集成 GitHub API。通过 Personal Access Token 将本地批注数据推送至私有 GitHub Gist。
- **PWA / IOS 适配**: 借助 Service Workers 实现断网环境下的完全读写能力。预置 `apple-touch-icon` 参数，支持将应用以独立 Web Clip 形式原生添加到苹果设备主屏幕。

### 部署指令

执行以下命令以初始化运行环境：

```bash
git clone https://github.com/fukkix/read.sh.git
cd read.sh
python -m http.server 8080
```
通过浏览器访问 `http://localhost:8080`。

通过 Cloudflare Worker 进行边缘部署：
```bash
npx wrangler deploy
```
