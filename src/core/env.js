// 核心画布环境、DPR 像素比与全局品质常量
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rad = Math.min(typeof r === 'number' ? r : 4, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}
const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { alpha: false });
let viewW = window.innerWidth, viewH = window.innerHeight, dpr = 1, camZoom = 1.08, userZoomed = false;
let isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
let bootReady = false;
const APP_VERSION = 'v1.1.3';
const APP_BUILD_DATE = '2026-11-12';
const FLOOR_PAD = 160;
const WORLD = { w: 2200, h: 1500, pad: 90 };
let curFloorScale = 0.8;
const TIER_COLORS = ['', '#e2deec', '#4cc9f0', '#c77dff', '#ff4d6d'];
const TIER_GLOW   = ['', 'rgba(255,255,255,0)', 'rgba(76,201,240,0.45)', 'rgba(199,125,255,0.55)', 'rgba(255,77,109,0.65)'];
const TIER_NAMES  = ['', '普通', '精良', '史诗', '传说'];
