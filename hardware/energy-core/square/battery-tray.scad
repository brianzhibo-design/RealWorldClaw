// RWC Energy Core - Square Edition
// Part 4: Battery Tray
// Holds 30x20x5mm LiPo battery inside bottom shell
$fn = 30;

bat_w = 30.4;  // battery width + tolerance
bat_d = 20.4;  // battery depth + tolerance
bat_h = 5;
tray_wall = 1.5;
clip_h = 3;    // clip height (doesn't cover full battery)
wire_slot_w = 4;
wire_slot_d = 1.5;

module battery_tray() {
    // Base plate
    difference() {
        cube([bat_w + tray_wall*2, bat_d + tray_wall*2, 1.2], center=true);
        
        // Wire routing channels (2 slots on bottom)
        for (x = [-8, 8])
            translate([x, 0, 0])
                cube([wire_slot_w, bat_d + tray_wall*2 + 0.2, wire_slot_d], center=true);
    }
    
    // Side walls with clips
    translate([0, 0, 0.6]) {
        // Long sides (with flex clips)
        for (y = [-1, 1]) {
            translate([0, y * (bat_d/2 + tray_wall/2), clip_h/2])
                cube([bat_w - 4, tray_wall, clip_h], center=true);
            
            // Inward-facing clip bumps (2 per side)
            for (x = [-8, 8])
                translate([x, y * (bat_d/2 + 0.2), clip_h - 0.5])
                    clip_bump(y);
        }
        
        // Short sides (solid)
        for (x = [-1, 1])
            translate([x * (bat_w/2 + tray_wall/2), 0, clip_h/2])
                cube([tray_wall, bat_d - 4, clip_h], center=true);
    }
}

module clip_bump(dir) {
    // Small triangular bump to retain battery
    scale([1, -dir, 1])
        translate([-1.5, 0, 0])
            linear_extrude(1)
                polygon([[0,0], [3,0], [1.5, -0.8]]);
}

battery_tray();
