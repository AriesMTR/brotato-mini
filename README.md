# 烬塔残响：第999次救赎

当前本地版本：**v2.1.1 · 手机触控与小屏修复**。

直接用 Chrome / Safari 打开 `index.html` 即可运行；也可打开 `烬塔残响_单文件离线版.html`，后者包含全部运行素材，无需联网。

V2.1.1 修复手机小屏阅读、商店滚动、横屏 HUD 与触控冲突，并适配微信等内置浏览器可用高度变化。验证范围与限制见 `docs/mobile-v2.1.1-validation.txt`。

V2.1 新增九张独立剧情原画与轻动画分镜（缓推、横移、雨雪、微光和转场），替换关键段落的设计拼图裁切。全文对白已重新润色。建议在「演出预览」先看苏醒、桥头初遇与烬羽最终败北。旧存档可继续使用。

- **提灯启程**：选择难度后，从六镜苏醒开始完整的十六层主线。
- **继续登塔**：恢复本地保存的楼层起点。抵达新层时自动记录，关闭页面或战败后可以继续；浏览器私密模式可能不允许持久保存。
- **演出预览**：从主界面左下方进入，直接查看苏醒、青羽、各层对白、四位首领分段和双结局；预览包含剧透，不改变存档或奖励。
- **声音与阅读**：设置中可启用即时显字、130%字号、减少动态与文字音效。剧情支持回看、自动、隐藏和仅跳过已读；关键选项不会自动确认。
- **战斗性能**：战场画布采用像素预算，持续掉帧时自动降低渲染分辨率；角色立绘、剧情原画和界面文字保持原清晰度。菜单和剧情期间停止绘制战场。设置 → 运行诊断中记录战斗 FPS、逻辑/绘制耗时和分辨率。

新剧情数据位于 `src/data/story-v2.js`，叙事因果依据工作区 `output/design/revision-v2/story-v2.json`；V2.1 文本为游戏内实际稿，逐层审核见 `docs/narrative-v2.1-review.txt`。原角色设计保持，新增九张原画、完整提示词和尺寸清单位于 `assets/spire/v3/`，使用内置 image_gen 制作。V2 素材保留于 `assets/spire/v2/`。新增的演出、信物和结局流程仅作用于主线；无尽试炼保留原本的构筑与随机神话阶段。

线上版本（本地修改不会自动部署到这里）：

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
   - 直接用浏览器打开 `index.html`，或启动静态服务：`python3 -m http.server 8080 --bind 127.0.0.1`。
2. **运行自动化回归测试**：
   ```bash
   npm test
   ```
3. **一键导出离线单文件版（更新项目内的 `烬塔残响_单文件离线版.html`）**：
   ```bash
   npm run build:single
   ```
4. **扩展新内容指南**：
   - **新增英雄 / 武器 / 道具**：直接编辑 `src/data/arsenal.js`（若新武器有专属外观则在 `src/render/sprites.js` 的 `drawWeaponSprite` 补充绘制分支）。
   - **新增怪物 / Boss / 圣物**：编辑 `src/data/monsters.js`、`src/game/spawner.js`、`src/game/update.js` 与 `src/render/sprites.js`。
   - **接入真实音效与 BGM**：将音频放入 `assets/audio/`，调用 `AudioBank.registerSfx(key, url)` 或 `AudioBank.playBgm(url)`（见 `src/core/audio.js`）。
