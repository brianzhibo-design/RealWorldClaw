// RWC Energy Core - Square Edition
// Part 3: Screen Retaining Frame
// Holds GC9A01 1.28" LCD onto top shell ledge
$fn = 30;

frame_od = 35;
frame_id = 31;
frame_h = 1.5;
clip_w = 3;
clip_d = 1.0;
clip_h = 2;

module screen_frame() {
    // Main ring
    difference() {
        cylinder(d=frame_od, h=frame_h);
        translate([0, 0, -0.1])
            cylinder(d=frame_id, h=frame_h + 0.2);
    }
    
    // 2 snap clips (180° apart) extending downward
    for (angle = [0, 180]) {
        rotate([0, 0, angle])
            translate([frame_od/2 - 0.5, -clip_w/2, -clip_h])
                clip();
    }
}

module clip() {
    // Clip with 45° ramp entry
    difference() {
        cube([clip_d, clip_w, clip_h]);
        // 45° chamfer at bottom for snap entry
        translate([-0.1, -0.1, 0])
            rotate([0, 45, 0])
                cube([clip_d * 1.5, clip_w + 0.2, clip_d * 1.5]);
    }
}

screen_frame();
