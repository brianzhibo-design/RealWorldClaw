import bpy, os

out = os.path.expanduser("~/Desktop/Realworldclaw/hardware/energy-core/stl/")
os.makedirs(out, exist_ok=True)

def export_col(col_name, filename):
    bpy.ops.object.select_all(action='DESELECT')
    col = bpy.data.collections.get(col_name)
    if not col:
        print(f"⚠️ {col_name} not found"); return
    for obj in col.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
            bpy.context.view_layer.objects.active = obj
            for mod in list(obj.modifiers):
                try: bpy.ops.object.modifier_apply(modifier=mod.name)
                except: pass
    bpy.ops.object.select_all(action='DESELECT')
    for obj in col.objects:
        if obj.type == 'MESH': obj.select_set(True)
    fp = os.path.join(out, filename)
    bpy.ops.wm.stl_export(filepath=fp, export_selected_objects=True)
    print(f"✅ {filename} — {os.path.getsize(fp)//1024}KB")

export_col("1_Front_Shell", "front_shell.stl")
export_col("2_Back_Shell", "back_shell.stl")

# 完整体
bpy.ops.object.select_all(action='SELECT')
fp = os.path.join(out, "energy_core_v1_full.stl")
bpy.ops.wm.stl_export(filepath=fp, export_selected_objects=True)
print(f"✅ full — {os.path.getsize(fp)//1024}KB")

# 居中贴地版本（打印用）
import numpy as np
for name in ['front_shell', 'back_shell']:
    try:
        from stl import mesh as stlmesh
        m = stlmesh.Mesh.from_file(os.path.join(out, f"{name}.stl"))
        mins = m.vectors.reshape(-1,3).min(axis=0)
        maxs = m.vectors.reshape(-1,3).max(axis=0)
        center = (mins+maxs)/2
        m.vectors[:,:,0] -= center[0]
        m.vectors[:,:,2] -= center[2]
        m.vectors[:,:,1] -= mins[1]
        m.save(os.path.join(out, f"{name}_print.stl"))
        size = maxs-mins
        print(f"✅ {name}_print.stl — {size[0]:.0f}×{size[1]:.0f}×{size[2]:.0f}mm, 贴地居中")
    except:
        print(f"⚠️ numpy-stl not available, skipping print alignment for {name}")
