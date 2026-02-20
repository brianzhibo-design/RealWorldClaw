// RWC Power Module Case (2U: 40×20mm)
$fn = 30;

// Dimensions
pcb_w = 40;
pcb_d = 20;
pcb_h = 1.6;
wall = 1.5;
case_h = 12; // tall for 18650
lid_h = 1.5;
tol = 0.3;

// 18650 battery holder cutout
bat_w = 20;
bat_d = 18.5;

module base() {
    difference() {
        // Outer shell
        cube([pcb_w + wall*2, pcb_d + wall*2, case_h]);
        // Inner cavity
        translate([wall, wall, wall])
            cube([pcb_w, pcb_d, case_h]);
        // USB-C port (front)
        translate([-0.1, wall + 6, wall + pcb_h + 1])
            cube([wall + 0.2, 9, 3.5]);
        // Switch slot (right side)
        translate([pcb_w + wall - 0.1, wall + 7, wall + pcb_h + 1])
            cube([wall + 0.2, 6, 4]);
        // Pogo pin slot (back)
        translate([wall + 12, pcb_d + wall - 0.1, wall])
            cube([16, wall + 0.2, 6]);
        // LED window
        translate([-0.1, wall + 2, wall + pcb_h + 2])
            cube([wall + 0.2, 3, 3]);
    }
    // PCB ledges
    for (y = [wall, wall + pcb_d - 1])
        translate([wall, y, wall])
            cube([pcb_w, 1, pcb_h]);
}

module lid() {
    translate([0, 0, case_h + 2]) {
        difference() {
            cube([pcb_w + wall*2, pcb_d + wall*2, lid_h]);
            // Snap fit inner lip
            translate([wall + tol, wall + tol, -0.1])
                cube([pcb_w - tol*2, pcb_d - tol*2, 0.8]);
        }
        // Snap lip
        translate([wall + tol, wall + tol, -0.7])
            difference() {
                cube([pcb_w - tol*2, pcb_d - tol*2, 0.8]);
                translate([0.8, 0.8, -0.1])
                    cube([pcb_w - tol*2 - 1.6, pcb_d - tol*2 - 1.6, 1]);
            }
    }
}

base();
lid();
