# Three.js 产品可视化行业最佳实践指南

> 调研日期：2026-02-21
> 目的：学习专业级3D产品展示技术，升级RealWorldClaw的产品展示质量

---

## 目录
1. [优秀案例分析](#1-优秀案例分析)
2. [专业级材质和光照](#2-专业级材质和光照)
3. [高质量产品外壳建模](#3-高质量产品外壳建模)
4. [产品查看器最佳实践](#4-产品查看器最佳实践)
5. [开源库和工具](#5-开源库和工具)
6. [Blender到Three.js工作流](#6-blender到threejs工作流)
7. [RealWorldClaw产品展示升级方案](#7-realworldclaw产品展示升级方案)

---

## 1. 优秀案例分析

### Apple 产品页（AirPods/iPhone/MacBook）
- **技术方案**：**不是**Three.js！Apple用的是**预渲染图片序列 + Canvas 2D**
  - 在3D软件（Cinema 4D等）中离线渲染数百帧图片
  - 用Canvas drawImage逐帧绘制，根据scroll进度切换帧
  - 优点：画质极高（离线渲染质量）、兼容性好
  - 缺点：需下载大量图片（通常100-300帧，几MB到几十MB）、滚动有时卡顿
- **交互**：纯scroll驱动，无鼠标拖拽3D交互
- **性能优化**：图片序列lazy load、WebP格式、requestAnimationFrame节流
- **启示**：如果只需要"滚动播放动画"而非实时3D交互，图片序列是更简单高效的方案

```javascript
// Apple风格的滚动帧动画（简化版）
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
const frameCount = 148;
const images = [];

// 预加载所有帧
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = `/frames/frame_${String(i).padStart(4, '0')}.webp`;
  images.push(img);
}

window.addEventListener('scroll', () => {
  const scrollFraction = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  const frameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
  requestAnimationFrame(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(images[frameIndex], 0, 0);
  });
});
```

### GitHub Globe
- **技术**：**Three.js** WebGL
- **模型**：纯代码建模 — 球体 + ~12,000个CircleBufferGeometry小圆点表示陆地
- **材质/光照**：4盏灯照射球体、自定义shader做光晕（halo）、无纹理贴图
- **结构**：5层 — halo、globe、Earth regions、蓝色spikes（open PR）、粉色arcs（merged PR）
- **交互**：自动旋转 + hover显示PR详情 + 点击跳转
- **性能优化**：根据设备性能调整圆点密度、InstancedMesh合并绘制、requestAnimationFrame
- **参考**：https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/

```javascript
// GitHub Globe 陆地点阵生成（简化版）
const dotDensity = 0.005; // 根据设备性能调整
const GLOBE_RADIUS = 100;
const DEG2RAD = Math.PI / 180;
const rows = 180;

for (let lat = -90; lat <= 90; lat += 180 / rows) {
  const radius = Math.cos(Math.abs(lat) * DEG2RAD) * GLOBE_RADIUS;
  const circumference = radius * Math.PI * 2;
  const dotsForLat = circumference * dotDensity;
  for (let x = 0; x < dotsForLat; x++) {
    const long = -180 + x * 360 / dotsForLat;
    if (!isLand(long, lat)) continue; // 检查是否在陆地上
    // 将经纬度转换为3D坐标，添加CircleGeometry
  }
}
```

### Bruno Simon 个人网站 (bruno-simon.com)
- **技术**：Three.js + Cannon.js（物理引擎）
- **模型**：Blender建模 → GLTF导出 → Three.js加载
- **材质**：低多边形风格，简单的MeshStandardMaterial
- **交互**：键盘/触摸驱动小车在3D场景中移动，物理碰撞
- **性能优化**：低多边形风格本身就轻量、LOD、纹理压缩
- **启示**：Three.js可以做完整的交互式3D网站，但需要大量优化工作

### Linear.app
- **技术**：主要用CSS动画 + 少量WebGL（着色器背景）
- **不是传统3D产品展示**，更偏向动效设计
- **启示**：好的产品展示不一定需要3D，精致的2D动画同样有冲击力

### Samsung/Sony 产品页
- **技术**：混合方案 — 部分用图片序列（类Apple）、部分用嵌入式3D查看器
- **3D查看器**部分通常使用Three.js或自研WebGL方案
- **模型**：专业3D建模软件制作，GLTF/GLB格式
- **交互**：OrbitControls拖拽旋转、颜色切换

### Sketchfab
- **技术**：自研WebGL渲染器（非Three.js，但概念类似）
- **标准**：GLTF 2.0为核心格式
- **材质**：完整PBR工作流（metallic-roughness）
- **功能**：注释系统、AR查看、嵌入式播放器
- **启示**：产品展示的"行业标准"功能集 — 旋转、缩放、注释、AR

### 案例总结

| 案例 | 技术 | 模型来源 | 核心手段 |
|------|------|----------|----------|
| Apple | Canvas 2D + 图片序列 | 离线渲染 | 极高画质，无实时交互 |
| GitHub Globe | Three.js | 纯代码 | 自定义shader + 数据驱动 |
| Bruno Simon | Three.js + Cannon | Blender→GLTF | 物理引擎交互 |
| Linear | CSS + WebGL shader | 无3D模型 | 动效设计 |
| Samsung/Sony | Three.js/图片混合 | 专业建模→GLTF | 标准产品查看器 |
| Sketchfab | 自研WebGL | 用户上传GLTF | PBR + 注释 + AR |

---

## 2. 专业级材质和光照

### 2.1 PBR材质（MeshPhysicalMaterial）

Three.js的`MeshPhysicalMaterial`是产品展示的核心材质，支持完整的PBR参数：

```javascript
const material = new THREE.MeshPhysicalMaterial({
  // 基础PBR
  color: 0xffffff,
  metalness: 0.0,         // 0=非金属（塑料）, 1=金属
  roughness: 0.2,         // 0=镜面光滑, 1=完全粗糙
  
  // 高级效果（MeshPhysicalMaterial独有）
  clearcoat: 1.0,         // 清漆层（汽车漆、手机屏幕）
  clearcoatRoughness: 0.1,
  
  // 透明/玻璃效果
  transmission: 0.95,     // 透光度（玻璃）
  thickness: 2.0,         // 材质厚度
  ior: 1.5,               // 折射率（玻璃1.5, 水1.33, 钻石2.42）
  
  // 光泽效果
  sheen: 1.0,             // 丝绸/织物光泽
  sheenRoughness: 0.5,
  sheenColor: new THREE.Color(0.5, 0.5, 0.5),
  
  // 彩虹色/薄膜干涉
  iridescence: 1.0,       // 类似肥皂泡/CD光盘
  iridescenceIOR: 1.3,
  
  // 各向异性（拉丝金属效果）
  anisotropy: 1.0,
  anisotropyRotation: 0,
});
```

**常见产品材质参数速查：**

| 材质类型 | metalness | roughness | 其他参数 |
|---------|-----------|-----------|---------|
| 抛光塑料 | 0.0 | 0.1-0.3 | clearcoat: 0.5 |
| 磨砂塑料 | 0.0 | 0.5-0.7 | — |
| 拉丝铝 | 1.0 | 0.3-0.4 | anisotropy: 0.8 |
| 抛光不锈钢 | 1.0 | 0.05-0.15 | — |
| 橡胶 | 0.0 | 0.8-1.0 | — |
| 玻璃/屏幕 | 0.0 | 0.0-0.05 | transmission: 0.95, ior: 1.5 |
| 碳纤维 | 0.0 | 0.3 | normalMap + 碳纤维纹理 |
| 皮革 | 0.0 | 0.6-0.8 | normalMap + 皮革纹理 |

### 2.2 环境贴图（HDR/IBL）

环境贴图是让3D产品看起来真实的**最重要因素**，没有之一。

```javascript
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';

// 方法1：RGBELoader 加载HDR
const pmremGenerator = new PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader()
  .setPath('/textures/hdr/')
  .load('studio_small_09_1k.hdr', (texture) => {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;    // 影响所有PBR材质的反射
    // scene.background = envMap;  // 可选：也作为背景
    texture.dispose();
    pmremGenerator.dispose();
  });

// 方法2：React Three Fiber + drei（推荐，更简洁）
import { Environment } from '@react-three/drei';

<Environment
  files="/textures/hdr/studio_small_09_1k.hdr"
  // 或使用预设:
  // preset="studio"  // city, sunset, dawn, night, warehouse, forest, apartment, studio, park, lobby
/>
```

**免费HDR资源：**
- **Poly Haven**：https://polyhaven.com/hdris — 最佳选择，CC0协议，数百个高质量HDR
  - 产品摄影推荐：`studio_small_09`、`photo_studio_loft_hall`
- **iHDRI**：https://www.ihdri.com/ — 免费室内HDR
- **HDRI Haven（已合并到Poly Haven）**
- **drei预设**：`studio`/`apartment`/`warehouse` — 开箱即用

**HDR选择建议：**
- 产品展示 → 摄影棚HDR（均匀柔和的反射）
- 户外产品 → 户外环境HDR
- 科技感 → 暗色调的城市夜景HDR
- 分辨率：1K-2K足够（4K以上浪费内存）

### 2.3 产品摄影三点布光

模拟专业产品摄影棚的灯光设置：

```javascript
// 产品摄影三点布光
function setupProductLighting(scene) {
  // 1. 主光（Key Light）— 主要照明，稍偏右上方
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(5, 8, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);

  // 2. 补光（Fill Light）— 柔和补充左侧阴影
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(-5, 3, 3);
  scene.add(fillLight);

  // 3. 背光/轮廓光（Rim Light）— 从背后勾勒轮廓
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
  rimLight.position.set(0, 5, -5);
  scene.add(rimLight);

  // 4. 环境光 — 全局基础照明（避免纯黑阴影）
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // 5.（可选）地面反射光 — 模拟桌面反射
  const bounceLight = new THREE.DirectionalLight(0xffffff, 0.2);
  bounceLight.position.set(0, -3, 0);
  scene.add(bounceLight);
}
```

**💡 关键技巧：** 在有HDR环境贴图的情况下，通常只需1-2盏额外灯光做重点照明，环境贴图会提供大部分全局照明。

### 2.4 地面反射和阴影

```javascript
// 方法1：Contact Shadow（drei）— 最简单，效果好
import { ContactShadows } from '@react-three/drei';

<ContactShadows
  position={[0, -0.5, 0]}   // 地面位置
  opacity={0.4}               // 阴影不透明度
  scale={10}                  // 阴影范围
  blur={2.5}                  // 模糊程度
  far={4}                     // 最远距离
  color="#000000"
/>

// 方法2：Reflector（地面镜面反射）
import { Reflector } from '@react-three/drei';

<Reflector
  resolution={512}
  args={[10, 10]}              // 平面大小
  mirror={0.5}                 // 反射强度
  mixBlur={8}                  // 反射模糊
  mixStrength={0.6}            // 混合强度
  rotation={[-Math.PI / 2, 0, 0]}
  position={[0, -0.5, 0]}
>
  {(Material, props) => (
    <Material color="#a0a0a0" {...props} />
  )}
</Reflector>

// 方法3：原生Three.js Contact Shadow（不用React）
// 参考：https://threejs.org/examples/webgl_shadow_contact.html
// 原理：从上方正交相机渲染深度 → 高斯模糊 → 投影到地面平面
```

### 2.5 后期处理（Post-processing）

```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// 设置后期处理管线
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// SSAO — 环境光遮蔽（缝隙处的阴影，增加深度感）
const ssaoPass = new SSAOPass(scene, camera, width, height);
ssaoPass.kernelRadius = 16;
ssaoPass.minDistance = 0.005;
ssaoPass.maxDistance = 0.1;
composer.addPass(ssaoPass);

// Bloom — 发光效果（高光溢出）
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(width, height),
  0.3,    // strength（产品展示建议0.1-0.5，别太强）
  0.4,    // radius
  0.85    // threshold
);
composer.addPass(bloomPass);

// FXAA — 抗锯齿
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
composer.addPass(fxaaPass);

// Tone Mapping（在renderer上设置）
renderer.toneMapping = THREE.ACESFilmicToneMapping;  // 电影级色调映射
renderer.toneMappingExposure = 1.0;                   // 曝光度
renderer.outputColorSpace = THREE.SRGBColorSpace;     // sRGB色彩空间

// React Three Fiber 写法（使用@react-three/postprocessing）
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';

<EffectComposer>
  <SSAO radius={0.05} intensity={30} luminanceInfluence={0.5} />
  <Bloom luminanceThreshold={0.8} intensity={0.3} />
</EffectComposer>
```

**Tone Mapping 选项对比：**
| 方案 | 效果 | 推荐场景 |
|------|------|---------|
| `THREE.ACESFilmicToneMapping` | 电影感，高光柔和压缩 | **产品展示首选** |
| `THREE.ReinhardToneMapping` | 自然过渡 | 室外场景 |
| `THREE.CineonToneMapping` | 胶片感 | 艺术展示 |
| `THREE.AgXToneMapping` | 最新，色彩准确 | Three.js r160+ |
| `THREE.NoToneMapping` | 无映射 | 线性工作流调试 |

---

## 3. 高质量产品外壳建模

### 3.1 代码建模的极限

**纯Three.js代码能做到什么？**
- ✅ 简单几何体组合（盒子、圆柱、球）
- ✅ Lathe旋转体（水杯、花瓶等轴对称物体）
- ✅ Extrude拉伸（从2D轮廓到3D，如文字、Logo）
- ✅ Parametric曲面（数学公式定义的曲面）
- ❌ 复杂有机形状（鼠标外壳、手机曲面）
- ❌ 精确倒角和圆角
- ❌ 细节纹理（散热孔、按钮凹陷）

**结论：代码建模适合简单/风格化物体。消费电子产品必须用Blender等外部工具。**

```javascript
// 代码建模示例：简单的圆角盒子
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const geometry = new RoundedBoxGeometry(
  2,     // width
  1,     // height
  0.5,   // depth
  4,     // segments（细分级别，越高越圆滑）
  0.1    // radius（圆角半径）
);
const mesh = new THREE.Mesh(geometry, material);
```

### 3.2 CSG（构造实体几何）布尔运算

用布尔运算（并集/差集/交集）组合简单几何体构建复杂形状：

```javascript
// 推荐库：three-bvh-csg（性能最好）
// npm install three-bvh-csg
import { Evaluator, Brush, SUBTRACTION, ADDITION } from 'three-bvh-csg';

const evaluator = new Evaluator();

// 创建基础外壳
const body = new Brush(new RoundedBoxGeometry(3, 1.5, 0.3, 4, 0.08));
body.material = material;

// 挖出屏幕凹槽
const screenCutout = new Brush(new THREE.BoxGeometry(2.6, 1.2, 0.1));
screenCutout.position.set(0, 0, 0.11);
screenCutout.updateMatrixWorld();

// 布尔差集：从外壳中减去屏幕区域
const result = evaluator.evaluate(body, screenCutout, SUBTRACTION);
scene.add(result);
```

**CSG库对比：**
| 库 | 性能 | 功能 | 推荐度 |
|---|------|------|--------|
| `three-bvh-csg` | ⚡快（BVH加速） | 完整布尔运算 | ⭐⭐⭐⭐⭐ |
| `three-csg-ts` | 中等 | 基本布尔运算 | ⭐⭐⭐ |
| `csg.js` (原版) | 慢 | 基本布尔运算 | ⭐⭐ |

### 3.3 圆角/倒角

消费电子产品的圆润感来自圆角。在Three.js代码中实现圆角的方法：

```javascript
// 方法1：RoundedBoxGeometry（内置）
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// 方法2：ExtrudeGeometry + bevelEnabled
const shape = new THREE.Shape();
// 用moveTo/lineTo/quadraticCurveTo绘制圆角矩形轮廓
const roundedRect = (shape, x, y, width, height, radius) => {
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
};

roundedRect(shape, -1.5, -0.75, 3, 1.5, 0.15);

const geometry = new THREE.ExtrudeGeometry(shape, {
  depth: 0.3,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.05,
  bevelSegments: 8,  // 越大越圆滑
});

// 方法3（推荐）：在Blender中做好圆角，导出GLTF
```

### 3.4 细节纹理实现

```javascript
// 散热孔/speaker mesh — 使用Alpha贴图或法线贴图
const speakerMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x333333,
  metalness: 0.8,
  roughness: 0.3,
  alphaMap: textureLoader.load('/textures/speaker_holes_alpha.png'),
  transparent: true,
  normalMap: textureLoader.load('/textures/speaker_holes_normal.png'),
  normalScale: new THREE.Vector2(1, 1),
});

// 按钮凹陷 — 使用displacement map或法线贴图
// 小的凹陷细节用normalMap即可，大的凹陷需要实际的几何体
```

**最终建议：对于RealWorldClaw这样的产品，纯代码建模+CSG可以做出"还行"的效果，但要达到"专业级"，必须走Blender建模路线。**

---

## 4. 产品查看器最佳实践

### 4.1 相机控制

```javascript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);

// 产品查看器推荐配置
controls.enableDamping = true;      // 惯性阻尼（必须开）
controls.dampingFactor = 0.05;       // 阻尼系数
controls.enablePan = false;          // 禁止平移（产品展示通常不需要）
controls.minDistance = 2;            // 最近距离
controls.maxDistance = 10;           // 最远距离
controls.minPolarAngle = Math.PI * 0.2;  // 限制垂直角度（不让看到底部）
controls.maxPolarAngle = Math.PI * 0.8;
controls.autoRotate = true;          // 自动旋转
controls.autoRotateSpeed = 1.0;      // 旋转速度

// 用户交互时停止自动旋转，idle后恢复
let idleTimer;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
  clearTimeout(idleTimer);
});
controls.addEventListener('end', () => {
  idleTimer = setTimeout(() => {
    controls.autoRotate = true;
  }, 3000); // 3秒无操作后恢复自动旋转
});

// 动画循环中更新
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // enableDamping时必须调用
  renderer.render(scene, camera);
}
```

### 4.2 相机动画（视角切换）

```javascript
import gsap from 'gsap';

// 平滑切换到某个预设视角
function animateToView(targetPosition, targetLookAt, duration = 1.5) {
  controls.enabled = false; // 动画期间禁用手动控制
  
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => camera.lookAt(targetLookAt),
    onComplete: () => { controls.enabled = true; }
  });
  
  gsap.to(controls.target, {
    x: targetLookAt.x,
    y: targetLookAt.y,
    z: targetLookAt.z,
    duration,
    ease: 'power2.inOut',
  });
}

// 预设视角
const views = {
  front: { position: { x: 0, y: 0, z: 5 }, target: { x: 0, y: 0, z: 0 } },
  top:   { position: { x: 0, y: 5, z: 0.1 }, target: { x: 0, y: 0, z: 0 } },
  back:  { position: { x: 0, y: 0, z: -5 }, target: { x: 0, y: 0, z: 0 } },
  detail:{ position: { x: 1, y: 0.5, z: 2 }, target: { x: 0.5, y: 0, z: 0 } },
};
```

### 4.3 注释系统

```javascript
// React Three Fiber + drei 的 Html 组件
import { Html } from '@react-three/drei';

function Annotation({ position, label, description }) {
  const [visible, setVisible] = useState(false);
  return (
    <group position={position}>
      {/* 标记点 */}
      <mesh onClick={() => setVisible(!visible)}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
      
      {/* HTML标注（自动跟随3D位置） */}
      <Html distanceFactor={5} occlude>
        <div className="annotation-dot" onClick={() => setVisible(!visible)}>
          <span>+</span>
        </div>
        {visible && (
          <div className="annotation-panel">
            <h3>{label}</h3>
            <p>{description}</p>
          </div>
        )}
      </Html>
    </group>
  );
}
```

### 4.4 爆炸图效果

```javascript
// 爆炸图：将每个零件沿其相对于中心的方向移出
function explode(model, factor = 2.0) {
  const center = new THREE.Vector3();
  const box = new THREE.Box3().setFromObject(model);
  box.getCenter(center);
  
  model.traverse((child) => {
    if (child.isMesh) {
      // 保存原始位置
      if (!child.userData.originalPosition) {
        child.userData.originalPosition = child.position.clone();
      }
      
      // 计算爆炸方向（从中心指向零件）
      const direction = new THREE.Vector3()
        .subVectors(child.position, center)
        .normalize();
      
      // 用GSAP动画
      const targetPos = child.userData.originalPosition.clone()
        .add(direction.multiplyScalar(factor));
      
      gsap.to(child.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.0,
        ease: 'power2.out',
      });
    }
  });
}

// 收回
function implode(model) {
  model.traverse((child) => {
    if (child.isMesh && child.userData.originalPosition) {
      gsap.to(child.position, {
        x: child.userData.originalPosition.x,
        y: child.userData.originalPosition.y,
        z: child.userData.originalPosition.z,
        duration: 1.0,
        ease: 'power2.inOut',
      });
    }
  });
}
```

### 4.5 颜色/材质切换

```javascript
// 颜色切换
function changeColor(model, partName, newColor) {
  model.traverse((child) => {
    if (child.isMesh && child.name === partName) {
      gsap.to(child.material.color, {
        r: new THREE.Color(newColor).r,
        g: new THREE.Color(newColor).g,
        b: new THREE.Color(newColor).b,
        duration: 0.5,
      });
    }
  });
}

// 材质切换（如：光面/磨砂）
const materialPresets = {
  glossy: { roughness: 0.1, metalness: 0.0, clearcoat: 1.0 },
  matte:  { roughness: 0.7, metalness: 0.0, clearcoat: 0.0 },
  metal:  { roughness: 0.2, metalness: 1.0, clearcoat: 0.0 },
};

function switchMaterial(model, preset) {
  const params = materialPresets[preset];
  model.traverse((child) => {
    if (child.isMesh) {
      gsap.to(child.material, { ...params, duration: 0.5 });
    }
  });
}
```

### 4.6 移动端优化

```javascript
// 检测移动端并降低质量
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

// 降低分辨率
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

// 降低阴影质量
if (isMobile) {
  directionalLight.shadow.mapSize.set(512, 512); // 而非2048
}

// 移动端禁用后期处理
if (isMobile) {
  // 不使用SSAO/Bloom，直接renderer.render()
}

// 触摸控制已由OrbitControls内置支持
// 单指=旋转、双指=缩放、三指=平移
```

### 4.7 加载优化

```javascript
// 1. 显示加载进度
const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => {
  const progress = (loaded / total) * 100;
  document.getElementById('loader').style.width = `${progress}%`;
};
manager.onLoad = () => {
  document.getElementById('loader').classList.add('hidden');
};

// 2. LOD（Level of Detail）
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);    // 近处：高细节
lod.addLevel(mediumDetailMesh, 5);  // 中距离：中等细节
lod.addLevel(lowDetailMesh, 15);    // 远处：低细节
scene.add(lod);

// 3. 使用Suspense占位（React Three Fiber）
import { useGLTF } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('/model.glb');
  return <primitive object={scene} />;
}

// 预加载
useGLTF.preload('/model.glb');
```

---

## 5. 开源库和工具

### 5.1 Google `<model-viewer>`

Web Component，最简单的3D产品展示方案：

```html
<!-- npm install @google/model-viewer 或 CDN -->
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>

<model-viewer
  src="/model.glb"
  alt="Product"
  auto-rotate
  camera-controls
  shadow-intensity="1"
  shadow-softness="0.5"
  environment-image="/hdr/studio.hdr"
  tone-mapping="aces"
  exposure="1.0"
  ar
  ar-modes="webxr scene-viewer quick-look"
  poster="/poster.webp"
  loading="lazy"
  style="width: 100%; height: 500px;"
>
  <!-- 注释 -->
  <button slot="hotspot-1" data-position="0.5 1.0 0.0" data-normal="0 1 0">
    Feature 1
  </button>
</model-viewer>
```

**优势**：零代码3D展示、内置AR、Google维护、性能优异、SEO友好
**劣势**：定制化有限、复杂交互难以实现
**GitHub**：https://github.com/google/model-viewer （7k+ stars）

### 5.2 React Three Fiber + drei

React生态中的Three.js方案，最灵活：

```jsx
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls, Environment, ContactShadows,
  useGLTF, Html, Float, Stage
} from '@react-three/drei';

function ProductViewer() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 35 }}>
      {/* Stage = 自动布光+阴影+居中，产品展示一步到位 */}
      <Stage environment="studio" intensity={0.5}>
        <Model />
      </Stage>
      <OrbitControls enablePan={false} autoRotate />
    </Canvas>
  );
}

function Model() {
  const { scene } = useGLTF('/product.glb');
  return <primitive object={scene} scale={1} />;
}
```

**drei关键组件速查：**
| 组件 | 功能 |
|------|------|
| `Stage` | 一键产品摄影棚（灯光+阴影+居中） |
| `Environment` | HDR环境贴图 |
| `ContactShadows` | 地面接触阴影 |
| `Reflector` | 地面反射 |
| `Float` | 悬浮动画 |
| `Html` | 3D空间中的HTML注释 |
| `useGLTF` | GLTF加载Hook |
| `Bounds` | 自动适配相机到模型 |
| `AccumulativeShadows` | 高质量累积阴影 |
| `Lightformer` | 自定义区域光 |

**GitHub**：https://github.com/pmndrs/drei （8k+ stars）

### 5.3 其他推荐库

| 库 | 用途 | Stars | 链接 |
|---|------|-------|------|
| `three-globe` | 地球可视化 | 1.5k+ | github.com/vasturiano/three-globe |
| `three-bvh-csg` | 快速CSG布尔运算 | 500+ | github.com/gkjohnson/three-bvh-csg |
| `gltf-transform` | GLTF优化CLI | 1k+ | github.com/donmccurdy/glTF-Transform |
| `three-mesh-bvh` | 射线碰撞加速 | 2k+ | github.com/gkjohnson/three-mesh-bvh |
| `leva` | 调试UI面板 | 5k+ | github.com/pmndrs/leva |
| `theatre.js` | 动画编辑器 | 11k+ | github.com/theatre-js/theatre |

---

## 6. Blender到Three.js工作流

### 6.1 完整工作流

```
Blender建模 → Principled BSDF材质 → GLTF 2.0导出 → gltf-transform优化 → Three.js加载
```

### 6.2 Blender导出设置

1. **材质**：必须使用 **Principled BSDF** 节点（自动映射到Three.js的MeshStandardMaterial）
   - Base Color → color/map
   - Metallic → metalness
   - Roughness → roughness
   - Normal → normalMap
   - Emission → emissive/emissiveMap

2. **导出设置**（File → Export → glTF 2.0）：
   - Format: **GLB**（单文件，推荐）或GLTF+Bin+Textures（调试用）
   - ✅ Export Materials
   - ✅ Export Texture Coordinates
   - ✅ Export Normals
   - ✅ Export Colors（如果有顶点色）
   - ✅ Apply Modifiers（应用所有修改器）
   - Compression: ✅ Draco（如果模型大于1MB）

3. **注意事项**：
   - Blender的Subsurface/Transmission/Clearcoat等高级参数在GLTF中通过扩展支持
   - UV展开质量直接影响Three.js中的纹理效果
   - 检查法线方向（Blender中开启Face Orientation查看蓝色=正面）

### 6.3 动画传递

```javascript
// Blender中的动画类型 → Three.js支持情况：
// ✅ 骨骼动画（Armature/Bones）→ AnimationClip
// ✅ 形变动画（Shape Keys）→ Morph Targets
// ✅ 物体变换动画（Location/Rotation/Scale keyframes）→ AnimationClip
// ❌ 物理模拟（需要烘焙为关键帧后导出）
// ❌ 粒子系统（不支持）

// Three.js中播放GLTF动画
const loader = new GLTFLoader();
loader.load('/model.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);
  
  const mixer = new THREE.AnimationMixer(model);
  
  // 播放所有动画
  gltf.animations.forEach((clip) => {
    mixer.clipAction(clip).play();
  });
  
  // 在动画循环中更新
  function animate() {
    requestAnimationFrame(animate);
    mixer.update(clock.getDelta());
    renderer.render(scene, camera);
  }
});
```

### 6.4 文件大小优化

```bash
# 1. 使用gltf-transform CLI优化
npm install -g @gltf-transform/cli

# Draco压缩（几何体压缩，通常减少60-90%）
gltf-transform draco input.glb output.glb

# 纹理压缩为WebP（减少50-80%）
gltf-transform webp input.glb output.glb --quality 80

# 纹理压缩为KTX2/Basis（GPU原生格式，最优）
gltf-transform ktx2 input.glb output.glb --slots "baseColor,normal,emissive"

# 合并优化管线
gltf-transform optimize input.glb output.glb \
  --compress draco \
  --texture-compress webp

# 2. 纹理分辨率控制
gltf-transform resize input.glb output.glb --width 1024 --height 1024

# 3. 去除未使用的数据
gltf-transform prune input.glb output.glb
gltf-transform dedup input.glb output.glb
```

**Three.js中加载压缩模型：**

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); // 需要draco decoder WASM文件

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('/basis/'); // 需要basis transcoder文件

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setKTX2Loader(ktx2Loader.detectSupport(renderer));

gltfLoader.load('/product.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

**优化效果参考：**
| 优化步骤 | 原始大小 | 优化后 | 压缩率 |
|---------|---------|--------|--------|
| 无优化 | 50MB | 50MB | 0% |
| Draco几何压缩 | 50MB | 10MB | 80% |
| +WebP纹理 | 10MB | 4MB | 60% |
| +KTX2纹理 | 10MB | 2.5MB | 75% |
| +Prune/Dedup | 2.5MB | 2MB | 20% |

---

## 7. RealWorldClaw产品展示升级方案

### 当前问题
- Three.js代码建模出来的外壳形状粗糙
- 缺少PBR材质和环境贴图
- 无专业灯光设置
- 缺少后期处理

### 升级路线图

#### Phase 1：快速提升（1-2天，不改建模方式）
1. **加HDR环境贴图**：使用Poly Haven的studio HDR，这一步效果提升最大
2. **调PBR材质参数**：根据上面的材质速查表调整roughness/metalness
3. **设置ACES Tone Mapping**：`renderer.toneMapping = THREE.ACESFilmicToneMapping`
4. **加Contact Shadow**：地面软阴影
5. **改善灯光**：三点布光方案

```javascript
// 最小改动，最大提升的配置
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// 加载环境贴图（选一个studio风格的）
new RGBELoader().load('/hdr/studio.hdr', (texture) => {
  scene.environment = pmremGenerator.fromEquirectangular(texture).texture;
});
```

#### Phase 2：模型升级（3-5天）
1. **Blender建模**：用Blender重做外壳，精确的圆角和细节
2. **导出GLB**：Principled BSDF材质 → GLTF导出
3. **gltf-transform优化**：Draco + WebP压缩
4. **加载到现有场景**：替换代码建模的部分

#### Phase 3：交互完善（2-3天）
1. **OrbitControls优化**：自动旋转+惯性+限制角度
2. **视角预设**：正面/侧面/顶部一键切换
3. **注释系统**：关键功能点标注
4. **颜色切换**：展示不同颜色版本

#### Phase 4：高级效果（可选）
1. **爆炸图**：展示内部结构
2. **后期处理**：轻量Bloom + SSAO
3. **滚动动画**：Apple风格的scroll-driven 3D动画
4. **`<model-viewer>`集成**：作为备选的轻量方案

### 技术选型建议

| 场景 | 推荐方案 |
|------|---------|
| 快速原型/简单展示 | `<model-viewer>` — 最少代码 |
| 自定义交互/React项目 | React Three Fiber + drei — 最灵活 |
| 非React项目 | 原生Three.js + OrbitControls |
| 极致画质（非实时） | Apple式图片序列 |

### 关键原则
1. **环境贴图 > 灯光 > 材质参数 > 后期处理**（按影响力排序）
2. **外部建模 > 代码建模**（消费电子产品必须用Blender）
3. **先做好基础（PBR+HDR），再加花哨效果**
4. **移动端优先考虑性能**
5. **GLTF/GLB是唯一推荐的模型格式**

---

## 参考链接

- Three.js官方文档：https://threejs.org/docs/
- Three.js Journey（最佳教程）：https://threejs-journey.com/
- Discover Three.js：https://discoverthreejs.com/
- React Three Fiber：https://r3f.docs.pmnd.rs/
- drei文档：https://drei.docs.pmnd.rs/
- Poly Haven HDR：https://polyhaven.com/hdris
- model-viewer：https://modelviewer.dev/
- gltf-transform CLI：https://gltf-transform.dev/
- GitHub Globe博客：https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/
- Apple风格滚动动画教程：https://www.builder.io/blog/webgl-scroll-animation
- three-bvh-csg：https://github.com/gkjohnson/three-bvh-csg
- Sketchfab（免费3D模型参考）：https://sketchfab.com/
- Theatre.js（动画编辑器）：https://www.theatrejs.com/
