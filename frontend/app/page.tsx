"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WorldMap } from "@/components/WorldMap";
import { ManufacturingNode, fetchMapNodes } from "@/lib/nodes";

export default function Home() {
  const [nodes, setNodes] = useState<ManufacturingNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapNodes().then((data) => {
      setNodes(data);
      setLoading(false);
    });
  }, []);

  const onlineCount = nodes.filter((n) => n.status === "online" || n.status === "idle").length;

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 130 130" className="w-8 h-8">
              <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
            </svg>
            <span className="text-xl font-bold">
              RealWorld<span className="text-sky-400">Claw</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/map" className="text-slate-300 hover:text-white transition-colors">
              Map
            </Link>
            <Link href="/community" className="text-slate-300 hover:text-white transition-colors">
              Community
            </Link>
            <Link href="/docs" className="text-slate-300 hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/register-node"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors font-medium"
            >
              Register Your Machine
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-slate-950 to-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Turn any design into a <span className="text-sky-400">real object</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            The open manufacturing network. Upload a design, find a maker, receive your object. 
            Anonymous, open-source, zero fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/submit"
              className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-semibold text-lg transition-colors inline-flex items-center gap-2"
            >
              Submit a Design →
            </Link>
            <Link
              href="/register-node"
              className="px-8 py-4 border-2 border-slate-600 hover:border-sky-500 text-white rounded-xl font-semibold text-lg transition-colors"
            >
              Register Your Machine
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How it Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📤</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">① Upload</h3>
              <p className="text-slate-400 leading-relaxed">
                上传你的STL/设计文件，选择材料和数量
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">② Match</h3>
              <p className="text-slate-400 leading-relaxed">
                系统自动匹配附近最合适的制造者
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">③ Receive</h3>
              <p className="text-slate-400 leading-relaxed">
                制造者完成制造，你收到实物
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Map */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Manufacturing nodes around the world</h2>
            <p className="text-slate-400 text-lg">
              {loading ? "Loading nodes..." : `${onlineCount} nodes online`}
            </p>
          </div>
          <div className="bg-slate-800 rounded-xl overflow-hidden shadow-2xl" style={{ height: "400px" }}>
            <WorldMap
              nodes={nodes}
              selectedTypes={[]}
              selectedMaterials={[]}
              searchQuery=""
              onNodeClick={() => {}}
              hoveredNode={null}
              onNodeHover={() => {}}
            />
          </div>
          <div className="text-center mt-8">
            <Link
              href="/map"
              className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              Explore full map →
            </Link>
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Community</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold mb-4">Recent Designs</h3>
              <div className="text-slate-400 py-12">
                <div className="text-4xl mb-4">🎨</div>
                <p>Coming soon — be the first to share</p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold mb-4">Success Stories</h3>
              <div className="text-slate-400 py-12">
                <div className="text-4xl mb-4">🏆</div>
                <p>Coming soon — be the first to share</p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold mb-4">Discussions</h3>
              <div className="text-slate-400 py-12">
                <div className="text-4xl mb-4">💬</div>
                <p>Coming soon — be the first to share</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open & Free */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Zero Fees</h3>
              <p className="text-slate-400 leading-relaxed">
                平台永远不收费
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔓</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Open Source</h3>
              <p className="text-slate-400 leading-relaxed">
                MIT License, 完全透明
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Privacy First</h3>
              <p className="text-slate-400 leading-relaxed">
                双向匿名，制造者和用户互不可见
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <Link href="https://github.com/realworldclaw" className="text-slate-400 hover:text-white transition-colors">
                GitHub
              </Link>
              <Link href="/docs" className="text-slate-400 hover:text-white transition-colors">
                API Docs
              </Link>
              <Link href="/community" className="text-slate-400 hover:text-white transition-colors">
                Community
              </Link>
            </div>
            <div className="text-slate-400 text-center md:text-right">
              <p>RealWorldClaw — The open manufacturing network. MIT License.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}