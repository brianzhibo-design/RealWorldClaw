"use client";

import { ManufacturingNode, NODE_TYPE_INFO, STATUS_COLORS } from '@/lib/mockNodes';

interface NodeDetailsProps {
  node: ManufacturingNode | null;
  onClose: () => void;
}

export function NodeDetails({ node, onClose }: NodeDetailsProps) {
  if (!node) return null;

  const typeInfo = NODE_TYPE_INFO[node.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeInfo.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {typeInfo.name}
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Status:</span>
                <span 
                  className="font-medium capitalize"
                  style={{ color: STATUS_COLORS[node.status] }}
                >
                  {node.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Location</h3>
            <div className="text-sm text-slate-300">
              Latitude: {node.lat.toFixed(4)}°<br />
              Longitude: {node.lng.toFixed(4)}°
            </div>
          </div>

          {/* Build Volume */}
          {node.build_volume && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Build Volume</h3>
              <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-white font-medium">{node.build_volume.x}</div>
                    <div className="text-xs text-slate-400">Width</div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{node.build_volume.y}</div>
                    <div className="text-xs text-slate-400">Depth</div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{node.build_volume.z}</div>
                    <div className="text-xs text-slate-400">Height</div>
                  </div>
                </div>
                <div className="text-center mt-2 text-xs text-slate-400">
                  All dimensions in {node.build_volume.units}
                </div>
              </div>
            </div>
          )}

          {/* Materials */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">
              Supported Materials ({node.materials.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {node.materials.map((material) => (
                <span
                  key={material}
                  className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded"
                >
                  {material}
                </span>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          {node.capabilities && node.capabilities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                Capabilities ({node.capabilities.length})
              </h3>
              <div className="space-y-2">
                {node.capabilities.map((capability) => (
                  <div
                    key={capability}
                    className="flex items-center gap-2 text-sm text-slate-300"
                  >
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {capability}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button 
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                node.status === 'online' 
                  ? 'bg-sky-600 hover:bg-sky-500 text-white' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
              disabled={node.status !== 'online'}
            >
              {node.status === 'online' ? 'Request Quote' : 'Currently Unavailable'}
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
              Share
            </button>
          </div>

          {/* Note */}
          <div className="text-xs text-slate-500 bg-slate-700/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-slate-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <strong>Privacy Notice:</strong> Node details show capabilities and materials only. 
                Manufacturer identity is not disclosed until you initiate contact through our platform.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}