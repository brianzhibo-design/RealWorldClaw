// RWC Energy Core - Square Edition
// Part 5: PCB Standoffs (set of 4)
// M2 standoffs, 3mm tall, sit on bottom shell screw posts
$fn = 30;

standoff_h = 3;
standoff_od = 4.5;
standoff_id = 2.2;  // M2 through hole
post_inset = 7;
size = 55;

module standoff() {
    difference() {
        union() {
            cylinder(d=standoff_od, h=standoff_h);
            // Small flange at base for stability
            cylinder(d=standoff_od + 1, h=0.6);
        }
        translate([0, 0, -0.1])
            cylinder(d=standoff_id, h=standoff_h + 0.2);
    }
}

// 4 standoffs arranged at mounting positions
for (x = [-1, 1], y = [-1, 1])
    translate([x * (size/2 - post_inset), y * (size/2 - post_inset), 0])
        standoff();
