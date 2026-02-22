// RealWorldClaw Core Module Base
// RealWorldClaw Team - 2026-02-21
// 容纳 ESP32-S3-DevKitC-1 + 3x JST-XH 8pin

$fn = 30;

// === 参数 ===
base_w = 50;        // X方向
base_d = 40;        // Y方向
base_h = 15;        // 总高
wall = 1.5;         // 壁厚
floor_t = 2;        // 底板厚度
gap = 0.3;          // FDM间隙

// ESP32-S3-DevKitC-1
esp_w = 25.4 + gap*2;   // 槽宽（Y方向）
esp_l = 69;              // 长度（会突出）
esp_pcb_t = 1.6;         // PCB厚度
esp_h = 8;               // 元件高度（含PCB）

// JST-XH 8pin母座
jst_w = 8;
jst_h = 6;
jst_count = 3;

// USB-C开口
usbc_w = 10;
usbc_h = 4;

// M3螺丝孔
m3_d = 3.2;
m3_inset = 4;  // 从边缘到孔中心

// 通风格栅
vent_slot_w = 2;
vent_gap = 3;

// === 主体 ===
module base_shell() {
    difference() {
        // 外壳
        cube([base_w, base_d, base_h]);
        
        // 内腔
        translate([wall, wall, floor_t])
            cube([base_w - 2*wall, base_d - 2*wall, base_h]);
    }
}

// === ESP32卡槽（沿X方向放置，居中于Y） ===
module esp_slot() {
    slot_y = (base_d - esp_w) / 2;
    
    // 两侧导轨（L形卡槽）
    rail_h = esp_h + 2;
    rail_w = 1.5;
    lip = 0.8;  // 卡扣唇
    
    // 左导轨
    translate([wall, slot_y - rail_w, floor_t]) {
        cube([base_w - 2*wall, rail_w, rail_h]);
        // 卡扣唇（顶部内侧）
        translate([0, rail_w - 0.1, rail_h - lip])
            cube([base_w - 2*wall, lip, lip]);
    }
    
    // 右导轨
    translate([wall, slot_y + esp_w, floor_t]) {
        cube([base_w - 2*wall, rail_w, rail_h]);
        // 卡扣唇
        translate([0, 0.1 - lip, rail_h - lip])
            cube([base_w - 2*wall, lip, lip]);
    }
}

// === USB-C开口（X=0侧，即插入方向前端） ===
module usbc_cutout() {
    usbc_z = floor_t + 1;  // 略高于底板
    translate([-1, (base_d - usbc_w)/2, usbc_z])
        cube([wall + 2, usbc_w, usbc_h]);
}

// === JST接口开口（X=base_w侧，3个均匀排列） ===
module jst_cutouts() {
    total_span = jst_count * jst_w + (jst_count - 1) * 4;
    start_y = (base_d - total_span) / 2;
    jst_z = floor_t + 2;
    
    for (i = [0 : jst_count - 1]) {
        y = start_y + i * (jst_w + 4);
        translate([base_w - wall - 1, y, jst_z])
            cube([wall + 2, jst_w, jst_h]);
    }
}

// === M3螺丝孔 ===
module screw_holes() {
    positions = [
        [m3_inset, m3_inset],
        [base_w - m3_inset, m3_inset],
        [m3_inset, base_d - m3_inset],
        [base_w - m3_inset, base_d - m3_inset]
    ];
    
    for (p = positions) {
        // 螺丝柱
        translate([p[0], p[1], floor_t])
            cylinder(d = m3_d + 3, h = base_h - floor_t);
        // 通孔
        translate([p[0], p[1], -1])
            cylinder(d = m3_d, h = base_h + 2);
    }
}

// === 底部通风格栅 ===
module vent_grille() {
    vent_area_x = base_w - 2 * (m3_inset + m3_d);
    start_x = m3_inset + m3_d + 2;
    n_slots = floor(vent_area_x / (vent_slot_w + vent_gap));
    
    for (i = [0 : n_slots - 1]) {
        x = start_x + i * (vent_slot_w + vent_gap);
        translate([x, base_d * 0.25, -1])
            cube([vent_slot_w, base_d * 0.5, floor_t + 2]);
    }
}

// === 盖板（可选，独立打印） ===
module lid() {
    lid_t = 1.5;
    lip_h = 2;
    lip_gap = gap;
    
    translate([base_w + 10, 0, 0]) {
        // 顶板
        cube([base_w, base_d, lid_t]);
        // 内嵌唇（插入壳体内）
        translate([wall + lip_gap, wall + lip_gap, -lip_h])
            difference() {
                cube([base_w - 2*(wall + lip_gap), base_d - 2*(wall + lip_gap), lip_h]);
                translate([wall, wall, -1])
                    cube([base_w - 2*(wall + lip_gap) - 2*wall, 
                          base_d - 2*(wall + lip_gap) - 2*wall, 
                          lip_h + 2]);
            }
    }
}

// === 组装 ===
difference() {
    union() {
        base_shell();
        esp_slot();
        screw_holes();  // 螺丝柱部分
    }
    
    // 减去开口和孔
    usbc_cutout();
    jst_cutouts();
    vent_grille();
    
    // 螺丝通孔（重新减）
    positions = [
        [m3_inset, m3_inset],
        [base_w - m3_inset, m3_inset],
        [m3_inset, base_d - m3_inset],
        [base_w - m3_inset, base_d - m3_inset]
    ];
    for (p = positions) {
        translate([p[0], p[1], -1])
            cylinder(d = m3_d, h = base_h + 2);
    }
}

// 盖板（放在旁边）
lid();
