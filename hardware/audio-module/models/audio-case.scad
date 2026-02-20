// RWC Audio Module Case - 40x20x12mm (2U)
// INMP441 + MAX98357A + Speaker

$fn = 30;

case_w = 40;
case_d = 20;
case_h = 12;
wall = 1.2;
corner_r = 2;

// Magnet holes
mag_d = 5;
mag_depth = 2.2;
mag_inset = 4.5;

// Pogo pad opening
pogo_w = 20;
pogo_d = 8;

// Speaker holes (side)
speaker_hole_d = 1.5;
speaker_cols = 5;
speaker_rows = 3;
speaker_spacing = 3;

// Mic hole (top)
mic_hole_d = 2;

module rounded_box(w, d, h, r) {
    hull() {
        for (x = [r, w-r], y = [r, d-r])
            translate([x, y, 0])
                cylinder(r=r, h=h);
    }
}

module case_body() {
    difference() {
        rounded_box(case_w, case_d, case_h, corner_r);
        
        // Inner cavity
        translate([wall, wall, wall])
            rounded_box(case_w - 2*wall, case_d - 2*wall, case_h, corner_r);
        
        // Bottom pogo pad opening
        translate([(case_w - pogo_w)/2, (case_d - pogo_d)/2, case_h - wall - 0.1])
            cube([pogo_w, pogo_d, wall + 0.2]);
        
        // Magnet holes (from bottom)
        for (x = [mag_inset, case_w - mag_inset],
             y = [mag_inset, case_d - mag_inset])
            translate([x, y, case_h - mag_depth])
                cylinder(d=mag_d, h=mag_depth + 0.1);
        
        // Speaker holes - side (right side, circular array)
        for (r = [0 : speaker_rows-1], c = [0 : speaker_cols-1])
            translate([case_w + 0.1,
                       case_d/2 + (c - (speaker_cols-1)/2) * speaker_spacing,
                       case_h/2 + (r - (speaker_rows-1)/2) * speaker_spacing])
                rotate([0, -90, 0])
                    cylinder(d=speaker_hole_d, h=wall + 0.2);
        
        // Speaker holes - left side too
        for (r = [0 : speaker_rows-1], c = [0 : speaker_cols-1])
            translate([-0.1,
                       case_d/2 + (c - (speaker_cols-1)/2) * speaker_spacing,
                       case_h/2 + (r - (speaker_rows-1)/2) * speaker_spacing])
                rotate([0, 90, 0])
                    cylinder(d=speaker_hole_d, h=wall + 0.2);
        
        // Mic hole - top center
        translate([case_w/2, case_d/2, -0.1])
            cylinder(d=mic_hole_d, h=wall + 0.2);
        
        // Additional mic holes (small array for better pickup)
        for (a = [0:60:300])
            translate([case_w/2 + 3*cos(a), case_d/2 + 3*sin(a), -0.1])
                cylinder(d=1, h=wall + 0.2);
    }
}

// Internal speaker mount posts
module speaker_posts() {
    post_h = 3;
    post_d = 2;
    // Speaker ~15mm diameter, mount at corners
    for (a = [45, 135, 225, 315])
        translate([case_w*0.7 + 8*cos(a), case_d/2 + 8*sin(a), wall])
            cylinder(d=post_d, h=post_h);
}

case_body();
speaker_posts();
