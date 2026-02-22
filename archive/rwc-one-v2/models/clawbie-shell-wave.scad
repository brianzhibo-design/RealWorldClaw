// Clawbie V2 Shell — 👋 Wave / 挥手蟹爪
// RealWorldClaw Team | OpenSCAD
// 打印建议：PLA, 0.2mm层高, 15%填充, 无支撑, <2小时

/* === 共享参数 === */
dev_w = 25.5; dev_d = 13.2; dev_h = 54.2;
wall = 2.0; tol = 0.3;
cav_w = dev_w + tol * 2; cav_d = dev_d + tol * 2; cav_h = dev_h + tol * 2;
sh_w = cav_w + wall * 2; sh_d = cav_d + wall * 2; sh_h = cav_h + wall;
scr_w = 18; scr_h = 33; scr_y_off = 10;
usb_w = 12; usb_h = 7;
btn_a_w = 10; btn_a_h = 6; btn_a_y = 3;
btn_b_w = 8; btn_b_h = 5; btn_b_y = 25;
clip_w = 6; clip_h = 3; clip_depth = 0.8;
$fn = 40;

module shell_body() {
    difference() {
        translate([0, 0, sh_h/2])
            minkowski() {
                cube([sh_w - 4, sh_d - 4, sh_h - 2], center=true);
                cylinder(r=2, h=1, center=true);
            }
        translate([0, 0, cav_h/2 + wall])
            cube([cav_w, cav_d, cav_h + 1], center=true);
        translate([0, -(sh_d/2 + 1), scr_y_off + wall + scr_h/2])
            cube([scr_w, wall + 4, scr_h], center=true);
        translate([0, -(sh_d/2 + 1), btn_a_y + wall + btn_a_h/2])
            cube([btn_a_w, wall + 4, btn_a_h], center=true);
        translate([sh_w/2 + 1, 0, btn_b_y + wall + btn_b_h/2])
            cube([wall + 4, btn_b_w, btn_b_h], center=true);
        translate([0, 0, -1])
            cube([usb_w, usb_h, wall + 4], center=true);
        translate([0, 0, sh_h + 5])
            cube([cav_w - 2, cav_d - 2, 12], center=true);
    }
}

module clips() {
    translate([-(cav_w/2 + wall), 0, sh_h * 0.6])
        rotate([0, -90, 0])
            linear_extrude(clip_depth)
                polygon([[0, -clip_w/2], [clip_h, 0], [0, clip_w/2]]);
    translate([cav_w/2 + wall, 0, sh_h * 0.3])
        rotate([0, 90, 0])
            linear_extrude(clip_depth)
                polygon([[0, -clip_w/2], [clip_h, 0], [0, clip_w/2]]);
}

module flat_base() {
    translate([0, 0, wall/2])
        minkowski() {
            cube([sh_w + 4, sh_d + 6, 1], center=true);
            cylinder(r=2, h=0.5, center=true);
        }
}

/* === 👋 蟹爪 - 挥手手势 === */
module wave_claw() {
    finger_r = 2.5;

    translate([0, 0, sh_h]) {
        // 基座
        cylinder(r1=sh_w/2 - 1, r2=6, h=5);

        // 掌心
        translate([0, 0, 5])
            scale([1.2, 0.6, 0.4])
                sphere(r=10);

        // 五根张开的手指 — 微微弯曲像挥手
        translate([0, 0, 8]) {
            // 手指位置和角度（从左到右：小指到拇指）
            finger_angles = [35, 18, 5, -12, -40];
            finger_lengths = [14, 18, 20, 18, 13];
            finger_tilts = [5, -3, -5, 3, 15]; // 前后摆动（挥手感）
            x_offsets = [-8, -4, 0, 4, 9];

            for (i = [0:4]) {
                translate([x_offsets[i], 0, 0])
                    rotate([finger_tilts[i], finger_angles[i], 0]) {
                        // 指段
                        cylinder(r1=finger_r, r2=finger_r * 0.6, h=finger_lengths[i]);
                        // 指尖
                        translate([0, 0, finger_lengths[i]])
                            sphere(r=finger_r * 0.6);
                        // 关节
                        translate([0, 0, finger_lengths[i] * 0.45])
                            sphere(r=finger_r * 0.9);
                    }
            }
        }
    }
}

/* === 组装 === */
union() {
    shell_body();
    clips();
    flat_base();
    wave_claw();
}
