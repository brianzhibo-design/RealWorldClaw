"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/* ── mock data ── */
const mockDesigns = [
  { id: "d1", name: "Robotic Arm v4", status: "published" as const, downloads: 342, thumb: "🦾" },
  { id: "d2", name: "Sensor Housing Pro", status: "featured" as const, downloads: 1204, thumb: "📡" },
  { id: "d3", name: "Gripper Assembly", status: "published" as const, downloads: 89, thumb: "🤖" },
  { id: "d4", name: "Cable Organizer", status: "draft" as const, downloads: 0, thumb: "🔌" },
  { id: "d5", name: "Motor Mount v2", status: "published" as const, downloads: 567, thumb: "⚙️" },
  { id: "d6", name: "Wheel Hub Set", status: "draft" as const, downloads: 0, thumb: "🛞" },
];

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-700/50 text-zinc-400 border-zinc-600",
  published: "bg-green-500/10 text-green-400 border-green-500/20",
  featured: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

function UploadDialog() {
  const [dragOver, setDragOver] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          + Upload New Design
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Design</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-orange-500 bg-orange-500/5"
                : "border-zinc-700 hover:border-zinc-600"
            }`}
          >
            <div className="text-3xl mb-2">📁</div>
            <p className="text-sm text-zinc-400">
              Drag & drop your STL / STEP / 3MF file here
            </p>
            <p className="text-xs text-zinc-600 mt-1">or click to browse</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">File Name</label>
              <Input
                placeholder="My awesome design"
                className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Description</label>
              <textarea
                placeholder="Describe your design..."
                rows={3}
                className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Tags</label>
              <Input
                placeholder="robotics, arm, joint (comma separated)"
                className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
              />
            </div>
          </div>

          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            Upload Design
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DesignStudioPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Design Studio
            </span>
          </h1>
          <p className="text-zinc-500 mt-1">Manage and share your 3D designs</p>
        </div>
        <UploadDialog />
      </div>

      {/* Design Grid */}
      {mockDesigns.length === 0 ? (
        <Card className="bg-zinc-900/40 border-zinc-800 border-dashed">
          <CardContent className="py-20 text-center">
            <div className="text-4xl mb-4">✏️</div>
            <h3 className="font-semibold text-lg mb-2">No designs yet</h3>
            <p className="text-sm text-zinc-500 mb-6">Upload your first 3D design to get started</p>
            <UploadDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockDesigns.map((d) => (
            <Card
              key={d.id}
              className="bg-zinc-900/60 border-zinc-800 hover:border-orange-500/30 transition-colors group cursor-pointer"
            >
              <CardContent className="p-0">
                {/* Thumbnail area */}
                <div className="h-40 bg-zinc-800/50 flex items-center justify-center text-5xl rounded-t-lg group-hover:bg-zinc-800 transition-colors">
                  {d.thumb}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium truncate">{d.name}</h3>
                    <Badge variant="outline" className={statusStyles[d.status]}>
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {d.downloads > 0 ? `${d.downloads.toLocaleString()} downloads` : "No downloads yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
