// Clawbie V3 — Base with M5StickC Plus2 slot & SG90 servo mount
// All dimensions in mm. Parametric design, no support needed for printing.

/* ── Parameters ─────────────────────────────────────────── */

// M5StickC Plus2 body (insert vertically, screen forward)
m5_w  = 25.5;   // width (X)
m5_d  = 13.2;   // depth (Y)
m5_h  = 54.2;   // height (Z)
m5_tol = 0.4;   // tolerance per side

// SG90 micro servo
sv_w  = 11.8;   // body width (X)
sv_d  = 22.2;   // body depth (Y)
sv_h  = 31.0;   // body height incl. shaft (Z)
sv_ear_span = 27.6; // mounting ear center-to-center
sv_ear_h    = 2.5;  // ear thickness
sv_ear_w    = 4.8;  // ear width (each side beyond body)
sv_shaft_offset = 6.0; // shaft center from top of body

// Base plate
base_w = 70;     // width (X)
base_d = 65;     // depth (Y)
base_h = 5;      // plate thickness
corner_r = 5;    // fillet radius

// M5 slot
slot_wall = 2.0;

// Cable channel
cable_w = 5;
cable_d = 3;

// Servo mount position (centered X, behind M5)
sv_mount_z = base_h; // servo sits on top of base

$fn = 40;

/* ── Modules ────────────────────────────────────────────── */

module rounded_box(w, d, h, r) {
    hull() {
        for (x = [r, w-r], y = [r, d-r])
            translate([x, y, 0])
                cylinder(r=r, h=h);
    }
}

module base_plate() {
    difference() {
        rounded_box(base_w, base_d, base_h, corner_r);

        // Cable channel from servo area to back
        translate([base_w/2 - cable_w/2, 0, base_h - cable_d])
            cube([cable_w, base_d/2, cable_d + 0.1]);

        // Weight-saving pocket (bottom)
        translate([8, 8, -0.1])
            rounded_box(base_w - 16, base_d - 16, 2.5, 3);
    }
}

module m5_slot() {
    // Vertical slot for M5StickC Plus2, screen facing -Y (front)
    sw = m5_w + m5_tol * 2;
    sd = m5_d + m5_tol * 2;
    wall = slot_wall;

    translate([base_w/2 - (sw + wall*2)/2, 2, base_h]) {
        difference() {
            // Outer shell
            cube([sw + wall*2, sd + wall*2, m5_h + 3]);

            // Inner cavity (open top for insertion)
            translate([wall, wall, 2])
                cube([sw, sd, m5_h + 5]);

            // Screen window (front face, -Y side)
            translate([wall + 2, -0.1, 10])
                cube([sw - 4, wall + 0.2, 35]);

            // USB-C port access (bottom)
            translate([wall + (sw - 10)/2, wall + 2, -0.1])
                cube([10, sd - 2, 2.5]);

            // Button access holes (side)
            translate([-0.1, wall + sd/2 - 4, 20])
                cube([wall + 0.2, 8, 15]);
        }
    }
}

module servo_mount() {
    // SG90 sits behind the M5 slot, shaft pointing up
    // Snap-fit cradle — no screws needed
    tol = 0.3;
    bw = sv_w + tol*2;
    bd = sv_d + tol*2;
    cradle_h = 18; // partial wrap around servo body

    sx = base_w/2 - bw/2;
    sy = base_d/2 + 5;

    translate([sx, sy, base_h]) {
        difference() {
            // Cradle walls
            union() {
                // Left wall
                cube([2, bd, cradle_h]);
                // Right wall
                translate([bw + 2, 0, 0])
                    cube([2, bd, cradle_h]);
                // Back wall
                translate([0, bd, 0])
                    cube([bw + 4, 2, cradle_h]);
                // Ear ledge (supports mounting ears)
                translate([0, 0, cradle_h - sv_ear_h - 0.5])
                    cube([bw + 4, bd + 2, sv_ear_h + 0.5]);
            }

            // Servo body cavity
            translate([2, 0, 0])
                cube([bw, bd, cradle_h + 1]);

            // Ear slot (let ears sit in the ledge)
            ear_extra = sv_ear_w + tol;
            translate([2 - ear_extra, (bd - sv_ear_span)/2, cradle_h - sv_ear_h - 0.5 - 0.1])
                cube([bw + ear_extra*2, sv_ear_span + 2, sv_ear_h + 0.2]);

            // Wire exit (bottom back)
            translate([2 + bw/2 - 4, bd - 0.1, -0.1])
                cube([8, 3, 6]);
        }

        // Snap clips (2 per side, flex inward)
        for (side = [0, bw + 2], y_off = [bd*0.25, bd*0.7]) {
            translate([side, y_off, 0])
                snap_clip();
        }
    }
}

module snap_clip() {
    // Small triangular snap tab
    translate([0, 0, 8]) {
        hull() {
            cube([2, 3, 0.5]);
            translate([0.8, 0.5, -2])
                cube([0.4, 2, 2]);
        }
    }
}

module cable_channel_top() {
    // Guided channel on base surface from servo to M5
    translate([base_w/2 - cable_w/2, 15, base_h - 0.1]) {
        difference() {
            cube([cable_w + 2, 20, cable_d + 1]);
            translate([1, -0.1, -0.1])
                cube([cable_w, 20.2, cable_d + 0.2]);
        }
    }
}

/* ── Assembly ───────────────────────────────────────────── */

module clawbie_v3_base() {
    color("LightCoral") base_plate();
    color("Salmon") m5_slot();
    color("IndianRed") servo_mount();
    color("LightCoral") cable_channel_top();
}

clawbie_v3_base();

// Show M5 ghost for reference (comment out for printing)
%translate([base_w/2 - m5_w/2, 2 + slot_wall + m5_tol,
            base_h + 2])
    color("DarkGray", 0.3) cube([m5_w, m5_d, m5_h]);
