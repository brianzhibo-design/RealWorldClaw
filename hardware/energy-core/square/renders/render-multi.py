"""
Blender多STL组装渲染脚本 - 用Blender直接组装，绕过OpenSCAD的CGAL问题
用法: blender --background --python render-multi.py -- --mode exploded|assembled --output path.png
"""
import bpy
import sys
import os
import math
from mathutils import Vector

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PARTS = [
    ("bottom-shell.stl", 0),
    ("pcb-standoff.stl", 1),
    ("battery-tray.stl", 2),
    ("top-shell.stl", 4),
    ("screen-frame.stl", 5),
]

GAP = 15  # mm gap for exploded view

def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    args = {"mode": "assembled", "output": "render.png", "engine": "BLENDER_EEVEE_NEXT", "samples": 64}
    i = 0
    while i < len(argv):
        if argv[i] == "--mode" and i+1 < len(argv): args["mode"] = argv[i+1]; i += 2
        elif argv[i] == "--output" and i+1 < len(argv): args["output"] = argv[i+1]; i += 2
        elif argv[i] == "--engine" and i+1 < len(argv): args["engine"] = argv[i+1]; i += 2
        elif argv[i] == "--samples" and i+1 < len(argv): args["samples"] = int(argv[i+1]); i += 2
        else: i += 1
    return args

def clean_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def import_stl(filepath):
    try:
        bpy.ops.wm.stl_import(filepath=filepath)
    except AttributeError:
        bpy.ops.import_mesh.stl(filepath=filepath)
    return bpy.context.selected_objects[0]

def main():
    args = parse_args()
    print(f"Mode: {args['mode']}, Output: {args['output']}")
    
    clean_scene()
    
    objects = []
    for stl_name, layer in PARTS:
        path = os.path.join(BASE, stl_name)
        if not os.path.exists(path):
            print(f"Skip: {path}")
            continue
        obj = import_stl(path)
        if args["mode"] == "exploded":
            obj.location.z += layer * GAP
        objects.append(obj)
    
    # Setup PLA material for all
    mat = bpy.data.materials.new("PLA_White")
    mat.use_nodes = True
    principled = mat.node_tree.nodes["Principled BSDF"]
    principled.inputs["Base Color"].default_value = (0.95, 0.95, 0.95, 1.0)
    principled.inputs["Roughness"].default_value = 0.3
    for obj in objects:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    
    # Calculate overall bounds
    all_verts = []
    for obj in objects:
        all_verts.extend([obj.matrix_world @ Vector(v) for v in obj.bound_box])
    center = sum(all_verts, Vector()) / len(all_verts)
    size = max(max(v[i] for v in all_verts) - min(v[i] for v in all_verts) for i in range(3))
    
    # Camera
    cam_data = bpy.data.cameras.new("Camera")
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    dist = size * 2.5
    cam_obj.location = Vector((dist*0.7, -dist*0.7, size*0.8)) + center
    direction = center - cam_obj.location
    cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    cam_data.lens = 85
    
    # Three-point lighting
    for name, energy, loc, color in [
        ("Key", 200, (dist*0.8, -dist*0.6, dist*0.8), (1.0, 0.98, 0.95)),
        ("Fill", 80, (-dist*0.8, -dist*0.4, dist*0.5), (0.95, 0.97, 1.0)),
        ("Rim", 150, (-dist*0.3, dist*0.8, dist*0.6), (1.0, 1.0, 1.0)),
    ]:
        light = bpy.data.lights.new(name, type='AREA')
        light.energy = energy
        light.size = size * 1.5
        light.color = color
        lobj = bpy.data.objects.new(name, light)
        lobj.location = Vector(loc) + center
        d = center - lobj.location
        lobj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        bpy.context.collection.objects.link(lobj)
    
    # World
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    nodes = world.node_tree.nodes; nodes.clear()
    bg = nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.85, 0.85, 0.87, 1.0)
    bg.inputs["Strength"].default_value = 0.5
    out = nodes.new("ShaderNodeOutputWorld")
    world.node_tree.links.new(bg.outputs["Background"], out.inputs["Surface"])
    
    # Render settings
    scene = bpy.context.scene
    scene.render.engine = args["engine"]
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.film_transparent = True
    scene.render.filepath = os.path.abspath(args["output"])
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    
    if args["engine"] == "CYCLES":
        scene.cycles.samples = args["samples"]
        scene.cycles.use_denoising = True
        scene.cycles.device = 'GPU'
    else:
        scene.eevee.taa_render_samples = args["samples"]
    
    print("Rendering...")
    bpy.ops.render.render(write_still=True)
    print(f"Done: {os.path.abspath(args['output'])}")

main()
