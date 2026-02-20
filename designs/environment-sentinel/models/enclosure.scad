// Environment Sentinel — 环境哨兵外壳
// RealWorldClaw Reference Design #3
// 100×80×25mm 圆角方形，墙挂/桌面两用

$fn = 30;

// === 主要尺寸 ===
body_w = 100;
body_h = 80;
body_d = 25;
wall = 1.6;
corner_r = 5;

// === OLED 窗口 ===
oled_w = 27;    // 0.96" OLED visible area
oled_h = 13;
oled_x = 0;
oled_y = 12;    // 偏上

// === 通风格栅 ===
grille_w = 40;
grille_h = 12;
grille_y = -18;  // 偏下
slot_w = 3;
slot_gap = 2;

// === USB-C 口 ===
usbc_w = 10;
usbc_h = 4;

// === 墙挂钥匙孔 ===
keyhole_big_r = 4;
keyhole_small_r = 2;
keyhole_len = 8;

// === 可折叠支架 ===
stand_w = 30;
stand_h = 50;
stand_t = 2;

// --- 圆角方块 ---
module rounded_box(w, h, d, r) {
    hull() {
        for (x = [-w/2+r, w/2-r])
            for (y = [-h/2+r, h/2-r])
                translate([x, y, 0])
                    cylinder(r=r, h=d);
    }
}

// --- 钥匙孔 ---
module keyhole() {
    // 大圆
    cylinder(r=keyhole_big_r, h=wall+1);
    // 槽
    translate([0, keyhole_len/2, 0])
        cylinder(r=keyhole_small_r, h=wall+1);
    translate([-keyhole_small_r, 0, 0])
        cube([keyhole_small_r*2, keyhole_len/2, wall+1]);
}

// --- 通风格栅 ---
module grille() {
    n = floor(grille_w / (slot_w + slot_gap));
    for (i = [0:n-1]) {
        translate([
            -grille_w/2 + i*(slot_w+slot_gap) + slot_w/2,
            0, 0
        ])
            cube([slot_w, grille_h, wall+1], center=true);
    }
}

// --- 主体 ---
module body_shell() {
    difference() {
        // 外壳
        rounded_box(body_w, body_h, body_d, corner_r);
        // 内腔
        translate([0, 0, wall])
            rounded_box(body_w - wall*2, body_h - wall*2, body_d, corner_r - wall/2);
    }
}

// --- 完整外壳 ---
module enclosure() {
    difference() {
        body_shell();

        // OLED 窗口（正面）
        translate([oled_x, oled_y, -0.5])
            cube([oled_w, oled_h, wall+1], center=true);

        // 通风格栅（正面）
        translate([0, grille_y, -0.5])
            grille();

        // USB-C 口（右侧面）
        translate([body_w/2 - wall/2, 0, body_d/2])
            rotate([0, 90, 0])
                cube([usbc_h, usbc_w, wall+1], center=true);

        // 墙挂钥匙孔（背面，上部）
        translate([0, 20, body_d - wall - 0.5])
            keyhole();
    }

    // 可折叠支架（背面，铰链连接，展示为折叠状态）
    translate([0, -body_h/2 + 5, body_d - stand_t])
        difference() {
            // 支架板
            translate([-stand_w/2, 0, 0])
                cube([stand_w, 8, stand_t]);
            // 铰链孔
            for (x = [-stand_w/4, stand_w/4])
                translate([x, 4, -0.5])
                    cylinder(r=1, h=stand_t+1);
        }

    // OLED 边框（内侧加强）
    translate([0, oled_y, wall])
        difference() {
            cube([oled_w+4, oled_h+4, 2], center=true);
            cube([oled_w, oled_h, 3], center=true);
        }

    // 模块安装柱（4个角）
    for (x = [-35, 35])
        for (y = [-25, 25])
            translate([x, y, wall])
                difference() {
                    cylinder(r=3, h=5);
                    cylinder(r=1.2, h=5.1);
                }
}

enclosure();
