// Clawbie V4 — Stand / Cradle
// 微微前倾的底座，让蛋蛋"看"向你
// Designer: 美羊羊🎀
//
// === 打印审查修改记录 (暖羊羊🐑 QA) 2026-02-20 ===
// 1. $fn 80→60 — 避免MacBook渲染OOM
// 2. ring_depth 0.5→1.0mm — FDM侧壁凹槽≥1mm才可见
// 3. ring groove height 0.6→1.2mm — 配合加深的凹槽
// 4. cradle用浅球面(大直径球体)避免过度悬挑
// 5. 底部倒角1mm — 减少象脚效应
// ============================================

/* [Parameters] */
stand_d = 36;
stand_h = 8;
cradle_depth = 4;
tilt = 8;
ring_count = 3;
ring_depth = 1.0;      // was 0.5, FDM needs ≥1mm
pad_count = 3;
pad_d = 6;
pad_depth = 0.8;

$fn = 60;               // was 80

module stand() {
    difference() {
        union() {
            // Bottom chamfer — 1mm 45° to reduce elephant foot
            cylinder(d1=stand_d - 2, d2=stand_d, h=1);
            
            // Main base — slightly tapered cylinder
            translate([0, 0, 1])
                cylinder(d1=stand_d, d2=stand_d - 3, h=stand_h - 1);
            
            // Raised lip around cradle for grip
            translate([0, 0, stand_h - 1])
                difference() {
                    cylinder(d=stand_d - 2, h=1.5);
                    translate([0, 0, -0.1])
                        cylinder(d=stand_d - 6, h=2);
                }
        }
        
        // Tilted cradle depression — using large sphere for gentle slope
        // Large sphere radius = gentler curve = less overhang inside
        translate([0, sin(tilt) * 2, stand_h + 12])
            rotate([tilt, 0, 0])
                sphere(d = 32);
        
        // USB-C cable channel
        translate([0, stand_d/2 - 2, 2])
            cube([10, stand_d/2, 5], center=true);
        
        // Cyber ring grooves on the side
        for (i = [1:ring_count]) {
            z = (stand_h / (ring_count + 1)) * i;
            translate([0, 0, z])
                rotate_extrude()
                    translate([stand_d/2 - 1, 0, 0])
                        square([ring_depth * 2, 1.2], center=true);
        }
        
        // Anti-slip pad recesses on bottom
        for (i = [0:pad_count-1]) {
            angle = 360 / pad_count * i;
            translate([cos(angle) * stand_d/3, sin(angle) * stand_d/3, -0.1])
                cylinder(d=pad_d, h=pad_depth);
        }
    }
}

stand();
