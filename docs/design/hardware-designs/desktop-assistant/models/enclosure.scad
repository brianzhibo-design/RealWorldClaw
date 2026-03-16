// RWC Desktop Assistant - Enclosure
// Organic "pebble" shape - rounded cylindrical form with tilted face
// Fits within 80x80x80mm bounding box
// Modules: Core + Display(0.96" OLED) + Audio(mic+speaker)

$fn = 30;

// --- Parameters ---
body_d = 72;          // outer diameter
body_h = 65;          // total height
wall = 2.0;           // wall thickness
tilt = 12;            // screen face tilt angle (degrees)

// OLED window (0.96" SSD1306: ~27x19mm visible)
oled_w = 28;
oled_h = 16;
oled_z = 42;          // center height on front face

// Speaker grille (right side)
spk_d = 20;
spk_z = 30;

// Mic hole (top)
mic_d = 3;

// USB-C port (back, bottom)
usbc_w = 9.5;
usbc_h = 3.5;
usbc_z = 8;

// Anti-slip pad recesses (bottom)
pad_d = 10;
pad_depth = 0.8;
pad_r = 25;           // distance from center

// --- Modules ---

module speaker_grille(d, z) {
    // Array of slots
    slot_w = 1.2;
    slot_l = 10;
    n = 5;
    spacing = 2.5;
    rotate([0, 0, 90])
    translate([body_d/2 - wall + 1, 0, z])
    rotate([0, 90, 0])
    for (i = [-(n-1)/2 : (n-1)/2]) {
        translate([0, i * spacing, 0])
            cube([slot_l, slot_w, wall + 2], center=true);
    }
}

module usb_c_cutout() {
    translate([-body_d/2 + wall - 1, 0, usbc_z])
    rotate([0, 90, 0])
        hull() {
            for (dx = [-(usbc_w/2 - usbc_h/2), (usbc_w/2 - usbc_h/2)])
                translate([0, dx, 0])
                    cylinder(d=usbc_h, h=wall+2, center=true);
        }
}

module anti_slip_pads() {
    for (a = [0, 120, 240]) {
        rotate([0, 0, a])
        translate([pad_r, 0, -0.01])
            cylinder(d=pad_d, h=pad_depth);
    }
}

module oled_window() {
    // Tilted window on front face
    translate([0, body_d/2 - wall + 1, oled_z])
    rotate([tilt, 0, 0])
        cube([oled_w, wall + 2, oled_h], center=true);
}

module mic_hole() {
    translate([0, 0, body_h])
        cylinder(d=mic_d, h=wall + 2, center=true);
}

// --- Main Body ---
module body_outer() {
    hull() {
        // Bottom disc - slightly smaller
        translate([0, 0, 3])
            cylinder(d=body_d - 8, h=1);
        // Main body
        translate([0, 0, 10])
            cylinder(d=body_d, h=body_h - 20);
        // Top dome
        translate([0, 0, body_h - 8])
            resize([body_d - 4, body_d - 4, 16])
                sphere(d=body_d - 4);
    }
}

module body_inner() {
    translate([0, 0, wall])
    hull() {
        translate([0, 0, 3])
            cylinder(d=body_d - 8 - wall*2, h=1);
        translate([0, 0, 10])
            cylinder(d=body_d - wall*2, h=body_h - 20 - wall);
        translate([0, 0, body_h - 8 - wall])
            resize([body_d - 4 - wall*2, body_d - 4 - wall*2, 16 - wall])
                sphere(d=body_d - 4 - wall*2);
    }
}

// --- Split: Top shell + Bottom base ---
split_z = 20; // split height

module full_shell() {
    difference() {
        body_outer();
        body_inner();
        oled_window();
        speaker_grille(spk_d, spk_z);
        usb_c_cutout();
        mic_hole();
        // Bottom pad recesses
        anti_slip_pads();
    }
}

// Render full shell (print as one piece with pause-at-layer for module insertion,
// or split into top/bottom with a horizontal cut)
full_shell();
