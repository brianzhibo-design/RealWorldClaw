"""
Energy Core V1 — Blender精细化建模脚本
======================================
在Blender中运行：Edit > Preferences > 无需设置
打开Blender后：顶部菜单 Scripting 工作区 > 粘贴此脚本 > 运行

所有尺寸单位：毫米 (mm)，Blender中1单位=1mm
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ═══ 清空场景 ═══
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
# 清除残留数据
for c in [bpy.data.meshes, bpy.data.materials, bpy.data.collections]:
    for item in c:
        c.remove(item)

# ═══ 基础参数 (mm) ═══
CUBE = 100.0        # 外壳边长
WALL = 2.5          # 壁厚
R_CORNER = 3.0      # 圆角半径
SPLIT_Z = 15.0      # 前壳深度（从正面往后）

# PCB参数
PCB_W = 50.0        # 宽
PCB_H = 86.0        # 高
PCB_T = 1.6         # 厚
PCB_TOTAL_T = 9.1   # 含元件总厚

# 屏幕参数
SCR_DISP_W = 43.2   # 显示区宽
SCR_DISP_H = 57.6   # 显示区高
SCR_MOD_W = 50.0    # 模块宽（= PCB宽）
SCR_MOD_H = 69.2    # 模块高（含排线区）

# 安装孔
HOLE_SPACING_X = 42.0
HOLE_SPACING_Y = 78.0
HOLE_DIA = 3.2

# 喇叭
SPK_DIA = 28.0
SPK_DEPTH = 5.0

# Type-C
USBC_W = 9.0
USBC_H = 3.2

# 十字槽
SLOT_L = 24.0       # 十字臂长
SLOT_W = 3.0        # 十字臂宽
SLOT_D = 2.0        # 槽深

# ═══ 材质 ═══
def make_mat(name, color, metallic=0, roughness=0.3, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    # Find Principled BSDF node (name varies by Blender version)
    bsdf = None
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            bsdf = node
            break
    if bsdf is None:
        return mat
    # Set properties — try input names, fall back to index
    for input_name, value in [("Base Color", (*color, 1)), ("Metallic", metallic), ("Roughness", roughness)]:
        if input_name in bsdf.inputs:
            bsdf.inputs[input_name].default_value = value
    if alpha < 1:
        if hasattr(mat, 'blend_method'):
            mat.blend_method = 'BLEND'
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha
    return mat

mat_shell_white = make_mat("Shell_White", (0.95, 0.95, 0.96), 0, 0.15)
mat_shell_back = make_mat("Shell_Back", (0.92, 0.92, 0.94), 0, 0.2)
mat_pcb = make_mat("PCB_Green", (0.08, 0.42, 0.15), 0, 0.4)
mat_chip = make_mat("Chip_Black", (0.05, 0.05, 0.05), 0.3, 0.25)
mat_shield = make_mat("RF_Shield", (0.7, 0.7, 0.72), 0.85, 0.1)
mat_metal = make_mat("Metal", (0.7, 0.7, 0.72), 0.92, 0.06)
mat_copper = make_mat("Copper", (0.72, 0.45, 0.2), 0.8, 0.15)
mat_screen = make_mat("Screen_Black", (0.01, 0.01, 0.03), 0.05, 0.02)
mat_spk = make_mat("Speaker", (0.1, 0.1, 0.1), 0.2, 0.5)
mat_rubber = make_mat("Rubber", (0.12, 0.12, 0.12), 0, 0.85)
mat_white_plastic = make_mat("White_Plastic", (0.92, 0.92, 0.88), 0, 0.4)
mat_gold = make_mat("Gold_Pin", (0.83, 0.66, 0.22), 0.9, 0.1)
mat_led = make_mat("LED_Cyan", (0.2, 0.85, 0.78), 0, 0.2)
mat_fpc = make_mat("FPC", (0.8, 0.6, 0.2), 0.1, 0.6)
mat_slot = make_mat("Slot_Gray", (0.85, 0.85, 0.87), 0, 0.4)

# ═══ 工具函数 ═══
def add_rounded_cube(name, size_x, size_y, size_z, radius, mat, location=(0,0,0)):
    """创建圆角立方体"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size_x, size_y, size_z)
    bpy.ops.object.transform_apply(scale=True)
    
    # 添加圆角
    bevel = obj.modifiers.new("Bevel", "BEVEL")
    bevel.width = radius
    bevel.segments = 6
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(60)
    
    obj.data.materials.append(mat)
    return obj

def add_box(name, sx, sy, sz, mat, loc=(0,0,0)):
    """简单方块"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    return obj

def add_cylinder(name, radius, depth, mat, loc=(0,0,0), rot=(0,0,0)):
    """圆柱体"""
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    return obj

# ═══ 创建集合 ═══
def make_collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col

col_front = make_collection("Front_Shell")
col_back = make_collection("Back_Shell")
col_pcb = make_collection("PCB_Assembly")
col_speaker = make_collection("Speaker")

def to_col(obj, col):
    """移动对象到指定集合"""
    for c in obj.users_collection:
        c.objects.unlink(obj)
    col.objects.link(obj)

# ═══════════════════════════════════════
# 前壳 FRONT SHELL
# ═══════════════════════════════════════
# 前壳：正面朝+Y方向，深度SPLIT_Z

front_shell = add_rounded_cube(
    "Front_Shell", CUBE, SPLIT_Z, CUBE, R_CORNER, mat_shell_white,
    location=(0, CUBE/2 - SPLIT_Z/2, 0)
)
to_col(front_shell, col_front)

# 屏幕窗口（布尔减去）
scr_cutout = add_box(
    "Screen_Cutout", SCR_DISP_W + 2, WALL + 2, SCR_DISP_H + 2, mat_screen,
    loc=(0, CUBE/2, 0)
)
bool_mod = front_shell.modifiers.new("ScreenCut", "BOOLEAN")
bool_mod.operation = 'DIFFERENCE'
bool_mod.object = scr_cutout
bpy.context.view_layer.objects.active = front_shell
bpy.ops.object.modifier_apply(modifier="ScreenCut")
bpy.data.objects.remove(scr_cutout)

# 屏幕边框（黑色面板）
scr_bezel = add_box(
    "Screen_Bezel", SCR_DISP_W + 4, 0.5, SCR_DISP_H + 4, mat_screen,
    loc=(0, CUBE/2 - WALL/2, 0)
)
to_col(scr_bezel, col_front)

# 屏幕显示面（发光面）
scr_display = add_box(
    "Screen_Display", SCR_DISP_W, 0.2, SCR_DISP_H, mat_led,
    loc=(0, CUBE/2 - WALL/2 + 0.3, 0)
)
to_col(scr_display, col_front)

# 顶部十字槽
slot_h = add_box("Slot_H", SLOT_L, SLOT_D, SLOT_W, mat_slot, loc=(0, CUBE/2 - SPLIT_Z/2, CUBE/2 - SLOT_D/2))
slot_v = add_box("Slot_V", SLOT_W, SLOT_D, SLOT_L, mat_slot, loc=(0, CUBE/2 - SPLIT_Z/2, CUBE/2 - SLOT_D/2))
# 布尔减去十字槽
for slot_obj in [slot_h, slot_v]:
    bool_mod = front_shell.modifiers.new("SlotCut", "BOOLEAN")
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.object = slot_obj
    bpy.context.view_layer.objects.active = front_shell
    bpy.ops.object.modifier_apply(modifier="SlotCut")
    bpy.data.objects.remove(slot_obj)

# ═══════════════════════════════════════
# 后壳 BACK SHELL  
# ═══════════════════════════════════════
back_depth = CUBE - SPLIT_Z

back_shell = add_rounded_cube(
    "Back_Shell", CUBE, back_depth, CUBE, R_CORNER, mat_shell_back,
    location=(0, CUBE/2 - SPLIT_Z - back_depth/2, 0)
)
to_col(back_shell, col_back)

# Type-C开口（布尔）
usbc_cutout = add_box(
    "USBC_Cutout", USBC_W + 1, WALL + 2, USBC_H + 1, mat_metal,
    loc=(0, -CUBE/2, -CUBE/2 * 0.3)
)
bool_mod = back_shell.modifiers.new("USBCCut", "BOOLEAN")
bool_mod.operation = 'DIFFERENCE'
bool_mod.object = usbc_cutout
bpy.context.view_layer.objects.active = back_shell
bpy.ops.object.modifier_apply(modifier="USBCCut")
bpy.data.objects.remove(usbc_cutout)

# 喇叭格栅孔（6×6阵列）
for r in range(6):
    for c in range(6):
        x = -12.5 + c * 5
        z = 10 + r * 5
        hole = add_cylinder(
            f"Grille_{r}_{c}", 1.5, WALL + 2, mat_metal,
            loc=(x, -CUBE/2, z), rot=(math.pi/2, 0, 0)
        )
        bool_mod = back_shell.modifiers.new(f"Grille_{r}_{c}", "BOOLEAN")
        bool_mod.operation = 'DIFFERENCE'
        bool_mod.object = hole
        bpy.context.view_layer.objects.active = back_shell
        bpy.ops.object.modifier_apply(modifier=f"Grille_{r}_{c}")
        bpy.data.objects.remove(hole)

# 安装柱（4个，后壳内壁一体）
for dx, dz in [(-1,1),(1,1),(1,-1),(-1,-1)]:
    x = dx * HOLE_SPACING_X / 2
    z = dz * HOLE_SPACING_Y / 2
    standoff = add_cylinder(
        f"Standoff_{dx}_{dz}", HOLE_DIA/2 + 1.5, 10, mat_shell_back,
        loc=(x, CUBE/2 - SPLIT_Z - 5, z), rot=(math.pi/2, 0, 0)
    )
    to_col(standoff, col_back)
    
    # 螺纹孔
    screw_hole = add_cylinder(
        f"ScrewHole_{dx}_{dz}", HOLE_DIA/2, 12, mat_chip,
        loc=(x, CUBE/2 - SPLIT_Z - 5, z), rot=(math.pi/2, 0, 0)
    )
    to_col(screw_hole, col_back)

# 内部加强筋（3条，后壳一体）
rib_y = -CUBE/2 + back_depth/2
add_box("Rib_Left", 1.5, back_depth * 0.5, CUBE * 0.5, mat_shell_back, loc=(-CUBE/2 + WALL + 3, rib_y, 0))
to_col(bpy.context.active_object, col_back)
add_box("Rib_Right", 1.5, back_depth * 0.5, CUBE * 0.5, mat_shell_back, loc=(CUBE/2 - WALL - 3, rib_y, 0))
to_col(bpy.context.active_object, col_back)
add_box("Rib_Bottom", CUBE * 0.5, back_depth * 0.5, 1.5, mat_shell_back, loc=(0, rib_y, -CUBE/2 + WALL + 3))
to_col(bpy.context.active_object, col_back)

# ═══════════════════════════════════════
# PCB 组件
# ═══════════════════════════════════════
# PCB位于前壳内侧，屏幕朝+Y方向
pcb_y = CUBE/2 - SPLIT_Z + PCB_TOTAL_T/2 + WALL

# 主PCB板
pcb_board = add_box("PCB", PCB_W, PCB_T, PCB_H, mat_pcb, loc=(0, pcb_y, 0))
to_col(pcb_board, col_pcb)

# ESP32-S3 模组 (含RF屏蔽罩)
soc_shield = add_box("ESP32_S3_Shield", 18, 1.2, 18, mat_shield, loc=(7, pcb_y - PCB_T/2 - 0.6, 10))
to_col(soc_shield, col_pcb)

# 天线区 (PCB底部铜走线)
antenna = add_box("Antenna_Trace", 24, 0.2, 10, mat_copper, loc=(6, pcb_y - PCB_T/2 - 0.1, -33))
to_col(antenna, col_pcb)

# USB-C 连接器
usbc_conn = add_box("USBC_Connector", USBC_W, 3.2, USBC_H, mat_metal, loc=(0, pcb_y - 1, -PCB_H/2 + 2))
to_col(usbc_conn, col_pcb)

# MicroSD 卡槽
sd_slot = add_box("MicroSD_Slot", 12, 1.5, 11, mat_metal, loc=(-13, pcb_y - PCB_T/2 - 0.8, -5))
to_col(sd_slot, col_pcb)

# MEMS 麦克风
mic = add_cylinder("MEMS_MIC", 1.5, 1, mat_chip, loc=(-17, pcb_y - PCB_T/2 - 0.5, 35), rot=(math.pi/2, 0, 0))
to_col(mic, col_pcb)

# RGB LED
led = add_box("RGB_LED", 1.6, 0.8, 1.6, mat_led, loc=(17, pcb_y - PCB_T/2 - 0.4, 24))
to_col(led, col_pcb)

# 喇叭 JST 连接器
jst_spk = add_box("JST_Speaker", 4, 2.5, 3, mat_white_plastic, loc=(-20, pcb_y - PCB_T/2 - 1.2, 30))
to_col(jst_spk, col_pcb)

# 电池 JST 连接器
jst_bat = add_box("JST_Battery", 4, 2.5, 3, mat_white_plastic, loc=(-20, pcb_y - PCB_T/2 - 1.2, -31))
to_col(jst_bat, col_pcb)

# I2C 排针 (4pin)
for i in range(4):
    pin = add_cylinder(f"I2C_Pin_{i}", 0.3, 4, mat_gold,
        loc=(-9 + i*2.54, pcb_y - PCB_T/2 - 2, 36))
    to_col(pin, col_pcb)

# UART 排针 (3pin)
for i in range(3):
    pin = add_cylinder(f"UART_Pin_{i}", 0.3, 4, mat_gold,
        loc=(-10 + i*2.54, pcb_y - PCB_T/2 - 2, -32))
    to_col(pin, col_pcb)

# RESET 按键
reset_btn = add_box("RESET_Button", 3, 1.5, 3, mat_rubber, loc=(-17, pcb_y - PCB_T/2 - 0.8, 10))
to_col(reset_btn, col_pcb)

# BOOT 按键
boot_btn = add_box("BOOT_Button", 3, 1.5, 3, mat_rubber, loc=(-17, pcb_y - PCB_T/2 - 0.8, -18))
to_col(boot_btn, col_pcb)

# 充电IC
charge_ic = add_box("Charge_IC", 3, 0.8, 2.5, mat_chip, loc=(-12, pcb_y - PCB_T/2 - 0.4, -26))
to_col(charge_ic, col_pcb)

# 晶振
crystal = add_box("Crystal", 2.5, 0.8, 1.6, mat_shield, loc=(-4, pcb_y - PCB_T/2 - 0.4, 18))
to_col(crystal, col_pcb)

# 旁路电容 (散布)
cap_positions = [(-8,6), (14,4), (-12,20), (4,30), (-6,-10), (12,-16)]
for i, (cx, cz) in enumerate(cap_positions):
    cap = add_box(f"Cap_{i}", 1.2, 0.6, 0.8, mat_chip,
        loc=(cx, pcb_y - PCB_T/2 - 0.3, cz))
    to_col(cap, col_pcb)

# 稳压器
vreg = add_box("Voltage_Regulator", 3, 1.2, 2, mat_chip, loc=(18, pcb_y - PCB_T/2 - 0.6, 26))
to_col(vreg, col_pcb)

# TFT 屏幕面板 (PCB正面)
tft_panel = add_box("TFT_Panel", SCR_MOD_W, 0.8, SCR_MOD_H, mat_screen,
    loc=(0, pcb_y + PCB_T/2 + 1.5, 5))
to_col(tft_panel, col_pcb)

# TFT 背光板
backlight = add_box("TFT_Backlight", SCR_MOD_W, 0.4, SCR_MOD_H, mat_white_plastic,
    loc=(0, pcb_y + PCB_T/2 + 0.8, 5))
to_col(backlight, col_pcb)

# FPC 排线
fpc = add_box("FPC_Cable", 10, 0.15, 20, mat_fpc, loc=(0, pcb_y + PCB_T/2 + 0.3, -20))
to_col(fpc, col_pcb)

# ═══════════════════════════════════════
# 喇叭
# ═══════════════════════════════════════
spk_y = pcb_y - 25  # 喇叭在PCB后方

# 喇叭框体
spk_frame = add_cylinder("Speaker_Frame", SPK_DIA/2, SPK_DEPTH, mat_spk,
    loc=(0, spk_y, 16), rot=(math.pi/2, 0, 0))
to_col(spk_frame, col_speaker)

# 磁铁
spk_magnet = add_cylinder("Speaker_Magnet", SPK_DIA/2 * 0.5, SPK_DEPTH * 0.6, mat_chip,
    loc=(0, spk_y + 2, 16), rot=(math.pi/2, 0, 0))
to_col(spk_magnet, col_speaker)

# 振膜
spk_cone = add_cylinder("Speaker_Cone", SPK_DIA/2 * 0.8, 1, mat_rubber,
    loc=(0, spk_y - 3, 16), rot=(math.pi/2, 0, 0))
to_col(spk_cone, col_speaker)

# ═══ 相机和灯光 ═══
# 相机
bpy.ops.object.camera_add(location=(180, -120, 100))
cam = bpy.context.active_object
cam.name = "Camera"
cam.rotation_euler = (math.radians(65), 0, math.radians(55))
cam.data.lens = 50
bpy.context.scene.camera = cam

# 灯光
bpy.ops.object.light_add(type='SUN', location=(100, 100, 200))
sun = bpy.context.active_object
sun.name = "Key_Light"
sun.data.energy = 3

bpy.ops.object.light_add(type='AREA', location=(-100, 50, 100))
fill = bpy.context.active_object
fill.name = "Fill_Light"
fill.data.energy = 50
fill.data.size = 100

# ═══ 渲染设置 ═══
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.device = 'GPU'
bpy.context.scene.cycles.samples = 128
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080

# ═══ 保存 ═══
filepath = bpy.path.abspath("//energy_core_v1.blend")
# 注意：脚本内不自动保存，大人可以手动 File > Save As

print("✅ Energy Core V1 建模完成！")
print(f"   外壳: 100×100×100mm 圆角正方体")
print(f"   前壳深度: {SPLIT_Z}mm / 后壳深度: {CUBE-SPLIT_Z}mm")
print(f"   PCB: {PCB_W}×{PCB_H}×{PCB_T}mm")
print(f"   集合: Front_Shell / Back_Shell / PCB_Assembly / Speaker")
print(f"   可以在右侧 Outliner 中开关各集合的可见性来查看内部结构")
