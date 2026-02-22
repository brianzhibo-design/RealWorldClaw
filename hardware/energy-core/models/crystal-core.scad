// RWC Energy Core - 方案B：晶体核心（Crystal Core）
// 不规则多面体切面造型，像水晶/钻石
// 多角度摆放，科幻感强
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

// 晶体外形：用多个切面交集创造多面体
module crystal_outer() {
    // 基础形状：拉伸的菱形截面
    intersection() {
        // 主体八角柱
        cylinder(r=32, h=50, center=true, $fn=8);
        // 上下削切 - 创造钻石顶部
        rotate([0, 0, 22.5])
            cylinder(r=38, h=40, center=true, $fn=8);
        // 前后压扁
        cube([70, 55, 50], center=true);
        // 上方倾斜切面
        translate([0, 0, 5])
            rotate([10, 5, 0])
                cube([80, 80, 30], center=true);
        // 下方切平（桌面摆放面）
        translate([0, 0, 2])
            cube([80, 80, 34], center=true);
    }
}

// 倒圆角版本
module crystal_body() {
    minkowski() {
        scale([0.94, 0.94, 0.94]) crystal_outer();
        sphere(r=1.5);
    }
}

// 内腔
module crystal_cavity() {
    // 跟随外形缩小
    scale([0.88, 0.85, 0.85]) crystal_outer();
}

// 屏幕开孔 - 在顶面（主要观看面）
module screen_cutout() {
    // 圆形LCD
    translate([0, 0, 12])
        cylinder(d=screen_round_d + 1, h=10);
}

// 方形OLED备选
module screen_cutout_rect() {
    translate([-screen_rect_w/2 - 0.5, -screen_rect_h/2 - 0.5, 12])
        cube([screen_rect_w + 1, screen_rect_h + 1, 10]);
}

// USB-C 侧面开孔
module usbc_port() {
    translate([0, 28, -2])
        rotate([90, 0, 0])
            hull() {
                translate([-(usbc_w/2 - usbc_h/2), 0, 0]) cylinder(d=usbc_h, h=10, center=true);
                translate([(usbc_w/2 - usbc_h/2), 0, 0]) cylinder(d=usbc_h, h=10, center=true);
            }
}

// 磁吸接口 - 底部
module magnet_slot() {
    translate([0, 0, -15])
        cylinder(d=magnet_d + 0.3, h=magnet_h + 0.2);
}

// 装饰切线槽（晶体纹理）
module crystal_grooves() {
    for (a = [0, 45, 90, 135]) {
        rotate([0, 0, a])
            translate([0, 0, 8])
                rotate([0, 90, 0])
                    cylinder(d=1.2, h=80, center=true);
    }
}

// === 组装 ===
translate([0, 0, 15]) // 抬起使底部在z=0
difference() {
    crystal_body();
    crystal_cavity();
    screen_cutout();
    usbc_port();
    magnet_slot();
    // 侧面磁吸（未来扩展）
    translate([30, 0, 0]) rotate([0, 90, 0]) cylinder(d=magnet_d+0.3, h=magnet_h+0.2);
    crystal_grooves();
}
