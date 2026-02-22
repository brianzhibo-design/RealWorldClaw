// ============================================================
// RWC-ONE — Wave 👋 Variant
// RealWorldClaw Desktop AI Companion
//
// 美羊羊🎀 设计 | MIT License
// 底座和上壳与 Peace 版共用，仅爪子造型不同
// ============================================================

/* [Global Parameters] */
body_height = 50;
base_diameter = 70;
base_height = 10;
wall = 2.0;
claw_height = 40;

/* [Display] */
oled_diameter = 26;
oled_depth = 3;

/* [LED Ring] */
led_ring_od = 32;
led_ring_id = 23;
led_ring_depth = 3;

/* [Sensor / Ports] */
dht_width = 16;
dht_height = 8;
usbc_width = 9.5;
usbc_height = 3.5;
vent_slots = 6;
vent_width = 2;
vent_height = 15;

/* [Assembly] */
snap_width = 5;
snap_depth = 1.2;
snap_count = 4;

/* [Finger Parameters] */
finger_d = 12;
finger_length = 35;

$fn = 64;

claw_color = [1, 0.42, 0.21];
base_color = [0.15, 0.15, 0.2];
screen_color = [0.1, 0.1, 0.1];

// ============================================================
// 共享模块
// ============================================================

module torus(R, r) {
    rotate_extrude() translate([R, 0, 0]) circle(r=r);
}

module snap_tab() {
    hull() {
        cube([snap_depth, snap_width, 0.5], center=true);
        translate([snap_depth/2, 0, 2])
            cube([0.1, snap_width-1, 0.5], center=true);
    }
}

module base_bottom() {
    color(base_color)
    difference() {
        union() {
            cylinder(h=base_height, d=base_diameter, $fn=128);
            translate([0,0,base_height])
                cylinder(h=2, d=base_diameter-wall*2-0.4);
        }
        translate([0,0,wall])
            cylinder(h=base_height+3, d=base_diameter-wall*2);
        translate([0,0,-0.1])
            difference() {
                cylinder(h=led_ring_depth+0.1, d=led_ring_od+1);
                cylinder(h=led_ring_depth+0.2, d=led_ring_id-1);
            }
        translate([0,-base_diameter/2+wall/2, wall+2])
            cube([usbc_width, wall+2, usbc_height], center=true);
        translate([0,0,0.3])
            linear_extrude(0.8)
                text("RWC", size=10, halign="center", valign="center",
                     font="Liberation Sans:style=Bold");
        translate([0,0,-0.1]) cylinder(h=wall+0.2, d=5);
    }
    for (i=[0:snap_count-1])
        rotate([0,0,i*360/snap_count])
            translate([base_diameter/2-wall-0.5, 0, base_height])
                snap_tab();
}

module body_upper() {
    color(claw_color)
    difference() {
        hull() {
            cylinder(h=1, d=base_diameter-wall*2-0.6);
            translate([0,0,body_height]) sphere(d=base_diameter*0.7);
        }
        hull() {
            translate([0,0,-0.1])
                cylinder(h=1, d=base_diameter-wall*4-0.6);
            translate([0,0,body_height])
                sphere(d=base_diameter*0.7-wall*2);
        }
        translate([0,0,-0.1])
            cylinder(h=2.5, d=base_diameter-wall*2+0.2);
        translate([0, base_diameter*0.25, body_height*0.5])
            rotate([90,0,0]) cylinder(h=wall+2, d=oled_diameter);
        for (i=[0:vent_slots-1])
            translate([
                -((vent_slots-1)*(vent_width+2))/2 + i*(vent_width+2),
                -base_diameter*0.3, body_height*0.3
            ]) rotate([90,0,0]) hull() {
                cylinder(h=wall+2, d=vent_width);
                translate([0,vent_height,0]) cylinder(h=wall+2, d=vent_width);
            }
        translate([0,-base_diameter*0.3, body_height*0.55])
            rotate([90,0,0]) cube([dht_width, dht_height, wall+2], center=true);
        translate([base_diameter*0.3, 0, body_height*0.3])
            rotate([0,90,0]) cylinder(h=wall+2, d=7);
        for (i=[0:snap_count-1])
            rotate([0,0,i*360/snap_count])
                translate([base_diameter/2-wall*2-0.3, 0, -0.5])
                    cube([snap_depth+0.4, snap_width+0.4, 3], center=true);
    }
}

module finger(length, tip_round=true) {
    hull() {
        sphere(d=finger_d);
        translate([0,0,length])
            sphere(d=finger_d*(tip_round ? 0.7 : 0.9));
    }
}

module joint_ring(d) {
    difference() {
        sphere(d=d+2);
        sphere(d=d);
        translate([0,0,-d]) cube(d*2, center=true);
        translate([0,0,d*0.3]) cube(d*2, center=true);
    }
}

module pcb_standoff(h=5, d=5, hole_d=2.2) {
    difference() {
        cylinder(h=h, d=d);
        translate([0,0,-0.1]) cylinder(h=h+0.2, d=hole_d);
    }
}

module esp32_mounts() {
    for (pos=[[-9,-7],[9,-7],[-9,7],[9,7]])
        translate([pos[0], pos[1], wall]) pcb_standoff(h=5);
}

// ============================================================
// 👋 打招呼手势 — 手掌张开，手指微分开
// ============================================================
module wave_claw() {
    color(claw_color) {
        // 掌心基座
        hull() {
            sphere(d=base_diameter * 0.55);
            translate([0, 0, -5])
                cylinder(h=1, d=base_diameter * 0.45);
        }
        
        // 五指张开，略有弧度，像在挥手
        finger_angles = [
            // [x_offset, y_offset, z_offset, rot_x, rot_y, rot_z, len_mult]
            [-finger_d*1.8, 2, 0,  5, -15, -10, 0.85],   // 小指
            [-finger_d*0.8, 3, 4,  -3, -8,  -5, 0.95],   // 无名指
            [finger_d*0.1,  3, 6,  -5, 0,    0, 1.0],     // 中指（最长）
            [finger_d*1.0,  3, 4,  -3, 8,    5, 0.93],    // 食指
        ];
        
        for (f = finger_angles) {
            translate([f[0], f[1], f[2]])
                rotate([f[3], f[4], f[5]]) {
                    // 第一节
                    finger(finger_length * 0.5 * f[6]);
                    translate([0, 0, finger_length * 0.5 * f[6]])
                        joint_ring(finger_d * 0.8);
                    // 第二节
                    translate([0, 0, finger_length * 0.5 * f[6]])
                        rotate([-8, 0, 0])
                            finger(finger_length * 0.4 * f[6]);
                }
        }
        
        // 拇指 — 张开，向侧面
        translate([finger_d * 2.0, 5, -3])
            rotate([-10, 35, 25]) {
                finger(finger_length * 0.35, false);
                translate([0, 0, finger_length * 0.35])
                    joint_ring(finger_d * 0.75);
                translate([0, 0, finger_length * 0.35])
                    rotate([0, -10, 0])
                        finger(finger_length * 0.25, true);
            }
    }
}

// ============================================================
// 组装预览
// ============================================================
module assembly() {
    base_bottom();
    translate([0,0,0]) esp32_mounts();
    translate([0,0,base_height+0.5]) body_upper();
    // 手掌微微倾斜，像在挥手
    translate([0, 0, base_height+body_height+15])
        rotate([0, 10, 0])
            wave_claw();
    color(screen_color)
        translate([0, base_diameter*0.25-wall+0.5, base_height+body_height*0.5+0.5])
            rotate([90,0,0]) cylinder(h=1, d=oled_diameter-2);
}

/* [Render Selection] */
render_part = "assembly"; // [assembly, base, body, claw]

if (render_part == "assembly") assembly();
else if (render_part == "base") base_bottom();
else if (render_part == "body") body_upper();
else if (render_part == "claw") wave_claw();
