"""
Blender STL 产品渲染脚本
用法: blender --background --python blender-render.py -- [选项]

选项:
  --stl PATH        STL文件路径（必需）
  --output PATH     输出PNG路径（默认: render.png）
  --engine          渲染引擎: CYCLES / BLENDER_EEVEE_NEXT（默认: CYCLES）
  --samples N       采样数（默认: 128）
  --hdri PATH       HDRI环境贴图路径（可选）
  --width N         输出宽度（默认: 1920）
  --height N        输出高度（默认: 1080）
  --color R,G,B     PLA颜色 0-1范围（默认: 0.95,0.95,0.95）
  --camera-angle    相机预设: front/three-quarter/top（默认: three-quarter）
"""

import bpy
import sys
import os
import math
from mathutils import Vector


def parse_args():
    """解析 -- 后面的参数"""
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    args = {
        "stl": None,
        "output": "render.png",
        "engine": "CYCLES",
        "samples": 128,
        "hdri": None,
        "width": 1920,
        "height": 1080,
        "color": (0.95, 0.95, 0.95),
        "camera_angle": "three-quarter",
    }

    i = 0
    while i < len(argv):
        if argv[i] == "--stl" and i + 1 < len(argv):
            args["stl"] = argv[i + 1]; i += 2
        elif argv[i] == "--output" and i + 1 < len(argv):
            args["output"] = argv[i + 1]; i += 2
        elif argv[i] == "--engine" and i + 1 < len(argv):
            args["engine"] = argv[i + 1]; i += 2
        elif argv[i] == "--samples" and i + 1 < len(argv):
            args["samples"] = int(argv[i + 1]); i += 2
        elif argv[i] == "--hdri" and i + 1 < len(argv):
            args["hdri"] = argv[i + 1]; i += 2
        elif argv[i] == "--width" and i + 1 < len(argv):
            args["width"] = int(argv[i + 1]); i += 2
        elif argv[i] == "--height" and i + 1 < len(argv):
            args["height"] = int(argv[i + 1]); i += 2
        elif argv[i] == "--color" and i + 1 < len(argv):
            args["color"] = tuple(float(x) for x in argv[i + 1].split(",")); i += 2
        elif argv[i] == "--camera-angle" and i + 1 < len(argv):
            args["camera_angle"] = argv[i + 1]; i += 2
        else:
            i += 1

    if not args["stl"]:
        print("错误: 必须指定 --stl 参数")
        sys.exit(1)

    return args


def clean_scene():
    """清空默认场景"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # 清理孤立数据
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)


def import_stl(filepath):
    """导入STL文件"""
    filepath = os.path.abspath(filepath)
    if not os.path.exists(filepath):
        print(f"错误: 文件不存在 {filepath}")
        sys.exit(1)

    # Blender 4.x 用 wm.stl_import，3.x 用 import_mesh.stl
    try:
        bpy.ops.wm.stl_import(filepath=filepath)
    except AttributeError:
        bpy.ops.import_mesh.stl(filepath=filepath)

    obj = bpy.context.selected_objects[0]
    # 居中到原点
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    obj.location = (0, 0, 0)
    return obj


def setup_pla_material(obj, color):
    """设置白色PLA塑料材质"""
    mat = bpy.data.materials.new("PLA_White")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    principled = nodes["Principled BSDF"]

    # PLA 塑料参数
    principled.inputs["Base Color"].default_value = (*color, 1.0)
    principled.inputs["Roughness"].default_value = 0.3
    principled.inputs["Metallic"].default_value = 0.0

    # 微透光 (SSS) - Blender 4.x 参数名
    try:
        principled.inputs["Subsurface Weight"].default_value = 0.05
        principled.inputs["Subsurface Radius"].default_value = (0.01, 0.01, 0.01)
    except KeyError:
        # Blender 3.x fallback
        try:
            principled.inputs["Subsurface"].default_value = 0.05
        except KeyError:
            pass

    # IOR for plastic
    try:
        principled.inputs["Specular IOR Level"].default_value = 0.5
    except KeyError:
        try:
            principled.inputs["Specular"].default_value = 0.5
        except KeyError:
            pass

    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return mat


def setup_three_point_lighting(target_size):
    """三点光源布局"""
    dist = target_size * 3

    # Key light（主光）- 稍暖
    key = bpy.data.lights.new("Key", type='AREA')
    key.energy = 200
    key.size = target_size * 1.5
    key.color = (1.0, 0.98, 0.95)
    key_obj = bpy.data.objects.new("Key", key)
    key_obj.location = (dist * 0.8, -dist * 0.6, dist * 0.8)
    key_obj.rotation_euler = (math.radians(45), 0, math.radians(30))
    bpy.context.collection.objects.link(key_obj)

    # Fill light（补光）- 稍冷、弱
    fill = bpy.data.lights.new("Fill", type='AREA')
    fill.energy = 80
    fill.size = target_size * 2
    fill.color = (0.95, 0.97, 1.0)
    fill_obj = bpy.data.objects.new("Fill", fill)
    fill_obj.location = (-dist * 0.8, -dist * 0.4, dist * 0.5)
    fill_obj.rotation_euler = (math.radians(50), 0, math.radians(-40))
    bpy.context.collection.objects.link(fill_obj)

    # Rim light（轮廓光）- 从后方
    rim = bpy.data.lights.new("Rim", type='AREA')
    rim.energy = 150
    rim.size = target_size
    rim_obj = bpy.data.objects.new("Rim", rim)
    rim_obj.location = (-dist * 0.3, dist * 0.8, dist * 0.6)
    rim_obj.rotation_euler = (math.radians(30), 0, math.radians(-160))
    bpy.context.collection.objects.link(rim_obj)


def setup_hdri(hdri_path):
    """设置HDRI环境光"""
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    bg = nodes.new("ShaderNodeBackground")
    env_tex = nodes.new("ShaderNodeTexEnvironment")
    output = nodes.new("ShaderNodeOutputWorld")

    env_tex.image = bpy.data.images.load(os.path.abspath(hdri_path))
    bg.inputs["Strength"].default_value = 0.8

    links.new(env_tex.outputs["Color"], bg.inputs["Color"])
    links.new(bg.outputs["Background"], output.inputs["Surface"])


def setup_studio_background():
    """无HDRI时，设置简洁的渐变背景"""
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()

    bg = nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.85, 0.85, 0.87, 1.0)
    bg.inputs["Strength"].default_value = 0.5
    output = nodes.new("ShaderNodeOutputWorld")
    links.new(bg.outputs["Background"], output.inputs["Surface"])


def setup_camera(obj, angle_preset):
    """设置相机"""
    # 计算物体边界
    bbox = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    center = sum(bbox, Vector()) / 8
    size = max((max(v[i] for v in bbox) - min(v[i] for v in bbox)) for i in range(3))

    cam_data = bpy.data.cameras.new("Camera")
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    dist = size * 2.5

    angles = {
        "front": (0, -dist, size * 0.3),
        "three-quarter": (dist * 0.7, -dist * 0.7, size * 0.8),
        "top": (0, -dist * 0.3, dist),
    }

    pos = angles.get(angle_preset, angles["three-quarter"])
    cam_obj.location = Vector(pos) + center

    # 对准物体中心
    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    # 镜头设置
    cam_data.lens = 85  # 人像镜头，压缩感好
    cam_data.clip_start = 0.01
    cam_data.clip_end = 1000

    return cam_obj, size


def setup_ground_plane(obj_size):
    """添加地面（产品倒影）"""
    bpy.ops.mesh.primitive_plane_add(
        size=obj_size * 10,
        location=(0, 0, -0.001)
    )
    plane = bpy.context.active_object
    mat = bpy.data.materials.new("Ground")
    mat.use_nodes = True
    principled = mat.node_tree.nodes["Principled BSDF"]
    principled.inputs["Base Color"].default_value = (0.9, 0.9, 0.9, 1.0)
    principled.inputs["Roughness"].default_value = 0.1  # 略反光
    principled.inputs["Metallic"].default_value = 0.0
    plane.data.materials.append(mat)
    return plane


def setup_render(engine, samples, width, height, output_path):
    """配置渲染设置"""
    scene = bpy.context.scene
    scene.render.engine = engine
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True  # 透明背景
    scene.render.filepath = os.path.abspath(output_path)
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

    if engine == 'CYCLES':
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
        # 优先用Metal GPU (macOS)
        prefs = bpy.context.preferences.addons.get('cycles')
        if prefs:
            prefs.preferences.compute_device_type = 'METAL'
            for device in prefs.preferences.get_devices()[0]:
                device.use = True
        scene.cycles.device = 'GPU'
    elif engine == 'BLENDER_EEVEE_NEXT':
        scene.eevee.taa_render_samples = samples


def main():
    args = parse_args()
    print(f"\n{'='*50}")
    print(f"STL渲染: {args['stl']}")
    print(f"输出: {args['output']}")
    print(f"引擎: {args['engine']} @ {args['samples']} samples")
    print(f"{'='*50}\n")

    # 1. 清空场景
    clean_scene()

    # 2. 导入STL
    obj = import_stl(args["stl"])
    print(f"已导入: {obj.name} ({len(obj.data.vertices)} vertices)")

    # 3. 设置材质
    setup_pla_material(obj, args["color"])

    # 4. 设置相机
    cam, obj_size = setup_camera(obj, args["camera_angle"])

    # 5. 设置光照
    setup_three_point_lighting(obj_size)
    if args["hdri"]:
        setup_hdri(args["hdri"])
    else:
        setup_studio_background()

    # 6. 添加地面
    setup_ground_plane(obj_size)

    # 7. 配置渲染
    setup_render(
        args["engine"], args["samples"],
        args["width"], args["height"],
        args["output"]
    )

    # 8. 渲染！
    print("开始渲染...")
    bpy.ops.render.render(write_still=True)
    print(f"渲染完成: {os.path.abspath(args['output'])}")


if __name__ == "__main__":
    main()
