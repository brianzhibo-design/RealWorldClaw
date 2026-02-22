// Clawbie V4 — The Cyber Egg
// 赛博蛋：AI的第一个身体
// Designer: RealWorldClaw Team
// License: MIT
//
// === Print review modifications (RealWorldClaw QA Team) 2026-02-20 ===
// 1. egg_height 55→58mm — 内腔需≥56mm容纳M5StickC Plus2(54.2mm)
// 2. groove_depth 0.6→1.0mm, groove_width 0.8→1.2mm — FDM最小特征≥1mm
// 3. vent_d 1.2→2.0mm — FDM小孔≥2mm才能打印清晰
// 4. antenna_tip_r 1.2→2.0mm — 避免尖端太细易断(FDM竖直销≥5mm直径)
// 5. $fn 80→60 — 避免MacBook渲染OOM
// 6. 新增底部插入开口(28×16mm) — M5StickC Plus2从底部装入
// 7. 新增底部内壁导轨 — 引导M5StickC Plus2定位
// 8. 底部开口加1mm倒角 — 减少象脚效应+便于插入
// ============================================

/* [Main Parameters] */
egg_height = 58;        // was 55, need internal ≥56mm for M5StickC Plus2
egg_width = 40;
wall = 2.0;
screen_w = 27;
screen_h = 15;
screen_offset_z = 5;
screen_tilt = 12;
groove_count = 8;
groove_depth = 1.0;     // was 0.6, FDM needs ≥1mm
groove_width = 1.2;     // was 0.8, FDM needs ≥1mm
vent_rows = 4;
vent_d = 2.0;           // was 1.2, FDM needs ≥2mm
$fn = 60;               // was 80, avoid OOM on MacBook

/* [M5StickC Plus2 Cavity] */
m5_w = 25.5;
m5_h = 48.5;
m5_d = 13.5;
// Insertion tolerance
insert_tol = 0.3;

/* [Antenna Nub] */
antenna_h = 6;
antenna_r = 2.5;
antenna_tip_r = 2.0;   // was 1.2, too thin for FDM

/* [Bottom Opening] */
// Opening for inserting M5StickC Plus2 from bottom
bottom_open_w = m5_w + insert_tol * 2 + 2;  // ~28mm
bottom_open_d = m5_d + insert_tol * 2 + 2;  // ~16mm

// --- Modules ---

module egg_shape(w, h) {
    scale([w/h, w/h * 0.92, 1])
        sphere(d = h);
}

module cyber_grooves() {
    for (i = [1:groove_count]) {
        z = -egg_height/2 + (egg_height / (groove_count + 1)) * i;
        r_at_z = (egg_width/2) * sqrt(1 - pow(2*z/egg_height, 2)) * 0.95;
        if (r_at_z > 3)
        translate([0, 0, z])
            rotate_extrude()
                translate([r_at_z, 0, 0])
                    square([groove_depth*2, groove_width], center=true);
    }
}

module vent_dots() {
    for (row = [0:vent_rows-1]) {
        for (col = [-2:2]) {
            angle_h = 160 + col * 12;
            angle_v = -15 + row * 10;
            r = egg_width/2 - 0.5;
            x = r * sin(angle_h) * cos(angle_v);
            y = r * cos(angle_h) * cos(angle_v);
            z = r * sin(angle_v) + 3;
            translate([x, y, z])
                sphere(d = vent_d);
        }
    }
}

module screen_cutout() {
    translate([0, -egg_width/2 + wall/2, screen_offset_z])
        rotate([screen_tilt, 0, 0])
            cube([screen_w, wall * 4, screen_h], center=true);
}

module m5_cavity() {
    // Main board cavity
    translate([0, -2, 0])
        cube([m5_w + insert_tol*2, m5_d + insert_tol*2, m5_h + insert_tol*2], center=true);
    
    // Screen area — slightly forward
    translate([0, -m5_d/2 - 1, screen_offset_z])
        cube([screen_w + 1, 4, screen_h + 1], center=true);
    
    // Button access — front button
    translate([0, -egg_width/2, screen_offset_z + screen_h/2 + 4])
        rotate([90, 0, 0])
            cylinder(d=6, h=wall*3, center=true);
    
    // Side button access
    translate([m5_w/2 + 1, -2, 5])
        rotate([0, 90, 0])
            cylinder(d=5, h=wall*3, center=true);
}

// Bottom opening for M5StickC Plus2 insertion
module bottom_opening() {
    // Main opening — generous rectangle with chamfer
    translate([0, -2, -egg_height/2]) {
        // Main hole
        cube([bottom_open_w, bottom_open_d, wall * 3], center=true);
        // 1mm chamfer at bottom edge for elephant foot + easier insertion
        translate([0, 0, wall])
            linear_extrude(height=1.5, scale=[1.1, 1.1])
                square([bottom_open_w, bottom_open_d], center=true);
    }
    
    // USB-C port channel — extends from cavity to bottom opening
    translate([0, -3, -egg_height/2 + wall])
        cube([10, 8, wall * 3], center=true);
}

// Internal guide rails for M5StickC Plus2 positioning
module guide_rails() {
    rail_h = 15;
    rail_w = 1.0;
    rail_depth = 0.8;
    
    // Two rails on the sides of the cavity
    for (side = [-1, 1]) {
        translate([side * (m5_w/2 + insert_tol + rail_depth/2), -2, -m5_h/4])
            cube([rail_depth, rail_w, rail_h], center=true);
    }
}

module antenna() {
    translate([0, 0, egg_height/2 - 2]) {
        cylinder(r1=antenna_r, r2=antenna_tip_r, h=antenna_h);
        translate([0, 0, antenna_h])
            sphere(r=antenna_tip_r);
    }
}

// --- Assembly ---

module clawbie_body() {
    union() {
        difference() {
            union() {
                // Main egg shell
                difference() {
                    egg_shape(egg_width, egg_height);
                    egg_shape(egg_width - wall*2, egg_height - wall*2);
                    // Flat bottom
                    translate([0, 0, -egg_height/2 - 5])
                        cube([egg_width*2, egg_width*2, 10], center=true);
                }
                // Antenna
                antenna();
            }
            // Screen window
            screen_cutout();
            // M5 cavity
            m5_cavity();
            // Bottom opening for insertion
            bottom_opening();
            // Cyber grooves
            cyber_grooves();
            // Vent dots
            vent_dots();
        }
        // Guide rails (added inside cavity)
        guide_rails();
    }
}

clawbie_body();
