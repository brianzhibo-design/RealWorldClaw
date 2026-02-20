// RWC Display Module Case - 40x20x10mm (2U)
// 0.96" OLED SSD1306 128x64

$fn = 30;

// Dimensions
case_w = 40;
case_d = 20;
case_h = 10;
wall = 1.2;
corner_r = 2;

// OLED window
oled_w = 25.5;  // visible area
oled_h = 13.5;
oled_offset_y = 0;  // centered

// Magnet holes: 5mm dia, 2mm deep
mag_d = 5;
mag_depth = 2.2;
mag_inset = 4.5;  // from center to edge

// Pogo pad opening
pogo_w = 20;
pogo_d = 8;

module rounded_box(w, d, h, r) {
    hull() {
        for (x = [r, w-r], y = [r, d-r])
            translate([x, y, 0])
                cylinder(r=r, h=h);
    }
}

module case_shell() {
    difference() {
        // Outer shell
        rounded_box(case_w, case_d, case_h, corner_r);
        
        // Inner cavity
        translate([wall, wall, wall])
            rounded_box(case_w - 2*wall, case_d - 2*wall, case_h, corner_r);
        
        // OLED window (front/top face)
        translate([(case_w - oled_w)/2, (case_d - oled_h)/2 + oled_offset_y, -0.1])
            cube([oled_w, oled_h, wall + 0.2]);
        
        // Bottom pogo pad opening
        translate([(case_w - pogo_w)/2, (case_d - pogo_d)/2, case_h - wall - 0.1])
            cube([pogo_w, pogo_d, wall + 0.2]);
        
        // Magnet holes (from bottom)
        for (x = [mag_inset, case_w - mag_inset],
             y = [mag_inset, case_d - mag_inset])
            translate([x, y, case_h - mag_depth])
                cylinder(d=mag_d, h=mag_depth + 0.1);
    }
}

// OLED support ledge inside
module oled_ledge() {
    ledge_w = 0.8;
    translate([wall, wall, wall])
        difference() {
            cube([case_w - 2*wall, case_d - 2*wall, 1.5]);
            translate([ledge_w, ledge_w, -0.1])
                cube([case_w - 2*wall - 2*ledge_w, case_d - 2*wall - 2*ledge_w, 2]);
        }
}

case_shell();
oled_ledge();
