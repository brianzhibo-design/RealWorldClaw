// RWC Energy Core - 方案A：六角盾牌（Hex Shield）
// 六角形外轮廓，多层结构，中心屏幕下沉凹槽
// 灵感：盾牌/勋章，层次感强
// 美羊羊🎀 设计

$fn = 30;

// === 硬件尺寸 ===
esp32_w = 25.5;  esp32_d = 18;  esp32_h = 8;
screen_round_d = 36;  // 1.28寸圆形LCD直径(含边框)
screen_rect_w = 27;  screen_rect_h = 27;  // 0.96寸OLED
battery_w = 30;  battery_d = 20;  battery_h = 5;
usbc_w = 9;  usbc_h = 3.5;
magnet_d = 8;  magnet_h = 3;  // 磁吸接口磁铁

// === 外壳参数 ===
hex_r = 35;       // 六角形外接圆半径
total_h = 15;     // 总厚度
wall = 1.8;       // 壁厚
bevel = 2;        // 倒角

// 六角形模块
module hex_prism(r, h) {
    cylinder(r=r, h=h, $fn=6);
}

// 主体
module body() {
    // 底层 - 大六角
    minkowski() {
        hex_prism(hex_r - bevel, total_h - bevel);
        sphere(r=bevel);
    }
}

// 中层装饰环（第二层六角，稍小，凸起）
module mid_ring() {
    translate([0, 0, total_h - 3])
        difference() {
            hex_prism(hex_r - 5, 4);
            translate([0, 0, -0.5])
                hex_prism(hex_r - 8, 5);
        }
}

// 屏幕凹槽（圆形LCD）
module screen_cutout_round() {
    translate([0, 0, total_h - 2.5])
        cylinder(d=screen_round_d + 1, h=5);
}

// 屏幕凹槽（方形OLED）- 备用
module screen_cutout_rect() {
    translate([-screen_rect_w/2 - 0.5, -screen_rect_h/2 - 0.5, total_h - 2.5])
        cube([screen_rect_w + 1, screen_rect_h + 1, 5]);
}

// 内腔
module cavity() {
    translate([0, 0, wall]) {
        // 主腔体
        hex_prism(hex_r - wall - bevel, total_h - wall * 2);
    }
}

// ESP32槽位
module esp32_slot() {
    translate([-esp32_w/2, -esp32_d/2, wall])
        cube([esp32_w, esp32_d, esp32_h + 1]);
}

// 电池槽位
module battery_slot() {
    translate([-battery_w/2, -hex_r/2 - battery_d/2 + 5, wall])
        cube([battery_w, battery_d, battery_h + 1]);
}

// USB-C开孔
module usbc_port() {
    translate([0, hex_r - wall, 4])
        rotate([90, 0, 0])
            hull() {
                translate([-(usbc_w/2 - usbc_h/2), 0, 0]) cylinder(d=usbc_h, h=wall*3, center=true);
                translate([(usbc_w/2 - usbc_h/2), 0, 0]) cylinder(d=usbc_h, h=wall*3, center=true);
            }
}

// 磁吸接口（底部）
module magnet_slot() {
    translate([0, 0, -0.1])
        cylinder(d=magnet_d + 0.3, h=magnet_h + 0.2);
}

// 背面夹子安装孔
module clip_holes() {
    for (x = [-12, 12]) {
        translate([x, 0, -0.1])
            cylinder(d=3, h=wall + 0.5);
    }
}

// === 组装 ===
difference() {
    union() {
        body();
        mid_ring();
    }
    cavity();
    screen_cutout_round();
    esp32_slot();
    battery_slot();
    usbc_port();
    // 底部磁铁x2
    for (y = [-15, 15]) {
        translate([0, y, 0]) magnet_slot();
    }
    clip_holes();
}
