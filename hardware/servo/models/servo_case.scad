// RWC Servo Module Case (2U: 40×20mm)
$fn = 30;

pcb_w = 40;
pcb_d = 20;
pcb_h = 1.6;
wall = 1.5;
case_h = 8;
lid_h = 1.5;
tol = 0.3;

module base() {
    difference() {
        cube([pcb_w + wall*2, pcb_d + wall*2, case_h]);
        // Inner cavity
        translate([wall, wall, wall])
            cube([pcb_w, pcb_d, case_h]);
        // 4x servo cable slots (top edge, evenly spaced)
        for (i = [0:3])
            translate([wall + 3 + i*9, -0.1, wall + pcb_h + 1])
                cube([7.6, wall + 0.2, 5]);
        // DC jack (right side)
        translate([pcb_w + wall - 0.1, wall + 6, wall])
            cube([wall + 0.2, 9, 6]);
        // Pogo pin slot (back)
        translate([wall + 12, pcb_d + wall - 0.1, wall])
            cube([16, wall + 0.2, 6]);
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
            translate([wall + tol, wall + tol, -0.1])
                cube([pcb_w - tol*2, pcb_d - tol*2, 0.8]);
        }
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
