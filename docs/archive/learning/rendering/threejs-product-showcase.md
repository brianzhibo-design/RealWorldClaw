# Three.js + WebGL 产品展示最佳实践 🎀

> 美羊羊的学习笔记 | 2026-02-21

---

## 1. Three.js 产品展示优秀案例

### 1.1 Apple AirPods Pro
- **URL**: https://www.apple.com/airpods-pro/
- **效果**: 产品跟随滚动旋转，极致白色塑料材质，环境反射细腻
- **技术**: 滚动驱动动画（ScrollTrigger + Three.js），预烘焙光照，GLTF模型
- **优化**: 模型按需加载，LOD切换，视口外暂停渲染

### 1.2 Apple Mac Pro
- **URL**: https://www.apple.com/mac-pro/
- **效果**: 金属拉丝质感，镜面反射，360°旋转展示
- **技术**: MeshPhysicalMaterial + 金属度/粗糙度贴图，HDR环境贴图
- **优化**: 分段加载，WebP纹理压缩

### 1.3 Porsche Experience (配置器)
- **URL**: https://configurator.porsche.com
- **效果**: 实时换色/换件，车漆多层材质（clearcoat），实时阴影
- **技术**: MeshPhysicalMaterial.clearcoat，实时环境探针，PMREM
- **优化**: 按需加载配件模型，GPU实例化

### 1.4 Bruno Simon Portfolio
- **URL**: https://bruno-simon.com
- **效果**: 3D物理驱动的互动体验，卡通风格
- **技术**: Cannon.js物理 + Three.js，自定义着色器
- **优化**: 低多边形模型，简化碰撞体

### 1.5 Lusion (创意工作室)
- **URL**: https://lusion.co
- **效果**: 流体模拟，粒子特效，后处理重度使用
- **技术**: 自定义ShaderMaterial，GPGPU粒子，后处理管线
- **优化**: EffectComposer管线合并pass，降采样后处理

### 1.6 Gucci Virtual Try-On
- **URL**: https://www.gucci.com (部分产品页)
- **效果**: 奢侈品材质（皮革、金属扣），高精度PBR
- **技术**: glTF + Draco压缩，IBL环境光照
- **优化**: KTX2纹理压缩，渐进式加载

### 1.7 Google Store (Pixel手机)
- **URL**: https://store.google.com
- **效果**: 产品颜色切换，简洁光照，手势旋转
- **技术**: model-viewer (基于Three.js的Web Component)
- **优化**: 自适应分辨率，懒加载

### 1.8 Shopify AR
- **URL**: Shopify商品页AR预览
- **效果**: 产品3D预览 + AR投放到真实环境
- **技术**: model-viewer + WebXR，USDZ/GLB双格式
- **优化**: 自动LOD，移动端降分辨率

### 1.9 Nike By You (定制鞋)
- **URL**: https://www.nike.com/nike-by-you
- **效果**: 实时换色换材质，布料/皮革/网面多材质
- **技术**: 多UV通道 + mask贴图实时换色，PBR管线
- **优化**: 纹理Atlas合并，DrawCall优化

### 1.10 Sketchfab 产品展示
- **URL**: https://sketchfab.com
- **效果**: 通用3D模型查看器，支持注释、动画、AR
- **技术**: 自研渲染器（类Three.js），IBL + 后处理全家桶
- **优化**: 自适应画质，纹理流式加载，WebWorker解码

---

## 2. Three.js 产品渲染技术

### 2.1 PBR 材质系统 — MeshPhysicalMaterial 详解

MeshPhysicalMaterial 是 Three.js 最强大的 PBR 材质，基于 MeshStandardMaterial 扩展。

```javascript
const material = new THREE.MeshPhysicalMaterial({
  // === 基础 PBR ===
  color: 0xffffff,          // 基础色
  metalness: 0.0,           // 金属度 0=非金属 1=金属
  roughness: 0.3,           // 粗糙度 0=镜面 1=粗糙
  
  // === Physical 独有 ===
  clearcoat: 1.0,           // 清漆层（车漆、钢琴烤漆）
  clearcoatRoughness: 0.1,  // 清漆粗糙度
  
  sheen: 1.0,               // 光泽（布料、丝绸）
  sheenRoughness: 0.5,
  sheenColor: new THREE.Color(0xffffff),
  
  transmission: 0.0,        // 透射（玻璃、液体）
  thickness: 1.0,           // 透射厚度
  ior: 1.5,                 // 折射率（玻璃1.5，水1.33）
  
  iridescence: 0.0,         // 虹彩（肥皂泡、CD光盘）
  iridescenceIOR: 1.3,
  
  anisotropy: 0.0,          // 各向异性（拉丝金属）
  anisotropyRotation: 0.0,
  
  specularIntensity: 1.0,   // 高光强度
  specularColor: new THREE.Color(0xffffff),
  
  envMapIntensity: 1.0,     // 环境贴图强度
});
```

**常用材质预设：**

| 材质 | metalness | roughness | 特殊属性 |
|------|-----------|-----------|----------|
| 白色塑料 | 0.0 | 0.3-0.5 | — |
| 哑光塑料 | 0.0 | 0.8 | — |
| 钢琴烤漆 | 0.0 | 0.1 | clearcoat: 1.0 |
| 拉丝金属 | 1.0 | 0.3 | anisotropy: 1.0 |
| 镜面金属 | 1.0 | 0.05 | — |
| 玻璃 | 0.0 | 0.0 | transmission: 1.0, ior: 1.5 |
| 车漆 | 0.0 | 0.5 | clearcoat: 1.0, clearcoatRoughness: 0.03 |

### 2.2 HDR 环境贴图 — 让产品看起来真实

环境贴图是产品展示的灵魂。没有好的环境光，PBR材质再好也白搭。

**方案对比：**

| 方案 | 真实度 | 文件大小 | 离线友好 |
|------|--------|----------|----------|
| HDR文件 (RGBE) | ⭐⭐⭐⭐⭐ | 2-10MB | ❌ 需额外加载 |
| EXR文件 | ⭐⭐⭐⭐⭐ | 1-5MB | ❌ |
| LDR Cubemap (6张JPG) | ⭐⭐⭐ | 500KB-2MB | ⚠️ 可内嵌但大 |
| Procedural Sky | ⭐⭐⭐ | 0KB | ✅ 完全内嵌 |
| 预计算球谐光照 | ⭐⭐ | <1KB | ✅ 极小 |

**Procedural Sky 方案（离线最佳）：**

```javascript
// 使用 PMREMGenerator 从场景生成环境贴图
const pmremGenerator = new THREE.PMREMGenerator(renderer);

// 方案A: 用 Scene 做简易环境
const envScene = new THREE.Scene();
envScene.background = new THREE.Color(0xcccccc);
// 添加几个不同颜色的光源模拟环境
const light1 = new THREE.DirectionalLight(0xffffff, 3);
light1.position.set(1, 2, 1);
envScene.add(light1);
const light2 = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
envScene.add(light2);
const envMap = pmremGenerator.fromScene(envScene).texture;

// 方案B: 内置渐变球
scene.environment = envMap;
```

**推荐 HDR 来源（免费）：**
- Poly Haven (polyhaven.com) — CC0协议，studio类HDRI最适合产品展示
- 推荐：`studio_small_09`、`photo_studio_loft_hall`

### 2.3 后处理效果

```javascript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Bloom — 让高光溢出，增加质感
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3,   // strength — 产品展示用0.1-0.5，别太猛
  0.4,   // radius
  0.85   // threshold
);
composer.addPass(bloom);

// SSAO — 环境光遮蔽，增加立体感
const ssao = new SSAOPass(scene, camera, width, height);
ssao.kernelRadius = 8;
ssao.minDistance = 0.005;
ssao.maxDistance = 0.1;
composer.addPass(ssao);

// 色调映射 — 在renderer上设置
renderer.toneMapping = THREE.ACESFilmicToneMapping; // 最常用
renderer.toneMappingExposure = 1.0;

composer.addPass(new OutputPass()); // 必须放最后，处理色彩空间
```

**产品展示常用后处理优先级：**
1. ✅ 色调映射（必须，renderer级别）— ACES Filmic 最通用
2. ✅ Bloom（推荐）— 轻微的，strength 0.1-0.3
3. ⚠️ SSAO（可选）— 性能开销大，移动端慎用
4. ⚠️ FXAA/SMAA（可选）— 如果不用MSAA的话

### 2.4 3D格式对比

| 特性 | STL | GLTF/GLB | OBJ | FBX |
|------|-----|----------|-----|-----|
| **用途** | 3D打印 | Web展示 ✅ | 通用交换 | 动画 |
| **材质** | ❌ 无 | ✅ PBR完整 | ⚠️ 基础MTL | ✅ 但不标准 |
| **动画** | ❌ | ✅ 骨骼+变形 | ❌ | ✅ |
| **压缩** | ❌ | ✅ Draco/Meshopt | ❌ | ❌ |
| **文件大小** | 大 | 小(GLB) | 中 | 大 |
| **加载速度** | 慢 | 快 | 中 | 慢 |
| **Three.js支持** | ✅ STLLoader | ✅ GLTFLoader | ✅ OBJLoader | ⚠️ FBXLoader |

**结论：Web展示首选 GLB（二进制GLTF），但我们的3D打印场景用STL也完全OK，只是需要自己加材质。**

### 2.5 自适应画质

```javascript
function getQualityLevel() {
  const gl = renderer.getContext();
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
  const memory = navigator.deviceMemory || 4; // GB
  
  if (isMobile || memory <= 2) return 'low';
  if (gpu.includes('Intel') || memory <= 4) return 'medium';
  return 'high';
}

function applyQuality(level) {
  switch (level) {
    case 'low':
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      // 无后处理，无SSAO
      break;
    case 'medium':
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
      // 轻量Bloom
      break;
    case 'high':
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // 全部后处理
      break;
  }
}
```

---

## 3. 本地文件加载方案

### 3.1 file:// 协议的 CORS 问题

**问题**：浏览器出于安全考虑，`file://` 下的 JS 模块 import、fetch、Worker 都会被 CORS 策略阻止。

**解决方案（推荐度排序）：**

1. **✅ 本地 HTTP 服务器（最推荐）**
   ```bash
   # Python
   python3 -m http.server 8080
   
   # Node.js
   npx serve .
   
   # 更强大的
   npx vite --open
   ```

2. **✅ 单文件内嵌（我们的方案）**
   - Three.js 用 `<script>` 标签内联或 importmap 指向本地文件
   - 模型用 base64 data URI 内嵌
   - 纹理用 base64 内嵌
   - 完全零依赖，双击打开就能用

3. **⚠️ 浏览器禁用安全策略（开发用）**
   ```bash
   # Chrome
   open -a "Google Chrome" --args --allow-file-access-from-files --disable-web-security
   ```
   不推荐用于生产。

### 3.2 importmap vs script 标签

```html
<!-- 方案A: importmap（现代，推荐） -->
<script type="importmap">
{
  "imports": {
    "three": "./node_modules/three/build/three.module.js",
    "three/addons/": "./node_modules/three/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
</script>

<!-- 方案B: 传统script标签（兼容性最好，file://友好） -->
<script src="https://unpkg.com/three@0.170.0/build/three.min.js"></script>
<script src="https://unpkg.com/three@0.170.0/examples/js/controls/OrbitControls.js"></script>
<!-- 注意：examples/js/ 在 r163+ 已移除！只能用 module 版本 -->

<!-- 方案C: 单文件内嵌（我们选的） -->
<!-- 从CDN下载three.module.min.js，通过构建工具打包成单文件 -->
<!-- 或者用 ES Module + importmap 指向 CDN -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
```

### 3.3 Three.js 版本选择

| 版本 | 发布时间 | 说明 |
|------|----------|------|
| r170 (0.170.0) | 2024-12 | 最新稳定版，WebGPU支持改进 |
| r168 (0.168.0) | 2024-10 | 稳定，MeshPhysicalMaterial改进 |
| r163 (0.163.0) | 2024-04 | ⚠️ 移除了 examples/js（纯ESM） |
| r152 (0.152.0) | 2023-05 | 最后支持 examples/js 的大版本 |

**推荐：r170**（最新稳定版），用 ES Module + importmap。如果需要传统 script 标签兼容，用 r152。

### 3.4 离线可用方案

**方案：CDN fallback + 本地缓存**

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  }
}
</script>
```

首次加载后浏览器会缓存。如果需要完全离线：
1. 下载 three.module.js 到本地
2. 下载所需的 addons（OrbitControls, STLLoader等）
3. importmap 指向本地路径
4. 用本地HTTP服务器访问

**我们模板的策略：用CDN importmap，简单可靠。需要离线时切换成本地路径。**

---

## 4. 产品展示模板设计要点

见 `/Volumes/T7 Shield/realworldclaw/tools/render/threejs-product-viewer.html`

### 设计决策：
- **CDN importmap** 加载 Three.js r170 — 简单、可缓存
- **STL base64 内嵌** — 兼容 file:// 协议
- **Procedural 环境光** — 不需要额外HDRI文件，用 PMREMGenerator 从场景生成
- **MeshPhysicalMaterial** 白色塑料预设 — 最适合3D打印预览
- **OrbitControls** + 自动旋转 — 交互 + 展示双模式
- **URL参数** — `?autoRotate=false&cameraAngle=45` 可控制行为
- **响应式** — 自动适配窗口大小
- **轻量后处理** — 只用色调映射，不加Bloom/SSAO（保持轻量）

### STL 内嵌方法：
```bash
# 生成 base64
base64 -i model.stl | tr -d '\n' > model.b64
# 然后粘贴到 HTML 的 MODEL_BASE64 变量中
```

---

## 关键经验总结 🎯

1. **环境光 > 直射光** — 产品展示80%的质感来自环境贴图
2. **ACES色调映射必开** — 让高光自然过渡，不爆白
3. **GLB > STL** — Web展示首选GLB，但3D打印用STL也够用（自己加材质）
4. **Procedural环境可以很好** — 不一定需要HDRI文件
5. **像素比控制在2以内** — `setPixelRatio(Math.min(dpr, 2))`，Mac Retina会爆显存
6. **OrbitControls的damping** — `enableDamping: true` 让旋转有物理感
7. **单文件HTML** — 对于工具类页面，单文件比npm项目更实用
