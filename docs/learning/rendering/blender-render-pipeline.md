# Blender 命令行渲染管线调研

> 沸羊羊🐏 调研 | 2026-02-21

## 目标

将 OpenSCAD 生成的 STL 文件渲染成专业级产品图，全自动化、命令行驱动。

---

## 1. Blender 命令行渲染方案

### 1.1 macOS arm64 安装

```bash
# 方法1: Homebrew（推荐，自动配置PATH）
brew install --cask blender

# 方法2: 官网下载 DMG
# https://www.blender.org/download/
# 拖入 /Applications，然后建软链：
sudo ln -s /Applications/Blender.app/Contents/MacOS/Blender /usr/local/bin/blender

# 验证
blender --version
```

Blender 4.x 原生支持 Apple Silicon，Metal GPU 加速可用。

### 1.2 命令行渲染基本用法

```bash
# 用Python脚本控制，无GUI后台渲染
blender --background --python render.py

# 渲染已有.blend文件
blender --background scene.blend --render-output //output_ --render-frame 1

# 传参给Python脚本（-- 后面的参数传给脚本）
blender --background --python render.py -- --stl input.stl --output render.png
```

### 1.3 Python 脚本控制 Blender

**完全可以。** Blender 内置完整 Python 3 解释器，`bpy` 模块控制一切：

| 功能 | API |
|------|-----|
| 导入STL | `bpy.ops.wm.stl_import()` (4.x) / `bpy.ops.import_mesh.stl()` (3.x) |
| 材质 | `bpy.data.materials` + Shader Nodes |
| 光源 | `bpy.data.lights` |
| 相机 | `bpy.data.cameras` + `bpy.data.objects` |
| 渲染 | `bpy.ops.render.render()` |
| 场景设置 | `bpy.context.scene.render.*` |

### 1.4 PBR 材质：白色 PLA 塑料

PLA 塑料特征：微粗糙、微透光（SSS）、无金属感。

```python
mat = bpy.data.materials.new("PLA_White")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

principled = nodes["Principled BSDF"]
principled.inputs["Base Color"].default_value = (0.95, 0.95, 0.95, 1.0)  # 略带暖白
principled.inputs["Roughness"].default_value = 0.3
principled.inputs["Subsurface Weight"].default_value = 0.05  # 微透光(4.x)
principled.inputs["Subsurface Radius"].default_value = (0.01, 0.01, 0.01)
principled.inputs["Metallic"].default_value = 0.0
principled.inputs["Specular IOR Level"].default_value = 0.5
```

### 1.5 HDRI 环境光

```python
world = bpy.data.worlds["World"]
world.use_nodes = True
nodes = world.node_tree.nodes
links = world.node_tree.links

nodes.clear()
bg = nodes.new("ShaderNodeBackground")
env_tex = nodes.new("ShaderNodeTexEnvironment")
output = nodes.new("ShaderNodeOutputWorld")

# 下载免费HDRI: https://polyhaven.com/hdris
env_tex.image = bpy.data.images.load("/path/to/studio.hdr")
bg.inputs["Strength"].default_value = 1.0

links.new(env_tex.outputs["Color"], bg.inputs["Color"])
links.new(bg.outputs["Background"], output.inputs["Surface"])
```

免费 HDRI 推荐：
- [Poly Haven](https://polyhaven.com/hdris) — `studio_small_09` 系列很适合产品摄影
- 下载 1K 或 2K 即可，命令行: `wget https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr`

### 1.6 爆炸图（Exploded View）

Python 脚本控制每个零件的位移：

```python
import bpy
from mathutils import Vector

# 计算所有零件的几何中心
centers = {}
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        centers[obj.name] = obj.location.copy()

# 计算整体中心
overall_center = sum(centers.values(), Vector()) / len(centers)

# 沿径向方向炸开
explosion_factor = 2.0  # 调节间距
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        direction = obj.location - overall_center
        obj.location += direction * explosion_factor
```

对于多 STL 零件：
```bash
# 每个零件单独导入，命名后统一爆炸
blender --background --python explode_render.py -- \
  --parts base.stl:0,0,0 lid.stl:0,0,1 clip.stl:1,0,0 \
  --explode 1.5 --output exploded.png
```

### 1.7 场景渲染（桌面产品图）

```python
# 添加桌面平面
bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, -0.01))
plane = bpy.context.active_object

# 木纹材质
mat_table = bpy.data.materials.new("Wood")
mat_table.use_nodes = True
nodes = mat_table.node_tree.nodes
tex = nodes.new("ShaderNodeTexImage")
tex.image = bpy.data.images.load("/path/to/wood_texture.jpg")
# ... 连接到 Principled BSDF

plane.data.materials.append(mat_table)

# 添加景深（DOF）
camera = bpy.data.objects["Camera"]
camera.data.dof.use_dof = True
camera.data.dof.focus_object = product_object
camera.data.dof.aperture_fstop = 2.8
```

---

## 2. 替代方案对比

| 方案 | 渲染质量 | 自动化 | 安装体积 | 学习曲线 | 推荐度 |
|------|---------|--------|---------|---------|--------|
| **Blender + Cycles** | ⭐⭐⭐⭐⭐ 照片级 | ⭐⭐⭐⭐⭐ 完整Python API | ~1GB | 中 | ✅ **首选** |
| **Blender + EEVEE** | ⭐⭐⭐⭐ 实时级 | 同上 | 同上 | 中 | ✅ 快速预览 |
| three.js + Puppeteer | ⭐⭐⭐ 不错 | ⭐⭐⭐ 需写代码 | ~200MB | 高 | ⚠️ Web向 |
| FreeCAD | ⭐⭐ 一般 | ⭐⭐ API不稳定 | ~500MB | 高 | ❌ 不推荐渲染用 |
| POV-Ray | ⭐⭐⭐⭐ 不错 | ⭐⭐ 场景描述语言 | ~50MB | 高 | ⚠️ 小众 |
| **trimesh + pyrender** | ⭐⭐ 基础 | ⭐⭐⭐⭐ 纯Python | pip install | 低 | ⚠️ 快速预览 |
| OpenSCAD自带 | ⭐ 工程图 | ⭐⭐⭐⭐⭐ | 已有 | 无 | ❌ 不美观 |

### 结论

**Blender 是最佳选择**，理由：
1. 免费开源，macOS arm64 原生支持
2. 完整 Python API，完全可自动化
3. Cycles 渲染器达到照片级品质
4. EEVEE 可做快速预览（秒级）
5. 社区庞大，资源丰富
6. 一个工具搞定：材质、光照、爆炸图、场景渲染、动画

**快速预览备选**：trimesh + pyrender（pip install 即可，无需 Blender）

---

## 3. 推荐工作流

```
OpenSCAD (.scad)
    ↓ openscad -o part.stl
STL 文件
    ↓ blender --background --python blender-render.py -- --stl part.stl
专业产品图 (PNG)
```

### 渲染配置建议

| 场景 | 引擎 | Samples | 时间(M4) | 用途 |
|------|------|---------|----------|------|
| 快速预览 | EEVEE | - | 1-3s | 开发迭代 |
| 产品图 | Cycles | 128 | 10-30s | README/文档 |
| 高质量 | Cycles | 512 | 1-3min | 发布/展示 |

### HDRI 下载命令

```bash
# 推荐产品摄影HDRI
mkdir -p assets/hdri
wget -O assets/hdri/studio.hdr \
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr"
```

---

## 4. 脚本文件

渲染脚本位于: `tools/render/blender-render.py`

用法:
```bash
blender --background --python tools/render/blender-render.py -- \
  --stl path/to/model.stl \
  --output render.png \
  --engine CYCLES \
  --samples 128 \
  --hdri assets/hdri/studio.hdr
```
