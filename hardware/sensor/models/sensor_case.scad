// RWC Sensor Module Case (1U: 20×20mm)
$fn = 30;

pcb_w = 20;
pcb_d = 20;
pcb_h = 1.6;
wall = 1.2;
case_h = 6;
lid_h = 1.2;
tol = 0.3;

module base() {
    difference() {
        cube([pcb_w + wall*2, pcb_d + wall*2, case_h]);
        translate([wall, wall, wall])
            cube([pcb_w, pcb_d, case_h]);
        // Pogo pin slot (back)
        translate([wall + 2, pcb_d + wall - 0.1, wall])
            cube([16, wall + 0.2, 5]);
        // Sensor ventilation holes (top area, front wall)
        for (i = [0:2])
            translate([-0.1, wall + 4 + i*4, wall + 2])
                cube([wall + 0.2, 2, 2]);
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
            // Light sensor window (translucent filament recommended)
            translate([wall + 3, wall + 3, -0.1])
                cube([6, 6, lid_h + 0.2]);
            // Vent grid for SHT30
            for (x = [0:2], y = [0:2])
                translate([wall + 12 + x*2.5, wall + 3 + y*2.5, -0.1])
                    cylinder(d=1.5, h=lid_h + 0.2);
            // Snap fit
            translate([wall + tol, wall + tol, -0.1])
                cube([pcb_w - tol*2, pcb_d - tol*2, 0.6]);
        }
        translate([wall + tol, wall + tol, -0.5])
            difference() {
                cube([pcb_w - tol*2, pcb_d - tol*2, 0.6]);
                translate([0.6, 0.6, -0.1])
                    cube([pcb_w - tol*2 - 1.2, pcb_d - tol*2 - 1.2, 0.8]);
            }
    }
}

base();
lid();
