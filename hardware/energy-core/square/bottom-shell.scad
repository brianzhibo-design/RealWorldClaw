// RWC Energy Core - Square Edition
// Part 2: Bottom Shell
// 55x55mm, magnetic connector, T-rail, screw posts, snap slots
$fn = 30;

size = 55;
corner_r = 3;
wall = 1.8;
height = 7;
snap_w = 5.4;    // slightly wider than tab for clearance
snap_h = 2.2;
snap_d = 1.4;
screw_od = 5;
screw_id = 2.2;
screw_h = 5;
// Screw post positions (inset from corners)
post_inset = 7;

module rounded_square(s, r, h) {
    linear_extrude(h)
        offset(r) offset(-r)
            square(s, center=true);
}

module bottom_shell() {
    difference() {
        // Outer shell
        rounded_square(size, corner_r, height);
        
        // Hollow inside (leave bottom wall)
        translate([0, 0, wall])
            rounded_square(size - wall*2, corner_r - wall/2, height + 0.1);
        
        // RWC Bus magnetic connector recess (center bottom)
        translate([0, 0, -0.1])
            cylinder(d=12, h=2 + 0.1);
        
        // T-rail slot on bottom (along X axis)
        // Narrow part
        translate([-size/2 + 8, -1.5, -0.1])
            cube([size - 16, 3, 1.0 + 0.1]);
        // Wide part (T top)
        translate([-size/2 + 8, -2.5, -0.1])
            cube([size - 16, 5, 0.5 + 0.1]);
        
        // Silicone foot pads (4 corners, bottom)
        for (x = [-1, 1], y = [-1, 1])
            translate([x * 18, y * 18, -0.1])
                cylinder(d=8, h=0.8 + 0.1);
        
        // Snap fit slots (4x, matching top shell tabs)
        for (angle = [0, 90, 180, 270]) {
            rotate([0, 0, angle])
                translate([0, -size/2 + wall, height - snap_h - 0.5])
                    snap_slot();
        }
    }
    
    // Screw posts (4 corners)
    for (x = [-1, 1], y = [-1, 1])
        translate([x * (size/2 - post_inset), y * (size/2 - post_inset), wall])
            screw_post();
}

module screw_post() {
    difference() {
        cylinder(d=screw_od, h=screw_h);
        translate([0, 0, -0.1])
            cylinder(d=screw_id, h=screw_h + 0.2);
    }
}

module snap_slot() {
    translate([-snap_w/2, -snap_d - 0.1, -0.1])
        cube([snap_w, snap_d + 0.2, snap_h + 0.2]);
}

bottom_shell();
