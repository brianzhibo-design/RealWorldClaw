// RWC Energy Core - Exploded View (simplified for STL export)
$fn = 30;
gap = 15;

translate([0, 0, 0]) import("bottom-shell.stl");
translate([0, 0, gap * 1]) import("pcb-standoff.stl");
translate([0, 0, gap * 2]) import("battery-tray.stl");
translate([0, 0, gap * 4]) import("top-shell.stl");
translate([0, 0, gap * 5]) import("screen-frame.stl");
