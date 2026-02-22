// RWC Energy Core - 方案C：有机心脏（Organic Heart）
// 流线型有机造型，像一滴水或抽象心脏
// 不对称设计，自然曲面，散热镂空
// 最接近"生命体"的感觉
// RealWorldClaw Team

$fn = 30;

// === 硬件尺寸 ===
esp32_w = 25.5;  esp32_d = 18;  esp32_h = 8;
screen_round_d = 36;
screen_rect_w = 27;  screen_rect_h = 27;
battery_w = 30;  battery_d = 20;  battery_h = 5;
usbc_w = 9;  usbc_h = 3.5;
magnet_d = 8;  magnet_h = 3;

// === 外壳参数 ===
wall = 1.8;

// 有机外形：用hull连接多个球体创造流线型
module organic_outer() {
    hull() {
        // 主体 - 偏心的大椭球
        scale([1, 0.85, 0.45]) sphere(r=32);
        // 右上突起 - 心脏的"肩"
        translate([12, -5, 4]) scale([0.7, 0.6, 0.35]) sphere(r=20);
        // 左下延伸 - 心脏的"尖"
        translate([-8, 8, -2]) scale([0.5, 0.7, 0.3]) sphere(r=18);
    }
}

// 不对称凸起（生命感）
module organic_bump() {
    hull() {
        translate([15, -8, 3]) sphere(r=8);
        translate([10, -3, 6]) sphere(r=5);
    }
}

// 完整外形
module heart_body() {
    union() {
        organic_outer();
        organic_bump();
    }
}

// 内腔
module heart_cavity() {
    // 整体缩小留壁厚
    translate([0, 0, 0.5])
        scale([0.9, 0.87, 0.82])
            heart_body();
}

// 屏幕开孔 - 正面（z正方向）
module screen_cutout() {
    // 圆形LCD
    translate([0, 0, 8])
        cylinder(d=screen_round_d + 1, h=15);
}

// USB-C 后方开孔
module usbc_port() {
    translate([0, -28, 0])
        rotate([90, 0, 180])
            hull() {
                translate([-(usbc_w/2 - usbc_h/2), 0, 0]) cylinder(d=usbc_h, h=10, center=true);
                translate([(usbc_w/2 - usbc_h/2), 0, 0]) cylinder(d=usbc_h, h=10, center=true);
            }
}

// 底部切平（桌面摆放）
module flat_bottom() {
    translate([0, 0, -30])
        cube([100, 100, 30], center=true);
}

// 散热/装饰镂空（边缘有机图案）
module vent_slots() {
    for (i = [0:5]) {
        a = i * 30 + 60;
        r = 25;
        translate([r * cos(a), r * sin(a), 2])
            rotate([0, 0, a])
                hull() {
                    cylinder(d=2.5, h=12, center=true);
                    translate([5, 0, 0]) cylinder(d=1.5, h=10, center=true);
                }
    }
}

// 磁吸接口 - 底部
module magnet_slot() {
    translate([0, 0, -14.5])
        cylinder(d=magnet_d + 0.3, h=magnet_h + 0.2);
}

// === 组装 ===
translate([0, 0, 14.5]) // 底部z=0
difference() {
    heart_body();
    heart_cavity();
    screen_cutout();
    usbc_port();
    flat_bottom();
    vent_slots();
    // 底部磁吸
    magnet_slot();
    // 侧面磁吸扩展
    translate([-28, 0, 0]) rotate([0, 90, 0]) cylinder(d=magnet_d+0.3, h=magnet_h+0.2);
}
