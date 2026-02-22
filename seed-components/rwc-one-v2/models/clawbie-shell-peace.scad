// Clawbie V2 Shell — ✌️ Peace / 剪刀手蟹爪
// RealWorldClaw Team design | OpenSCAD
// 卡扣式外壳，套在M5StickC Plus2上
// 打印建议：PLA, 0.2mm层高, 15%填充, 无支撑, <2小时

/* === 参数 === */
// M5StickC Plus2 尺寸
dev_w = 25.5;   // 宽
dev_d = 13.2;   // 厚
dev_h = 54.2;   // 高

wall = 2.0;     // 壁厚
tol = 0.3;      // 公差（每侧）

// 内腔尺寸（含公差）
cav_w = dev_w + tol * 2;
cav_d = dev_d + tol * 2;
cav_h = dev_h + tol * 2;

// 外壳尺寸
sh_w = cav_w + wall * 2;
sh_d = cav_d + wall * 2;
sh_h = cav_h + wall;  // 底部有壁，顶部开放给蟹爪

// 屏幕开孔（正面）
scr_w = 18;     // 屏幕可视区宽
scr_h = 33;     // 屏幕可视区高
scr_y_off = 10; // 屏幕距底部偏移

// USB-C 开孔（底部）
usb_w = 12;
usb_h = 7;

// 按钮A开孔（正面，屏幕下方）
btn_a_w = 10;
btn_a_h = 6;
btn_a_y = 3;

// 按钮B开孔（右侧面）
btn_b_w = 8;
btn_b_h = 5;
btn_b_y = 25;

// 卡扣参数
clip_w = 6;
clip_h = 3;
clip_depth = 0.8;

// 蟹爪参数
claw_base_r = 5;
finger_r = 3;
finger_len = 22;
finger_spread = 25;  // V字张开角度（度）

$fn = 40;

/* === 主体 === */
module shell_body() {
    difference() {
        // 外壳 - 圆角长方体
        translate([0, 0, sh_h/2])
            minkowski() {
                cube([sh_w - 4, sh_d - 4, sh_h - 2], center=true);
                cylinder(r=2, h=1, center=true);
            }

        // 内腔
        translate([0, 0, cav_h/2 + wall])
            cube([cav_w, cav_d, cav_h + 1], center=true);

        // 屏幕开孔（正面 -Y方向）
        translate([0, -(sh_d/2 + 1), scr_y_off + wall + scr_h/2])
            cube([scr_w, wall + 4, scr_h], center=true);

        // 按钮A开孔（正面下方）
        translate([0, -(sh_d/2 + 1), btn_a_y + wall + btn_a_h/2])
            cube([btn_a_w, wall + 4, btn_a_h], center=true);

        // 按钮B开孔（右侧）
        translate([sh_w/2 + 1, 0, btn_b_y + wall + btn_b_h/2])
            cube([wall + 4, btn_b_w, btn_b_h], center=true);

        // USB-C开孔（底部）
        translate([0, 0, -1])
            cube([usb_w, usb_h, wall + 4], center=true);

        // 顶部开口（让蟹爪造型从这里长出来，也方便散热）
        translate([0, 0, sh_h + 5])
            cube([cav_w - 2, cav_d - 2, 12], center=true);
    }
}

/* === 卡扣 === */
module clips() {
    // 左侧卡扣
    translate([-(cav_w/2 + wall), 0, sh_h * 0.6])
        rotate([0, -90, 0])
            linear_extrude(clip_depth)
                polygon([[0, -clip_w/2], [clip_h, 0], [0, clip_w/2]]);

    // 右侧卡扣（避开按钮B位置）
    translate([cav_w/2 + wall, 0, sh_h * 0.3])
        rotate([0, 90, 0])
            linear_extrude(clip_depth)
                polygon([[0, -clip_w/2], [clip_h, 0], [0, clip_w/2]]);
}

/* === 底座（平放） === */
module flat_base() {
    translate([0, 0, wall/2])
        minkowski() {
            cube([sh_w + 4, sh_d + 6, 1], center=true);
            cylinder(r=2, h=0.5, center=true);
        }
}

/* === ✌️ 蟹爪 - Peace手势 === */
module peace_claw() {
    translate([0, 0, sh_h]) {
        // 基座 - 连接壳体
        cylinder(r1=sh_w/2 - 1, r2=claw_base_r, h=6);

        // 两根手指 - V字形
        translate([0, 0, 5]) {
            // 食指（左倾）
            rotate([0, finger_spread/2, 0])
                translate([0, 0, 0])
                    union() {
                        // 指段
                        cylinder(r1=finger_r, r2=finger_r * 0.7, h=finger_len);
                        // 指尖圆头
                        translate([0, 0, finger_len])
                            sphere(r=finger_r * 0.7);
                        // 关节
                        translate([0, 0, finger_len * 0.5])
                            sphere(r=finger_r * 1.05);
                    }

            // 中指（右倾）
            rotate([0, -finger_spread/2, 0])
                translate([0, 0, 0])
                    union() {
                        cylinder(r1=finger_r, r2=finger_r * 0.7, h=finger_len);
                        translate([0, 0, finger_len])
                            sphere(r=finger_r * 0.7);
                        translate([0, 0, finger_len * 0.5])
                            sphere(r=finger_r * 1.05);
                    }
        }
    }
}

/* === 组装 === */
union() {
    shell_body();
    clips();
    flat_base();
    peace_claw();
}
