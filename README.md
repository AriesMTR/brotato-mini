# 🥔 迷你土豆兄弟 HD (Mini Brotato HD)

在线即玩（支持电脑网页、手机浏览器、iOS/安卓微信内打开及添加到主屏幕全屏游玩）：  
👉 **https://ariesmtr.github.io/brotato-mini/**

---

## 📂 模块化项目目录结构

```text
brotato_web/
├── index.html                  # 页面骨架入口（按拓扑顺序加载样式与模块脚本）
├── manifest.json               # PWA 桌面应用清单（支持添加到手机主屏幕全屏运行）
├── assets/
│   └── icon.svg                # 矢量土豆战士应用图标 / Favicon（后续可扩充 audio/ 与 sprites/）
├── styles/
│   ├── base.css                # 全局基础视觉主题、桌面端布局、卡片与弹窗组件
│   └── mobile.css              # 手机竖屏/横屏 100dvh 单屏零下拉触控 UI 专属样式
├── src/
│   ├── core/
│   │   ├── env.js              # 画布上下文、DPR 像素比与全局品质色板常量
│   │   ├── logger.js           # 环形缓冲诊断日志、异常/掉帧监控与 .txt 导出
│   │   └── audio.js            # WebAudio 合成音效 + AudioBank 外部音频（MP3/OGG）扩展接口
│   ├── data/
│   │   ├── scenes.js           # 5 大异星生态战场与环境异象配置表
│   │   ├── arsenal.js          # 6 档难度、8 位英雄、羁绊、22 把武器、36 件道具与升级词条表
│   │   └── monsters.js         # 终局主宰 Boss、先锋统领、地图奇遇圣物与 31 种怪物图鉴数据
│   ├── world/
│   │   └── textures.js         # 伪随机种子与离屏地面/暗角/3D 土豆贴图预烘焙器
│   ├── ui/
│   │   ├── viewport.js         # 自动/手机/电脑界面模式切换、竞技场扩缩容与高挑镜头控制
│   │   ├── codex.js            # 全息图鉴百科弹窗交互
│   │   ├── menus.js            # 战前配置、键鼠/虚拟摇杆/双指缩放输入、状态池与暂停流程
│   │   └── shop.js             # 波次结算、战利品箱、基因强化与军火商店合成/购买交互
│   ├── game/
│   │   ├── spawner.js          # 波次刷怪导演、异星晶树、奇遇圣物解封与怪物实体工厂
│   │   ├── combat.js           # 护甲/闪避/吸血数值结算、连锁闪电、爆炸与晶石掉落
│   │   └── update.js           # 60FPS 核心战斗状态机（移动、武器开火、投射物、怪物与首领 AI）
│   └── render/
│       ├── sprites.js          # 22 把武器、31+ 异星怪物与英雄外观精细矢量绘制
│       └── renderer.js         # 战场视锥裁剪渲染、首领红线预警、悬浮摇杆与主循环驱动
├── scripts/
│   └── build-singlefile.mjs    # 零依赖打包脚本：一键合并导出离线单文件 ../brotato_mini.html
├── tests/
│   └── verify.mjs              # 自动化校验套件（模块完整性 + 双端 UI + 数值平衡 + 渲染压力测试）
└── CHANGELOG.md                # 版本更新日志
```

---

## 🛠️ 本地开发与常用命令

1. **本地预览**：
   - 直接用浏览器打开 `index.html`，或启动任意静态服务（如 `npx serve .` / `python3 -m http.server 8080`）。
2. **运行自动化回归测试**：
   ```bash
   npm test
   ```
3. **一键导出离线单文件版（同步更新 `../brotato_mini.html`）**：
   ```bash
   npm run build:single
   ```
4. **扩展新内容指南**：
   - **新增英雄 / 武器 / 道具**：直接编辑 `src/data/arsenal.js`（若新武器有专属外观则在 `src/render/sprites.js` 的 `drawWeaponSprite` 补充绘制分支）。
   - **新增怪物 / Boss / 圣物**：编辑 `src/data/monsters.js`、`src/game/spawner.js`、`src/game/update.js` 与 `src/render/sprites.js`。
   - **接入真实音效与 BGM**：将音频放入 `assets/audio/`，调用 `AudioBank.registerSfx(key, url)` 或 `AudioBank.playBgm(url)`（见 `src/core/audio.js`）。
