// RWC Energy Core - Square Edition
// Assembly Exploded View
$fn = 30;

gap = 15;  // Z spacing between parts

// Layer 0: Bottom Shell
color("DimGray")
translate([0, 0, 0])
    import("bottom-shell.stl");

// Layer 1: PCB Standoffs
color("Orange")
translate([0, 0, gap * 1])
    import("pcb-standoff.stl");

// Layer 2: Battery Tray
color("SteelBlue")
translate([0, 0, gap * 2])
    import("battery-tray.stl");

// Layer 3: ESP32 placeholder (just a board shape)
color("Green", 0.6)
translate([0, 0, gap * 3]) {
    // ESP32 dev board rough shape 25x18mm
    translate([-12.5, -9, 0])
        cube([25, 18, 1.6]);
}

// Layer 4: Top Shell (flipped - opening faces down in assembly)
color("SlateGray")
translate([0, 0, gap * 4])
    import("top-shell.stl");

// Layer 5: Screen Frame
color("Coral")
translate([0, 0, gap * 5])
    import("screen-frame.stl");

// Labels
color("Black")
for (i = [0:5]) {
    labels = ["Bottom Shell", "PCB Standoffs", "Battery Tray", "ESP32 (ref)", "Top Shell", "Screen Frame"];
    translate([42, 0, gap * i + 2])
        rotate([90, 0, 0])
            linear_extrude(0.5)
                text(labels[i], size=3.5, halign="left");
}
