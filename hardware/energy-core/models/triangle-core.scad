// RWC Energy Core - Triangle (方案A)
// Triangle Energy Core by RealWorldClaw Team
$fn = 30;

// Parameters
side = 65;              // 等边三角形边长
height = 14;            // 总厚度
wall = 1.8;             // 壁厚
corner_r = 5;           // 圆角半径
chamfer = 0.5;          // 正面装饰倒角

// Derived
tri_h = side * sqrt(3) / 2;  // 三角形高度
// 重心到顶点距离
centroid_to_vertex = tri_h * 2 / 3;
centroid_to_base = tri_h / 3;

// 圆角等边三角形 (centered at centroid)
module rounded_triangle(s, r, h) {
    tri_height = s * sqrt(3) / 2;
    cy = tri_height / 3;  // centroid y from base
    // 三个顶点
    p0 = [0, tri_height * 2/3];           // top
    p1 = [-s/2, -cy];                      // bottom-left  
    p2 = [s/2, -cy];                       // bottom-right
    
    linear_extrude(h)
    offset(r) offset(-r)
    polygon([p0, p1, p2]);
}

// 主体
module triangle_core() {
    cy = tri_h / 3;
    
    difference() {
        // 外壳 with chamfer
        union() {
            // Main body (slightly shorter for chamfer)
            translate([0, 0, chamfer])
                rounded_triangle(side, corner_r, height - chamfer);
            // Chamfer: smaller at z=0, full size at z=chamfer
            hull() {
                translate([0, 0, 0])
                    rounded_triangle(side - chamfer*2, corner_r, 0.01);
                translate([0, 0, chamfer])
                    rounded_triangle(side, corner_r, 0.01);
            }
        }
        
        // 内腔 (hollow out)
        translate([0, 0, wall])
            rounded_triangle(side - wall*2, corner_r - wall, height - wall*2);
        
        // === 正面 (top, z=height) ===
        
        // 屏幕开孔 - GC9A01 1.28寸圆形LCD (直径~32.4mm, 开孔33mm)
        translate([0, 0, height - wall - 0.1])
            cylinder(d = 33, h = wall + 0.2);
        
        // 角功能区 - LED指示灯位 (top vertex)
        translate([0, tri_h*2/3 - 10, height - wall - 0.1])
            cylinder(d = 3, h = wall + 0.2);
        
        // 麦克风孔 (bottom-left vertex)
        translate([-side/2 + 12, -cy + 8, height - wall - 0.1]) {
            for (dx = [-1.5, 0, 1.5])
                for (dy = [-1.5, 0, 1.5])
                    translate([dx, dy, 0])
                        cylinder(d = 1, h = wall + 0.2);
        }
        
        // === 侧面 ===
        
        // USB-C口 (bottom-right vertex area, on the base edge)
        translate([side/4, -cy - 1, height/2])
            rotate([90, 0, 0])
                hull() {
                    translate([-4.5, 0, 0]) cylinder(d = 3.5, h = wall + 2);
                    translate([4.5, 0, 0]) cylinder(d = 3.5, h = wall + 2);
                }
        
        // === 背面 (z=0) ===
        
        // RWC Bus 8pin磁吸接口凹槽 (中心, 直径12mm, 深2mm)
        translate([0, 0, -0.01])
            cylinder(d = 12, h = 2.01);
        
        // 8pin触点孔 (圆形排列)
        for (i = [0:7]) {
            angle = i * 360 / 8;
            translate([cos(angle)*4, sin(angle)*4, -0.01])
                cylinder(d = 1.2, h = wall + 0.1);
        }
        
        // T型导轨槽 - 水平 (从左到右)
        translate([0, 8, 0]) {
            // 槽口 (窄)
            translate([-side/2, -1.5, -0.01])
                cube([side, 3, 1.2]);
            // 槽底 (宽, T型)
            translate([-side/2, -2.5, 0.8])
                cube([side, 5, 1.2]);
        }
        
        // T型导轨槽 - 第二条
        translate([0, -8, 0]) {
            translate([-side/2, -1.5, -0.01])
                cube([side, 3, 1.2]);
            translate([-side/2, -2.5, 0.8])
                cube([side, 5, 1.2]);
        }
        
        // 定位柱孔 (M2, 直径2.2mm) - 3个, 靠近三角形三个角
        for (a = [90, 210, 330]) {
            px = cos(a) * (tri_h/3 + 5);
            py = sin(a) * (tri_h/3 + 5);
            translate([px, py, -0.01])
                cylinder(d = 2.2, h = wall + 0.1);
        }
        
        // === 内部组件槽 ===
        
        // ESP32-S3腔体 (25.5 x 18mm)
        translate([-25.5/2, -18/2 + 5, wall])
            cube([25.5, 18, height - wall*2]);
        
        // 电池槽 (30 x 20 x 5mm LiPo)
        translate([-15, -cy + 3, wall])
            cube([30, 20, 5]);
    }
    
    // 底部平面支撑 (flat bottom for desk standing)
    // Already flat at z=0 due to linear_extrude
}

triangle_core();
