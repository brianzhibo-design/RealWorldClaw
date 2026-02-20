// Clawbie V3 — Claw Assembly (left arm + right arm + push rod linkage)
// Linkage: servo horn → push rod → claw arms pivot open/close
// All dims in mm. Print flat, no supports needed.

/* ── Parameters ─────────────────────────────────────────── */

// Claw arm
arm_len      = 45;    // total arm length
arm_w        = 12;    // arm width
arm_thick    = 5;     // arm thickness
finger_len   = 20;    // finger (tip) portion
finger_w     = 10;
tip_r        = 3;     // rounded fingertip radius

// Pivot
pivot_r      = 1.6;   // M3 screw = 3mm dia, hole = 3.2mm → r=1.6
pivot_tol    = 0.1;
pivot_boss_r = 4.5;   // boss around pivot

// Linkage attachment point on arm (distance from pivot)
link_attach  = 15;    // mm from pivot center
link_hole_r  = 1.6;

// Push rod
rod_len      = 20;    // center-to-center
rod_w        = 6;
rod_thick    = 4;
rod_hole_r   = 1.6;

// Servo horn attachment
horn_hole_r  = 1.0;   // small hole for servo horn screw
horn_attach  = 10;    // distance from servo shaft to rod attach

// Claw geometry
claw_open_angle = 45;  // max open angle per arm
grip_texture_h  = 0.6; // ridge height for grip

// Assembly spacing
arm_spacing = 20;      // gap between arms at pivot

$fn = 40;

/* ── Modules ────────────────────────────────────────────── */

module grip_texture(length, width) {
    // Diagonal ridges on inner face for grip
    ridge_spacing = 2.5;
    ridge_w = 1.0;
    n = floor(length / ridge_spacing);
    for (i = [0:n]) {
        translate([i * ridge_spacing, 0, 0])
            rotate([0, 0, 30])
                cube([ridge_w, width * 1.2, grip_texture_h]);
    }
}

module claw_arm(mirror_x = false) {
    mx = mirror_x ? -1 : 1;

    difference() {
        union() {
            // Main arm body
            hull() {
                // Pivot end (fat)
                cylinder(r=pivot_boss_r, h=arm_thick);
                // Mid section
                translate([mx * arm_len * 0.4, 8, 0])
                    cylinder(r=arm_w/2, h=arm_thick);
            }

            // Finger
            hull() {
                translate([mx * arm_len * 0.4, 8, 0])
                    cylinder(r=arm_w/2, h=arm_thick);
                // Fingertip — rounded
                translate([mx * (arm_len * 0.4 + finger_len * 0.7),
                           8 + finger_len * 0.6, 0])
                    cylinder(r=tip_r, h=arm_thick);
            }

            // Linkage boss
            translate([mx * link_attach, -3, 0])
                cylinder(r=4, h=arm_thick);

            // Grip texture on inner face of finger
            translate([mx * arm_len * 0.3, 10, arm_thick - 0.1])
                rotate([0, 0, mx > 0 ? 15 : -15])
                    grip_texture(finger_len, finger_w * 0.5);
        }

        // Pivot hole (M3)
        translate([0, 0, -0.1])
            cylinder(r=pivot_r + pivot_tol, h=arm_thick + 0.2);

        // Linkage hole
        translate([mx * link_attach, -3, -0.1])
            cylinder(r=link_hole_r + pivot_tol, h=arm_thick + 0.2);
    }
}

module push_rod() {
    difference() {
        hull() {
            cylinder(r=rod_w/2, h=rod_thick);
            translate([rod_len, 0, 0])
                cylinder(r=rod_w/2, h=rod_thick);
        }
        // Holes at each end
        translate([0, 0, -0.1])
            cylinder(r=rod_hole_r + 0.1, h=rod_thick + 0.2);
        translate([rod_len, 0, -0.1])
            cylinder(r=rod_hole_r + 0.1, h=rod_thick + 0.2);
    }
}

module servo_linkage_arm() {
    // Attaches to servo horn, connects to push rods
    difference() {
        hull() {
            cylinder(r=5, h=rod_thick);
            translate([horn_attach, 0, 0])
                cylinder(r=rod_w/2, h=rod_thick);
            translate([-horn_attach, 0, 0])
                cylinder(r=rod_w/2, h=rod_thick);
        }
        // Center hole (servo horn)
        translate([0, 0, -0.1])
            cylinder(r=horn_hole_r, h=rod_thick + 0.2);
        // Left rod attach
        translate([-horn_attach, 0, -0.1])
            cylinder(r=rod_hole_r + 0.1, h=rod_thick + 0.2);
        // Right rod attach
        translate([horn_attach, 0, -0.1])
            cylinder(r=rod_hole_r + 0.1, h=rod_thick + 0.2);
    }
}

module pivot_pin() {
    // Printable pin: shaft + head (alternative to M3 screw)
    pin_r = 1.4; // slightly under 3mm for press fit
    pin_h = arm_thick * 2 + 4; // span both arms + spacers
    head_r = 3;
    head_h = 1.5;

    cylinder(r=pin_r, h=pin_h);
    cylinder(r=head_r, h=head_h);
    // Snap ring at top
    translate([0, 0, pin_h - 1])
        cylinder(r1=pin_r, r2=pin_r + 0.8, h=1);
}

/* ── Print Layout (flat on bed) ─────────────────────────── */

module print_layout() {
    // Left arm
    translate([-20, 0, 0])
        color("OrangeRed") claw_arm(false);

    // Right arm
    translate([20, 0, 0])
        color("OrangeRed") claw_arm(true);

    // Push rods ×2
    translate([-25, -25, 0])
        color("Tomato") push_rod();
    translate([10, -25, 0])
        color("Tomato") push_rod();

    // Servo linkage arm
    translate([0, -45, 0])
        color("Coral") servo_linkage_arm();

    // Pivot pins ×2 (optional, can use M3 screws)
    translate([-35, -45, 0])
        color("Gray") pivot_pin();
    translate([-28, -45, 0])
        color("Gray") pivot_pin();
}

/* ── Assembly Preview ───────────────────────────────────── */

module assembly_preview(open_angle = 20) {
    // Left arm
    rotate([0, 0, open_angle])
        color("OrangeRed", 0.9) claw_arm(false);

    // Right arm
    rotate([0, 0, -open_angle])
        color("OrangeRed", 0.9) claw_arm(true);

    // Servo linkage (centered below)
    translate([0, -20, -rod_thick - 1])
        color("Coral", 0.7) servo_linkage_arm();
}

// Uncomment one:
print_layout();
// assembly_preview(20);
