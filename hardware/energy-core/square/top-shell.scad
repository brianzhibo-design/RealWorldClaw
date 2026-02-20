// RWC Energy Core - Square Edition
// Part 1: Top Shell
// 55x55mm, R3 corners, screen cutout, snap fits, USB-C port
$fn = 30;

// Parameters
size = 55;
corner_r = 3;
wall = 1.8;
height = 7;
screen_od = 33;    // screen opening diameter
screen_step = 0.5; // ledge for screen to sit on
screen_ledge_od = screen_od + 2; // ledge outer diameter
snap_w = 5;        // snap fit width
snap_h = 2;        // snap fit height  
snap_d = 1.2;      // snap fit depth
tolerance = 0.15;  // half of 0.3mm total gap

module rounded_square(s, r, h) {
    linear_extrude(h)
        offset(r) offset(-r)
            square(s, center=true);
}

module top_shell() {
    difference() {
        // Outer shell
        rounded_square(size, corner_r, height);
        
        // Hollow inside
        translate([0, 0, wall])
            rounded_square(size - wall*2, corner_r - wall/2, height);
        
        // Screen opening (through hole, smaller)
        translate([0, 0, -0.1])
            cylinder(d=screen_od, h=wall + 0.2);
        
        // Screen ledge (wider, from top of wall down by step)
        translate([0, 0, -0.1])
            cylinder(d=screen_ledge_od, h=wall - screen_step + 0.1);
        
        // USB-C port (on -Y side, centered)
        translate([0, -size/2 - 0.1, height - 4.5])
            cube([9, wall + 0.2, 3.5], center=false);
        translate([-4.5, -size/2 - 0.1, height - 4.5])
            cube([9, wall + 0.2, 3.5]);
    }
    
    // Snap fit tabs (4x, on each side, near bottom edge)
    for (angle = [0, 90, 180, 270]) {
        rotate([0, 0, angle])
            translate([0, -size/2 + wall - 0.1, height - snap_h - 0.5])
                snap_tab();
    }
}

module snap_tab() {
    // Tab with 45° entry ramp on bottom, 90° catch on top
    translate([-snap_w/2, 0, 0])
    hull() {
        cube([snap_w, 0.1, snap_h]);
        translate([0, -snap_d, snap_h * 0.4])
            cube([snap_w, 0.1, snap_h * 0.6]);
    }
    // Vertical catch face (top)
    translate([-snap_w/2, -snap_d, snap_h * 0.4])
        cube([snap_w, snap_d, 0.01]);
}

top_shell();
