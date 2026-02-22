// RWC Energy Core - Square (方案B)
// Square Energy Core by RealWorldClaw Team
$fn = 30;

// Parameters
size = 55;              // 边长
height = 14;            // 总厚度
wall = 1.8;             // 壁厚
corner_r = 4;           // 圆角半径
chamfer = 0.5;          // 正面装饰倒角

// 圆角正方形
module rounded_square(s, r, h) {
    linear_extrude(h)
    offset(r) offset(-r)
    square(s, center = true);
}

// 主体
module square_core() {
    half = size / 2;
    
    difference() {
        // 外壳 with front chamfer
        union() {
            translate([0, 0, chamfer])
                rounded_square(size, corner_r, height - chamfer);
            hull() {
                rounded_square(size - chamfer*2, corner_r, 0.01);
                translate([0, 0, chamfer])
                    rounded_square(size, corner_r, 0.01);
            }
        }
        
        // 内腔
        translate([0, 0, wall])
            rounded_square(size - wall*2, corner_r - wall, height - wall*2);
        
        // === 正面 (z=height) ===
        
        // 屏幕开孔 - 偏上, 圆形GC9A01 1.28寸 (直径33mm)
        translate([0, 6, height - wall - 0.1])
            cylinder(d = 33, h = wall + 0.2);
        
        // 触摸/按键区域标记 (下方3个按键位)
        for (dx = [-10, 0, 10]) {
            translate([dx, -16, height - wall - 0.1])
                cylinder(d = 4, h = wall + 0.2);
        }
        
        // === 四边侧面接口 ===
        
        // 上边: 麦克风阵列
        translate([0, half - 1, height/2 + 2])
            rotate([90, 0, 0]) {
                for (dx = [-4, -2, 0, 2, 4])
                    translate([dx, 0, 0])
                        cylinder(d = 1.2, h = wall + 2);
            }
        
        // 下边: USB-C口
        translate([0, -half - 1, height/2])
            rotate([-90, 0, 0])
                hull() {
                    translate([-4.5, 0, 0]) cylinder(d = 3.5, h = wall + 2);
                    translate([4.5, 0, 0]) cylinder(d = 3.5, h = wall + 2);
                }
        
        // 左边: RWC Bus扩展口
        translate([-half - 1, 0, height/2])
            rotate([0, 90, 0])
                hull() {
                    translate([-2, -3, 0]) cylinder(d = 2, h = wall + 2);
                    translate([-2, 3, 0]) cylinder(d = 2, h = wall + 2);
                    translate([2, -3, 0]) cylinder(d = 2, h = wall + 2);
                    translate([2, 3, 0]) cylinder(d = 2, h = wall + 2);
                }
        
        // 右边: RWC Bus扩展口
        translate([half - wall - 0.5, 0, height/2])
            rotate([0, 90, 0])
                hull() {
                    translate([-2, -3, 0]) cylinder(d = 2, h = wall + 2);
                    translate([-2, 3, 0]) cylinder(d = 2, h = wall + 2);
                    translate([2, -3, 0]) cylinder(d = 2, h = wall + 2);
                    translate([2, 3, 0]) cylinder(d = 2, h = wall + 2);
                }
        
        // === 背面 (z=0) ===
        
        // RWC Bus 8pin磁吸接口凹槽 (中心)
        translate([0, 0, -0.01])
            cylinder(d = 12, h = 2.01);
        
        // 8pin触点
        for (i = [0:7]) {
            angle = i * 360 / 8;
            translate([cos(angle)*4, sin(angle)*4, -0.01])
                cylinder(d = 1.2, h = wall + 0.1);
        }
        
        // T型导轨槽 - 水平 (从左到右穿过)
        translate([0, 10, 0]) {
            translate([-half - 1, -1.5, -0.01])
                cube([size + 2, 3, 1.2]);
            translate([-half - 1, -2.5, 0.8])
                cube([size + 2, 5, 1.2]);
        }
        translate([0, -10, 0]) {
            translate([-half - 1, -1.5, -0.01])
                cube([size + 2, 3, 1.2]);
            translate([-half - 1, -2.5, 0.8])
                cube([size + 2, 5, 1.2]);
        }
        
        // 四角定位柱孔 (M2, 直径2.2mm)
        for (dx = [-1, 1])
            for (dy = [-1, 1])
                translate([dx * (half - 6), dy * (half - 6), -0.01])
                    cylinder(d = 2.2, h = wall + 0.1);
        
        // === 内部组件 ===
        
        // ESP32-S3腔体
        translate([-25.5/2, -18/2 + 2, wall])
            cube([25.5, 18, height - wall*2]);
        
        // 电池槽
        translate([-15, -18, wall])
            cube([30, 20, 5]);
    }
}

square_core();
