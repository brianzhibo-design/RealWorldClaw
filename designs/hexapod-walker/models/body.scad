// Hexapod Walker - Body (六角形中心体)
// RealWorldClaw Reference Design #2
$fn = 30;

// === Parameters ===
body_diameter = 80;        // 外接圆直径
body_radius = body_diameter / 2;
body_height = 12;          // 体厚度
wall = 2;                  // 壁厚

// 模块安装位
module_w = 30;             // 模块宽度(通用)
module_l = 35;             // 模块长度
module_h = 2;              // 安装柱高度
module_pin_r = 1.2;        // 卡扣柱半径

// 舵机槽 (SG90: 23x12.2x22mm)
servo_w = 12.5;            // 舵机宽+余量
servo_l = 23.5;            // 舵机长+余量
servo_d = 5;               // 槽深(嵌入体内)
servo_tab_w = 32;          // 舵机耳朵总宽
servo_tab_h = 2.5;         // 耳朵厚

// === Main Body ===
module hexagon_prism(r, h) {
    cylinder(r=r, h=h, $fn=6);
}

module servo_slot() {
    // 舵机主体槽
    translate([-servo_l/2, -servo_w/2, 0])
        cube([servo_l, servo_w, servo_d + 1]);
    // 耳朵槽
    translate([-servo_tab_w/2, -servo_w/2 - 1, servo_d - servo_tab_h])
        cube([servo_tab_w, servo_w + 2, servo_tab_h + 1]);
    // 螺丝孔
    for (dx = [-servo_tab_w/2 + 2, servo_tab_w/2 - 2])
        translate([dx, 0, -1])
            cylinder(r=1.1, h=body_height + 2);
}

module module_mount(w, l) {
    // 四角卡扣柱
    for (dx = [-w/2 + 2, w/2 - 2])
        for (dy = [-l/2 + 2, l/2 - 2])
            translate([dx, dy, 0])
                cylinder(r=module_pin_r, h=module_h);
    // 底座微凸台
    translate([-w/2, -l/2, -0.5])
        cube([w, l, 0.5]);
}

// --- Assembly ---
difference() {
    union() {
        // 主体六角柱(空心)
        difference() {
            hexagon_prism(body_radius, body_height);
            translate([0, 0, wall])
                hexagon_prism(body_radius - wall, body_height);
        }

        // 顶板
        translate([0, 0, body_height - wall])
            hexagon_prism(body_radius, wall);
    }

    // 6个舵机槽，均匀分布在六角形侧面
    for (i = [0:5]) {
        angle = i * 60 + 30;  // 偏移30°对准边中点
        translate([
            (body_radius - servo_d/2) * cos(angle),
            (body_radius - servo_d/2) * sin(angle),
            body_height/2 - servo_w/2
        ])
        rotate([0, 0, angle])
        rotate([90, 0, 0])
            servo_slot();
    }

    // 底部走线孔
    translate([0, 0, -1])
        cylinder(r=8, h=wall + 2);
}

// 顶部模块安装位
// Core (中央)
translate([0, 0, body_height])
    module_mount(module_w, module_l);

// Power (右侧)
translate([module_w + 2, 0, body_height])
    module_mount(module_w, module_l);

// Display (前方)
translate([0, module_l/2 + module_w/2 + 2, body_height])
    module_mount(module_w, 20);

// Servo模块 (底部内侧 - 翻转)
translate([-(module_w + 2), 0, wall])
    module_mount(module_w, module_l);
