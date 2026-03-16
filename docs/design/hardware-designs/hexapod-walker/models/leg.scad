// Hexapod Walker - Leg (参数化腿部件)
// RealWorldClaw Reference Design #2
$fn = 30;

// === Parameters (调整这些来改变腿长) ===
thigh_length = 25;        // 大腿长度
shin_length = 30;         // 小腿长度
leg_width = 8;            // 腿宽度
leg_thick = 4;            // 腿厚度

// 舵机摇臂接口
horn_hole_r = 1.1;        // 摇臂中心孔
horn_screw_r = 0.8;       // 固定螺丝孔
horn_boss_r = 4;          // 摇臂连接凸台

// 足尖
foot_r = 3;               // 足尖球半径
foot_angle = 15;          // 足尖弯曲角度

// === Modules ===
module horn_connector() {
    difference() {
        cylinder(r=horn_boss_r, h=leg_thick);
        // 摇臂中心孔
        translate([0, 0, -1])
            cylinder(r=horn_hole_r, h=leg_thick + 2);
        // 固定螺丝孔
        translate([0, 0, -1])
            cylinder(r=horn_screw_r, h=leg_thick + 2);
    }
}

module leg_segment(length) {
    hull() {
        translate([0, 0, 0])
            cylinder(r=leg_width/2, h=leg_thick);
        translate([length, 0, 0])
            cylinder(r=leg_width/2 - 1, h=leg_thick);
    }
}

module foot_tip() {
    sphere(r=foot_r);
}

// === Assembly ===
// 摇臂连接部
horn_connector();

// 大腿
translate([horn_boss_r - 1, 0, 0])
    leg_segment(thigh_length);

// 膝关节加强
translate([horn_boss_r - 1 + thigh_length, 0, 0])
    cylinder(r=leg_width/2, h=leg_thick);

// 小腿（向下弯曲一点角度）
translate([horn_boss_r - 1 + thigh_length, 0, 0])
    rotate([0, 0, -foot_angle])
        leg_segment(shin_length);

// 足尖（球形，增加抓地力）
translate([
    horn_boss_r - 1 + thigh_length + shin_length * cos(foot_angle),
    -shin_length * sin(foot_angle),
    leg_thick / 2
])
    foot_tip();

// 加强筋
translate([horn_boss_r - 1 + thigh_length/2, 0, leg_thick])
    cube([thigh_length/2, 1.5, 1.5], center=true);
