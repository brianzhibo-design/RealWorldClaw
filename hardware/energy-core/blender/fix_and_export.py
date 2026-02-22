"""
修复STL non-manifold问题并重新导出
"""
import bpy
import bmesh
import os

stl_dir = os.path.expanduser("~/Desktop/Realworldclaw/hardware/energy-core/stl")

for name in ['front_shell_print', 'back_shell_print']:
    # 清空场景
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    filepath = os.path.join(stl_dir, f"{name}.stl")
    if not os.path.exists(filepath):
        print(f"⚠️ {filepath} 不存在")
        continue
    
    # 导入STL
    bpy.ops.wm.stl_import(filepath=filepath)
    obj = bpy.context.active_object
    if not obj:
        objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
        if objs:
            obj = objs[0]
            bpy.context.view_layer.objects.active = obj
    
    if not obj:
        print(f"⚠️ {name}: 无法加载")
        continue
    
    obj.select_set(True)
    
    # 进入编辑模式修复
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    
    # 修复non-manifold
    bpy.ops.mesh.remove_doubles(threshold=0.01)  # 合并重叠顶点
    bpy.ops.mesh.fill_holes(sides=0)  # 填充孔洞
    bpy.ops.mesh.normals_make_consistent(inside=False)  # 统一法线
    
    # 再次清理
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.delete_loose()  # 删除孤立顶点/边
    
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 导出修复后的STL
    out_path = os.path.join(stl_dir, f"{name}.stl")
    bpy.ops.wm.stl_export(filepath=out_path, export_selected_objects=True)
    
    size = os.path.getsize(out_path) / 1024
    print(f"✅ {name}.stl — 修复完成, {size:.0f}KB")

print("\n🔧 所有STL已修复")
