"""
导出Energy Core V1前壳和后壳为STL文件
先运行 energy_core_v1_optimized.py，再运行此脚本
"""
import bpy
import os

output_dir = os.path.join(os.path.dirname(bpy.data.filepath) if bpy.data.filepath else
    os.path.expanduser("~/Desktop/Realworldclaw/hardware/energy-core/stl"), "")

# 如果没有filepath，用固定路径
if not output_dir or output_dir == "/":
    output_dir = os.path.expanduser("~/Desktop/Realworldclaw/hardware/energy-core/stl/")

os.makedirs(output_dir, exist_ok=True)

def export_collection(col_name, filename):
    """选中集合内所有对象并导出为STL"""
    bpy.ops.object.select_all(action='DESELECT')
    
    col = bpy.data.collections.get(col_name)
    if not col:
        print(f"⚠️ 集合 '{col_name}' 不存在，跳过")
        return False
    
    count = 0
    for obj in col.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
            count += 1
    
    if count == 0:
        print(f"⚠️ 集合 '{col_name}' 中无网格对象，跳过")
        return False
    
    # 应用所有modifier
    for obj in col.objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj
            for mod in obj.modifiers:
                try:
                    bpy.ops.object.modifier_apply(modifier=mod.name)
                except:
                    pass
    
    # 重新选择
    bpy.ops.object.select_all(action='DESELECT')
    for obj in col.objects:
        if obj.type == 'MESH':
            obj.select_set(True)
    
    filepath = os.path.join(output_dir, filename)
    bpy.ops.wm.stl_export(filepath=filepath, export_selected_objects=True)
    
    size = os.path.getsize(filepath) / 1024
    print(f"✅ {filename} — {count}个对象, {size:.0f}KB")
    return True

# 导出前壳（含屏幕边框、卡扣凸起）
export_collection("Front_Shell_Optimized", "front_shell.stl")

# 导出后壳（含安装柱、通风口、喇叭架）
export_collection("Back_Shell_Optimized", "back_shell.stl")

# 也导出完整组装体（用于展示）
bpy.ops.object.select_all(action='SELECT')
filepath = os.path.join(output_dir, "energy_core_v1_full.stl")
bpy.ops.wm.stl_export(filepath=filepath, export_selected_objects=True)
size = os.path.getsize(filepath) / 1024
print(f"✅ energy_core_v1_full.stl — 完整组装, {size:.0f}KB")

print(f"\n📂 STL文件保存至: {output_dir}")
print("🖨️ 准备打印！")
