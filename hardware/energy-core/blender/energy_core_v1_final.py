"""
Energy Core V1 — 最终版精细建模
================================
修复：所有孔位完全穿透，安装柱正确，Type-C/喇叭格栅贯通
Blender 5.0.1 兼容
"""
import bpy
import bmesh
import math
from mathutils import Vector

# ═══ 清空 ═══
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for c in [bpy.data.meshes, bpy.data.materials, bpy.data.collections]:
    for item in c:
        c.remove(item)

# ═══ 参数 (mm) ═══
CUBE = 100.0
WALL = 2.5
R = 3.0          # 圆角
SPLIT = 15.0     # 前壳深度

# PCB
PCB_W = 50.0
PCB_H = 86.0
PCB_T = 1.6
MOUNT_X = 42.0   # 安装孔X间距
MOUNT_Y = 78.0   # 安装孔Y间距
MOUNT_D = 3.2    # 安装孔直径

# 屏幕窗口
SCR_W = 45.0     # 窗口宽（显示区43.2+余量）
SCR_H = 60.0     # 窗口高（显示区57.6+余量）
# 屏幕在PCB上的位置：偏上，顶部距PCB顶7.5mm，底部距PCB底20.5mm
# 屏幕中心 = PCB中心向上偏移 (20.5-7.5)/2 = 6.5mm
SCR_OFFSET_Z = 6.5  # 屏幕中心相对PCB中心向上偏移

# Type-C
USBC_W = 10.0    # 含公差
USBC_H = 4.0

# 喇叭
SPK_D = 28.0
SPK_GRILLE_D = 2.5  # 格栅孔径

# 十字槽
SLOT_L = 22.0
SLOT_W = 3.2
SLOT_DEPTH = 2.5

# 散热孔
VENT_W = 1.5
VENT_L = 15.0
VENT_N = 4

# ═══ 材质 ═══
def mat(name, color, metal=0, rough=0.3):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    for n in m.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            n.inputs["Base Color"].default_value = (*color, 1)
            if "Metallic" in n.inputs: n.inputs["Metallic"].default_value = metal
            if "Roughness" in n.inputs: n.inputs["Roughness"].default_value = rough
            break
    return m

mShellW = mat("Shell_White", (0.95,0.95,0.96), 0, 0.15)
mShellG = mat("Shell_Gray", (0.88,0.88,0.90), 0, 0.22)
mPCB = mat("PCB", (0.08,0.42,0.15), 0, 0.4)
mChip = mat("Chip", (0.05,0.05,0.05), 0.3, 0.25)
mShield = mat("Shield", (0.7,0.7,0.72), 0.85, 0.1)
mMetal = mat("Metal", (0.72,0.72,0.74), 0.92, 0.06)
mCopper = mat("Copper", (0.72,0.45,0.2), 0.8, 0.15)
mScreen = mat("Screen", (0.01,0.01,0.03), 0.05, 0.02)
mSpk = mat("Speaker", (0.12,0.12,0.12), 0.2, 0.5)
mWhite = mat("White", (0.92,0.92,0.88), 0, 0.4)
mGold = mat("Gold", (0.83,0.66,0.22), 0.9, 0.1)
mLED = mat("LED", (0.2,0.85,0.78), 0, 0.2)
mFPC = mat("FPC", (0.8,0.6,0.2), 0.1, 0.6)
mRubber = mat("Rubber", (0.12,0.12,0.12), 0, 0.85)

# ═══ 工具 ═══
def box(name, sx, sy, sz, m, loc=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = (sx, sy, sz); bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(m); return o

def cyl(name, r, d, m, loc=(0,0,0), rot=(0,0,0), seg=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, vertices=seg, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    o.data.materials.append(m); return o

def bool_diff(target, cutter):
    """布尔差集并应用"""
    mod = target.modifiers.new("Bool", "BOOLEAN")
    mod.operation = 'DIFFERENCE'
    mod.object = cutter
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier="Bool")
    bpy.data.objects.remove(cutter)

def to_col(obj, col):
    for c in obj.users_collection:
        c.objects.unlink(obj)
    col.objects.link(obj)

def mkCol(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c

colFront = mkCol("1_Front_Shell")
colBack = mkCol("2_Back_Shell")
colPCB = mkCol("3_PCB_Assembly")
colSpk = mkCol("4_Speaker")

# ═══════════════════════════════════════
#  前壳 — 朝+Y方向（屏幕面）
# ═══════════════════════════════════════
# 坐标系：X=左右, Y=前后(屏幕+Y), Z=上下

# 外壳体
front = box("Front_Shell_Body", CUBE, SPLIT, CUBE, mShellW, (0, CUBE/2 - SPLIT/2, 0))

# 内腔掏空（留壁厚）
inner = box("_inner", CUBE-WALL*2, SPLIT, CUBE-WALL*2, mShellW,
    (0, CUBE/2 - SPLIT/2 - WALL/2, 0))
bool_diff(front, inner)

# 屏幕窗口 — 完全贯穿前壁，位置偏上
scr_hole = box("_scr", SCR_W, WALL*3, SCR_H, mScreen, (0, CUBE/2, SCR_OFFSET_Z))
bool_diff(front, scr_hole)

# 顶部十字槽
slot_h = box("_slotH", SLOT_L, SLOT_DEPTH*2, SLOT_W, mShellW, (0, CUBE/2 - SPLIT/2, CUBE/2))
bool_diff(front, slot_h)
slot_v = box("_slotV", SLOT_W, SLOT_DEPTH*2, SLOT_L, mShellW, (0, CUBE/2 - SPLIT/2, CUBE/2))
bool_diff(front, slot_v)

# 倒角
bev = front.modifiers.new("Bevel", "BEVEL")
bev.width = R; bev.segments = 4; bev.limit_method = 'ANGLE'; bev.angle_limit = math.radians(60)
front.data.materials.append(mShellW)
to_col(front, colFront)

# 屏幕黑色面板（装饰）
scr_panel = box("Screen_Panel", SCR_W+2, 0.5, SCR_H+2, mScreen, (0, CUBE/2-WALL+0.3, SCR_OFFSET_Z))
to_col(scr_panel, colFront)

# 屏幕显示区（青色代表亮屏）
scr_disp = box("Screen_Display", 43.2, 0.2, 57.6, mLED, (0, CUBE/2-WALL+0.6, SCR_OFFSET_Z))
to_col(scr_disp, colFront)

# ═══════════════════════════════════════
#  后壳
# ═══════════════════════════════════════
BACK = CUBE - SPLIT

back = box("Back_Shell_Body", CUBE, BACK, CUBE, mShellG, (0, CUBE/2 - SPLIT - BACK/2, 0))

# 内腔掏空
inner2 = box("_inner2", CUBE-WALL*2, BACK, CUBE-WALL*2, mShellG,
    (0, CUBE/2 - SPLIT - BACK/2 + WALL/2, 0))
bool_diff(back, inner2)

# Type-C 开口 — 贯穿后壁
usbc = box("_usbc", USBC_W, WALL*3, USBC_H, mMetal, (0, -CUBE/2, -CUBE/2*0.35))
bool_diff(back, usbc)

# 喇叭格栅 — 5×5阵列圆孔，贯穿后壁
for r in range(5):
    for c in range(5):
        x = -12 + c*6
        z = 8 + r*6
        hole = cyl(f"_grille_{r}_{c}", SPK_GRILLE_D/2, WALL*3, mMetal,
            (x, -CUBE/2, z), (math.pi/2,0,0), 12)
        bool_diff(back, hole)

# 侧面散热孔（左右各4条长缝）
for side in [-1, 1]:
    for i in range(VENT_N):
        z = -15 + i*10
        vent = box(f"_vent_{side}_{i}", WALL*3, VENT_L, VENT_W, mShellG,
            (side * CUBE/2, CUBE/2 - SPLIT - BACK/2, z))
        bool_diff(back, vent)

# 底部散热孔（4条长缝）
for i in range(VENT_N):
    x = -15 + i*10
    vent = box(f"_ventB_{i}", VENT_W, VENT_L, WALL*3, mShellG,
        (x, CUBE/2 - SPLIT - BACK/2, -CUBE/2))
    bool_diff(back, vent)

# 倒角
bev2 = back.modifiers.new("Bevel", "BEVEL")
bev2.width = R; bev2.segments = 4; bev2.limit_method = 'ANGLE'; bev2.angle_limit = math.radians(60)
to_col(back, colBack)

# ─── PCB安装柱 (4个, 后壳内壁一体) ───
# 柱子从后壁延伸到接近前壳接合面
STANDOFF_H = 10.0    # 柱高
STANDOFF_OR = 4.0    # 外半径
STANDOFF_IR = 1.3    # 内孔半径 (M3自攻 = ∅2.6, 半径1.3)

for dx, dz in [(-1,1),(1,1),(1,-1),(-1,-1)]:
    x = dx * MOUNT_X/2
    z = dz * MOUNT_Y/2
    y = CUBE/2 - SPLIT - WALL - STANDOFF_H/2  # 从后壁内面往前
    
    # 柱体
    pillar = cyl(f"Standoff_{dx}_{dz}", STANDOFF_OR, STANDOFF_H, mShellG,
        (x, y, z), (math.pi/2, 0, 0))
    to_col(pillar, colBack)
    
    # 螺丝孔 — 贯穿柱体
    screw = cyl(f"Screw_{dx}_{dz}", STANDOFF_IR, STANDOFF_H+2, mChip,
        (x, y, z), (math.pi/2, 0, 0), 16)
    bool_diff(pillar, screw)

# 喇叭固定环（后壳内壁一体）
spk_ring = cyl("Speaker_Ring", SPK_D/2+2, 3, mShellG,
    (0, CUBE/2-SPLIT-WALL-5, 15), (math.pi/2,0,0))
spk_ring_hole = cyl("_spk_hole", SPK_D/2, 5, mShellG,
    (0, CUBE/2-SPLIT-WALL-5, 15), (math.pi/2,0,0))
bool_diff(spk_ring, spk_ring_hole)
to_col(spk_ring, colBack)

# ═══════════════════════════════════════
#  PCB 组件
# ═══════════════════════════════════════
# PCB安装位置：安装柱顶面，屏幕朝+Y
pcb_y = CUBE/2 - SPLIT - WALL  # PCB前表面位置

# 主PCB板
pcb = box("PCB_Board", PCB_W, PCB_T, PCB_H, mPCB, (0, pcb_y - PCB_T/2, 0))
to_col(pcb, colPCB)

# 安装孔 — 贯穿PCB（4个）
for dx, dz in [(-1,1),(1,1),(1,-1),(-1,-1)]:
    x = dx * MOUNT_X/2
    z = dz * MOUNT_Y/2
    mh = cyl(f"PCB_Hole_{dx}_{dz}", MOUNT_D/2, PCB_T+1, mMetal,
        (x, pcb_y - PCB_T/2, z), (math.pi/2, 0, 0), 16)
    bool_diff(pcb, mh)

# ESP32-S3 模组（RF屏蔽罩）
box("ESP32_S3", 18, 2.5, 18, mShield, (7, pcb_y-PCB_T-1.25, 10))
to_col(bpy.context.active_object, colPCB)

# 天线铜走线
box("Antenna", 24, 0.3, 8, mCopper, (5, pcb_y-PCB_T-0.15, -33))
to_col(bpy.context.active_object, colPCB)

# USB-C座
box("USB_C", 9, 3.2, 3.2, mMetal, (0, pcb_y-PCB_T-1.6, -PCB_H/2+2))
to_col(bpy.context.active_object, colPCB)

# MicroSD卡槽
box("MicroSD", 12, 1.5, 11, mMetal, (-13, pcb_y-PCB_T-0.8, -5))
to_col(bpy.context.active_object, colPCB)

# MEMS麦克风
cyl("MEMS_Mic", 1.5, 1, mChip, (-17, pcb_y-PCB_T-0.5, 35), (math.pi/2,0,0))
to_col(bpy.context.active_object, colPCB)

# RGB LED
box("RGB_LED", 1.6, 0.8, 1.6, mLED, (17, pcb_y-PCB_T-0.4, 24))
to_col(bpy.context.active_object, colPCB)

# JST连接器 ×2
box("JST_Speaker", 4, 2.5, 3, mWhite, (-20, pcb_y-PCB_T-1.25, 30))
to_col(bpy.context.active_object, colPCB)
box("JST_Battery", 4, 2.5, 3, mWhite, (-20, pcb_y-PCB_T-1.25, -31))
to_col(bpy.context.active_object, colPCB)

# I2C排针(4pin)
for i in range(4):
    cyl(f"I2C_{i}", 0.3, 4, mGold, (-9+i*2.54, pcb_y-PCB_T-2, 36))
    to_col(bpy.context.active_object, colPCB)

# UART排针(3pin)
for i in range(3):
    cyl(f"UART_{i}", 0.3, 4, mGold, (-10+i*2.54, pcb_y-PCB_T-2, -32))
    to_col(bpy.context.active_object, colPCB)

# RESET/BOOT按键
box("RESET", 3, 1.5, 3, mRubber, (-17, pcb_y-PCB_T-0.8, 10))
to_col(bpy.context.active_object, colPCB)
box("BOOT", 3, 1.5, 3, mRubber, (-17, pcb_y-PCB_T-0.8, -18))
to_col(bpy.context.active_object, colPCB)

# TFT屏幕模块（PCB正面，偏上）
box("TFT_Module", 50, 1, 69, mScreen, (0, pcb_y+0.5, SCR_OFFSET_Z))
to_col(bpy.context.active_object, colPCB)

# FPC排线（从屏幕底部到PCB下方）
box("FPC_Cable", 10, 0.2, 18, mFPC, (0, pcb_y+0.1, SCR_OFFSET_Z - 35))
to_col(bpy.context.active_object, colPCB)

# 旁路电容
for i, (cx,cz) in enumerate([(-8,6),(14,4),(-12,20),(4,30),(-6,-10),(12,-16)]):
    box(f"Cap_{i}", 1.2, 0.6, 0.8, mChip, (cx, pcb_y-PCB_T-0.3, cz))
    to_col(bpy.context.active_object, colPCB)

# ═══════════════════════════════════════
#  喇叭
# ═══════════════════════════════════════
spk_y = pcb_y - 25
cyl("Speaker_Frame", SPK_D/2, 5, mSpk, (0, spk_y, 15), (math.pi/2,0,0))
to_col(bpy.context.active_object, colSpk)
cyl("Speaker_Magnet", 7, 3, mChip, (0, spk_y+2, 15), (math.pi/2,0,0))
to_col(bpy.context.active_object, colSpk)
cyl("Speaker_Cone", 10, 1, mRubber, (0, spk_y-3, 15), (math.pi/2,0,0))
to_col(bpy.context.active_object, colSpk)

# ═══ 相机和灯光 ═══
bpy.ops.object.camera_add(location=(160, -100, 80))
cam = bpy.context.active_object
cam.name = "Camera"
cam.rotation_euler = (math.radians(65), 0, math.radians(55))
cam.data.lens = 50
bpy.context.scene.camera = cam

bpy.ops.object.light_add(type='SUN', location=(80, 80, 150))
bpy.context.active_object.data.energy = 3
bpy.ops.object.light_add(type='AREA', location=(-80, 40, 80))
l = bpy.context.active_object; l.data.energy = 50; l.data.size = 80

bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 128
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080

print("=" * 60)
print("✅ Energy Core V1 Final — 建模完成")
print("=" * 60)
print(f"  外壳: {CUBE}×{CUBE}×{CUBE}mm 圆角正方体")
print(f"  前壳: {SPLIT}mm深, 壁厚{WALL}mm")
print(f"  后壳: {BACK}mm深, 壁厚{WALL}mm")
print(f"  屏幕窗口: {SCR_W}×{SCR_H}mm ✅ 贯穿")
print(f"  Type-C: {USBC_W}×{USBC_H}mm ✅ 贯穿")
print(f"  喇叭格栅: 5×5 ∅{SPK_GRILLE_D}mm ✅ 贯穿")
print(f"  安装柱: 4×∅{STANDOFF_OR*2}mm, 螺丝孔∅{STANDOFF_IR*2}mm ✅ 贯穿")
print(f"  散热孔: 侧面{VENT_N*2}条 + 底部{VENT_N}条 ✅ 贯穿")
print(f"  PCB安装孔: 4×∅{MOUNT_D}mm ✅ 贯穿")
print(f"  十字槽: {SLOT_L}×{SLOT_W}mm 深{SLOT_DEPTH}mm")
print("=" * 60)
