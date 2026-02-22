// ============================================================
// RWC-ONE — Peace ✌️ Variant
// RealWorldClaw Desktop AI Companion
// 
// RealWorldClaw Team | MIT License
// 
// 参数化设计：所有尺寸可调
// 分上下壳，卡扣式组装
// 打印建议：PLA, 0.2mm层高, 20%填充
// ============================================================

/* [Global Parameters] */
// 总高度(不含爪子)
body_height = 50;          // mm
// 底座直径
base_diameter = 70;        // mm
// 底座高度
base_height = 10;          // mm
// 壳体壁厚
wall = 2.0;                // mm
// 爪子总高度
claw_height = 40;          // mm

/* [Display] */
// OLED屏幕直径 (0.96寸圆形区域)
oled_diameter = 26;        // mm
// 屏幕安装深度
oled_depth = 3;            // mm

/* [LED Ring] */
// LED灯环外径
led_ring_od = 32;          // mm
// LED灯环内径
led_ring_id = 23;          // mm
// LED灯环槽深
led_ring_depth = 3;        // mm

/* [Sensor / Ports] */
// DHT22传感器孔宽
dht_width = 16;            // mm
// DHT22传感器孔高
dht_height = 8;            // mm
// USB-C口宽
usbc_width = 9.5;          // mm
// USB-C口高
usbc_height = 3.5;         // mm
// 通风格栅条数
vent_slots = 6;            // count
// 通风格栅宽
vent_width = 2;            // mm
// 通风格栅高
vent_height = 15;          // mm

/* [Assembly] */
// 卡扣宽度
snap_width = 5;            // mm
// 卡扣深度
snap_depth = 1.2;          // mm
// 卡扣数量
snap_count = 4;

/* [Finger Parameters] */
// 手指直径
finger_d = 12;             // mm
// 手指长度
finger_length = 35;        // mm
// 手指间角度
finger_spread = 30;        // degrees

// 精度
$fn = 64;

// ============================================================
// 颜色预览（仅OpenSCAD预览用）
// ============================================================
claw_color = [1, 0.42, 0.21];    // 蟹橙色
base_color = [0.15, 0.15, 0.2];  // 深灰底座
screen_color = [0.1, 0.1, 0.1];  // 屏幕黑

// ============================================================
// 模块定义
// ============================================================

// --- 圆角圆柱 ---
module rounded_cylinder(h, d, r=2) {
    hull() {
        translate([0, 0, r])
            cylinder(h=h-2*r, d=d);
        translate([0, 0, r])
            torus(d/2 - r, r);
        translate([0, 0, h-r])
            torus(d/2 - r, r);
    }
}

module torus(R, r) {
    rotate_extrude()
        translate([R, 0, 0])
            circle(r=r);
}

// --- 底座（下壳） ---
module base_bottom() {
    color(base_color)
    difference() {
        union() {
            // 主体圆柱
            cylinder(h=base_height, d=base_diameter, $fn=128);
            
            // 顶部唇边（与上壳配合）
            translate([0, 0, base_height])
                cylinder(h=2, d=base_diameter - wall*2 - 0.4);
        }
        
        // 内部掏空
        translate([0, 0, wall])
            cylinder(h=base_height + 3, d=base_diameter - wall*2);
        
        // LED灯环槽（底面）
        translate([0, 0, -0.1])
            difference() {
                cylinder(h=led_ring_depth + 0.1, d=led_ring_od + 1);
                cylinder(h=led_ring_depth + 0.2, d=led_ring_id - 1);
            }
        
        // USB-C 开口
        translate([0, -base_diameter/2 + wall/2, wall + 2])
            cube([usbc_width, wall + 2, usbc_height], center=true);
        
        // 底部 Logo 文字刻印
        translate([0, 0, 0.3])
            linear_extrude(0.8)
                text("RWC", size=10, halign="center", valign="center", font="Liberation Sans:style=Bold");
        
        // 底部导线穿孔
        translate([0, 0, -0.1])
            cylinder(h=wall+0.2, d=5);
    }
    
    // 卡扣凸起
    for (i = [0 : snap_count-1]) {
        rotate([0, 0, i * 360/snap_count])
            translate([base_diameter/2 - wall - 0.5, 0, base_height])
                snap_tab();
    }
}

// --- 卡扣 ---
module snap_tab() {
    // 小三角形卡扣
    hull() {
        cube([snap_depth, snap_width, 0.5], center=true);
        translate([snap_depth/2, 0, 2])
            cube([0.1, snap_width - 1, 0.5], center=true);
    }
}

// --- 上壳（身体） ---
module body_upper() {
    color(claw_color)
    difference() {
        union() {
            // 身体 — 略带锥度的圆柱，像蟹壳
            hull() {
                cylinder(h=1, d=base_diameter - wall*2 - 0.6);
                translate([0, 0, body_height])
                    sphere(d=base_diameter * 0.7);
            }
        }
        
        // 内部掏空
        hull() {
            translate([0, 0, -0.1])
                cylinder(h=1, d=base_diameter - wall*4 - 0.6);
            translate([0, 0, body_height])
                sphere(d=base_diameter * 0.7 - wall*2);
        }
        
        // 底部配合槽（套在底座唇边上）
        translate([0, 0, -0.1])
            cylinder(h=2.5, d=base_diameter - wall*2 + 0.2);
        
        // 正面 OLED 屏幕开孔
        translate([0, base_diameter*0.25, body_height * 0.5])
            rotate([90, 0, 0])
                cylinder(h=wall+2, d=oled_diameter);
        
        // 背面通风格栅
        for (i = [0 : vent_slots-1]) {
            translate([
                -((vent_slots-1) * (vent_width+2)) / 2 + i * (vent_width + 2),
                -base_diameter * 0.3,
                body_height * 0.3
            ])
                rotate([90, 0, 0])
                    hull() {
                        cylinder(h=wall+2, d=vent_width);
                        translate([0, vent_height, 0])
                            cylinder(h=wall+2, d=vent_width);
                    }
        }
        
        // DHT22 传感器孔（背面，格栅中间）
        translate([0, -base_diameter*0.3, body_height * 0.55])
            rotate([90, 0, 0])
                cube([dht_width, dht_height, wall+2], center=true);
        
        // 按钮孔（侧面）
        translate([base_diameter*0.3, 0, body_height * 0.3])
            rotate([0, 90, 0])
                cylinder(h=wall+2, d=7);
        
        // 卡扣槽
        for (i = [0 : snap_count-1]) {
            rotate([0, 0, i * 360/snap_count])
                translate([base_diameter/2 - wall*2 - 0.3, 0, -0.5])
                    cube([snap_depth + 0.4, snap_width + 0.4, 3], center=true);
        }
    }
}

// --- 手指（单根） ---
module finger(length, tip_round=true) {
    hull() {
        sphere(d=finger_d);
        translate([0, 0, length])
            sphere(d=finger_d * (tip_round ? 0.7 : 0.9));
    }
}

// --- 关节（装饰环） ---
module joint_ring(d) {
    difference() {
        sphere(d=d+2);
        sphere(d=d);
        translate([0, 0, -d])
            cube(d*2, center=true);
        translate([0, 0, d*0.3])
            cube(d*2, center=true);
    }
}

// --- ✌️ 和平手势 ---
module peace_claw() {
    color(claw_color) {
        // 掌心 / 手掌基座
        hull() {
            sphere(d=base_diameter * 0.55);
            translate([0, 0, -5])
                cylinder(h=1, d=base_diameter * 0.45);
        }
        
        // 食指 — V的左边
        translate([-finger_d*0.6, 0, 5])
            rotate([0, -finger_spread/2, 0]) {
                // 第一节
                finger(finger_length * 0.6);
                // 关节
                translate([0, 0, finger_length*0.6])
                    joint_ring(finger_d * 0.8);
                // 第二节（微弯）
                translate([0, 0, finger_length * 0.6])
                    rotate([0, -5, 0])
                        finger(finger_length * 0.5);
            }
        
        // 中指 — V的右边
        translate([finger_d*0.6, 0, 5])
            rotate([0, finger_spread/2, 0]) {
                finger(finger_length * 0.65);
                translate([0, 0, finger_length*0.65])
                    joint_ring(finger_d * 0.8);
                translate([0, 0, finger_length * 0.65])
                    rotate([0, 5, 0])
                        finger(finger_length * 0.5);
            }
        
        // 无名指 — 蜷缩
        translate([finger_d*1.5, 0, 0])
            rotate([0, 40, 10]) {
                finger(finger_length * 0.35, false);
            }
        
        // 小指 — 蜷缩
        translate([finger_d*2.0, -2, -3])
            rotate([0, 50, 15]) {
                finger(finger_length * 0.3, false);
            }
        
        // 拇指 — 自然弯曲覆盖蜷缩的手指
        translate([-finger_d*1.5, 3, -3])
            rotate([20, 35, -20]) {
                finger(finger_length * 0.4, false);
            }
    }
}

// --- PCB 支架柱 ---
module pcb_standoff(h=5, d=5, hole_d=2.2) {
    difference() {
        cylinder(h=h, d=d);
        translate([0, 0, -0.1])
            cylinder(h=h+0.2, d=hole_d);
    }
}

// --- ESP32-C3 安装柱 ---
module esp32_mounts() {
    // ESP32-C3 SuperMini: ~22x18mm
    for (pos = [[-9, -7], [9, -7], [-9, 7], [9, 7]]) {
        translate([pos[0], pos[1], wall])
            pcb_standoff(h=5);
    }
}

// ============================================================
// 组装预览
// ============================================================

module assembly() {
    // 底座
    base_bottom();
    
    // 底座内部安装柱
    translate([0, 0, 0])
        esp32_mounts();
    
    // 上壳
    translate([0, 0, base_height + 0.5])
        body_upper();
    
    // 爪子
    translate([0, 0, base_height + body_height + 15])
        peace_claw();
    
    // OLED 屏幕指示（预览用）
    color(screen_color)
        translate([0, base_diameter*0.25 - wall + 0.5, base_height + body_height * 0.5 + 0.5])
            rotate([90, 0, 0])
                cylinder(h=1, d=oled_diameter - 2);
}

// ============================================================
// 渲染选择
// ============================================================

/* [Render Selection] */
// 选择要渲染的部分
render_part = "assembly"; // [assembly, base, body, claw]

if (render_part == "assembly") {
    assembly();
} else if (render_part == "base") {
    base_bottom();
} else if (render_part == "body") {
    body_upper();
} else if (render_part == "claw") {
    peace_claw();
}
