// ─── RealWorldClaw 温湿度监控器外壳 ───
// Author: RealWorldClaw Team
// 尺寸：60×40×30mm，壁厚2mm
// 特性：USB-C开孔、DHT22通风格栅、M3安装孔、卡扣式盖板
//
// 使用方法：
//   渲染底壳：  render_part = "bottom";
//   渲染盖板：  render_part = "lid";
//   预览组合：  render_part = "assembly";
//
// 导出STL：
//   openscad -D 'render_part="bottom"' -o enclosure-bottom.stl enclosure.scad
//   openscad -D 'render_part="lid"' -o enclosure-lid.stl enclosure.scad

/* ── 参数 ── */
render_part = "assembly"; // "bottom", "lid", "assembly"

// 外壳尺寸
box_w = 60;       // 长(X)
box_d = 40;       // 宽(Y)
box_h = 30;       // 总高(Z)：底壳24mm + 盖板6mm
wall = 2;         // 壁厚
lid_h = 6;        // 盖板高度
base_h = box_h - lid_h; // 底壳高度

// 倒角
corner_r = 2;

// USB-C 开孔（前面板，居中底部）
usbc_w = 9.2;
usbc_h = 3.4;
usbc_r = 0.5;     // 倒角
usbc_z = 3;       // 距底面高度

// DHT22 通风格栅（右侧面板）
grille_slot_w = 1.5;    // 栅格缝宽
grille_slot_gap = 2.0;  // 栅格间距（中心到中心3.5mm）
grille_count = 6;        // 栅格数量
grille_h = 15;           // 格栅总高度
grille_z = 8;            // 格栅起始Z

// M3安装孔（20mm网格，4个角）
m3_hole_d = 3.2;         // M3通孔直径
m3_boss_d = 7;           // 安装柱直径
m3_boss_h = base_h - wall; // 安装柱高度
mount_grid = 20;          // 网格间距

// 卡扣
snap_w = 8;       // 卡扣宽度
snap_h = 3;       // 卡扣高度
snap_d = 1.2;     // 卡扣凸出量
snap_tol = 0.3;   // 卡扣间隙

// LED导光孔（前面板）
led_d = 3.2;      // 3mm LED孔径
led_z = base_h - 8; // LED孔高度

$fn = 40;

/* ── 模块 ── */

// 圆角方盒（底部开口）
module rounded_box(w, d, h, r, wall) {
    difference() {
        // 外壳
        hull() {
            for (x = [r, w-r], y = [r, d-r])
                translate([x, y, 0])
                    cylinder(r=r, h=h);
        }
        // 内腔
        translate([wall, wall, wall])
        hull() {
            for (x = [r, w-r-wall*2+r], y = [r, d-r-wall*2+r])
                translate([x, y, 0])
                    cylinder(r=max(r-wall, 0.5), h=h);
        }
    }
}

// USB-C 开孔
module usbc_cutout() {
    translate([box_w/2, -1, usbc_z])
        hull() {
            for (x = [-usbc_w/2+usbc_r, usbc_w/2-usbc_r],
                 z = [usbc_r, usbc_h-usbc_r])
                translate([x, 0, z])
                    rotate([-90, 0, 0])
                        cylinder(r=usbc_r, h=wall+2);
        }
}

// 通风格栅（右侧Y=box_d面）
module ventilation_grille() {
    total_w = grille_count * (grille_slot_w + grille_slot_gap) - grille_slot_gap;
    start_x = box_w/2 - total_w/2;
    
    for (i = [0:grille_count-1]) {
        translate([start_x + i * (grille_slot_w + grille_slot_gap), box_d - wall - 1, grille_z])
            cube([grille_slot_w, wall + 2, grille_h]);
    }
}

// 左侧也加通风格栅（对流）
module ventilation_grille_left() {
    total_w = grille_count * (grille_slot_w + grille_slot_gap) - grille_slot_gap;
    start_x = box_w/2 - total_w/2;
    
    for (i = [0:grille_count-1]) {
        translate([start_x + i * (grille_slot_w + grille_slot_gap), -1, grille_z])
            cube([grille_slot_w, wall + 2, grille_h]);
    }
}

// M3安装柱
module m3_boss() {
    difference() {
        cylinder(d=m3_boss_d, h=m3_boss_h);
        translate([0, 0, -1])
            cylinder(d=m3_hole_d, h=m3_boss_h+2);
    }
}

// 安装柱组（4个角，20mm网格对齐）
module mount_bosses() {
    // 柱子中心位置（从内壁偏移，对齐20mm网格）
    cx = box_w / 2;
    cy = box_d / 2;
    for (dx = [-mount_grid/2, mount_grid/2],
         dy = [-mount_grid/2, mount_grid/2])
        translate([cx + dx, cy + dy, wall])
            m3_boss();
}

// 卡扣凸起（底壳内壁）
module snap_tab() {
    // 三角形卡扣截面
    hull() {
        cube([snap_w, snap_d, 0.1]);
        translate([0, 0, snap_h])
            cube([snap_w, 0.1, 0.1]);
    }
}

// 底壳两侧卡扣
module snap_tabs_bottom() {
    // 左右两侧各2个卡扣
    for (x = [box_w*0.25 - snap_w/2, box_w*0.75 - snap_w/2]) {
        // 前侧内壁
        translate([x, wall, base_h - snap_h - 1])
            snap_tab();
        // 后侧内壁
        translate([x, box_d - wall - snap_d, base_h - snap_h - 1])
            snap_tab();
    }
}

// LED导光孔
module led_hole() {
    translate([box_w * 0.25, -1, led_z])
        rotate([-90, 0, 0])
            cylinder(d=led_d, h=wall+2);
}

/* ── 底壳 ── */
module bottom_case() {
    difference() {
        union() {
            rounded_box(box_w, box_d, base_h, corner_r, wall);
            // 盖板定位唇边（内壁上沿凸出1mm）
        }
        usbc_cutout();
        ventilation_grille();
        ventilation_grille_left();
        led_hole();
    }
    mount_bosses();
    snap_tabs_bottom();
}

/* ── 盖板 ── */
module lid() {
    lip = 1.2;  // 内嵌唇边深度
    lip_tol = 0.3;
    
    difference() {
        // 盖板主体
        hull() {
            for (x = [corner_r, box_w-corner_r], y = [corner_r, box_d-corner_r])
                translate([x, y, 0])
                    cylinder(r=corner_r, h=wall);
        }
        
        // 卡扣凹槽
        for (x = [box_w*0.25 - snap_w/2 - snap_tol, box_w*0.75 - snap_w/2 - snap_tol]) {
            // 前侧
            translate([x, wall - snap_tol, -1])
                cube([snap_w + snap_tol*2, snap_d + snap_tol*2, wall + 2]);
            // 后侧
            translate([x, box_d - wall - snap_d - snap_tol, -1])
                cube([snap_w + snap_tol*2, snap_d + snap_tol*2, wall + 2]);
        }
    }
    
    // 内嵌定位唇边
    translate([wall + lip_tol, wall + lip_tol, -lip])
        difference() {
            cube([box_w - 2*(wall+lip_tol), box_d - 2*(wall+lip_tol), lip]);
            translate([wall, wall, -1])
                cube([box_w - 4*wall - 2*lip_tol, box_d - 4*wall - 2*lip_tol, lip+2]);
        }
}

/* ── 渲染选择 ── */
if (render_part == "bottom") {
    bottom_case();
} else if (render_part == "lid") {
    lid();
} else if (render_part == "assembly") {
    // 组合预览
    color("white", 0.8) bottom_case();
    color("lightblue", 0.6) translate([0, 0, base_h]) lid();
}
