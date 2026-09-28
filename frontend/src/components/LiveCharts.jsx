import React, { useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { BarChart3, TrendingUp, Cpu, Zap, Fan, Server, Activity } from 'lucide-react';

export default function LiveCharts({ historyData = [] }) {
  const [activeMetric, setActiveMetric] = useState('temp');

  const tabs = [
    { id: 'temp', label: 'Actual vs ML Prediction', icon: TrendingUp },
    { id: 'workload', label: 'CPU & GPU Workload', icon: Cpu },
    { id: 'power', label: 'Server vs Cooling Power', icon: Zap },
    { id: 'fan', label: 'Fan Speed & Actuator', icon: Fan },
    { id: 'racks', label: 'Temperature by Rack', icon: Server },
  ];

  return (
    <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
              <span>Real-Time Telemetry & Dynamics</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 font-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE 1Hz
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Dynamic physical closed loop with ML multi-step thermal projection
            </p>
          </div>
        </div>

        {/* Chart Selector Pills */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeMetric === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMetric(tab.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'temp' ? (
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                minTickGap={35}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[(dataMin) => Math.max(16, +(dataMin - 0.5).toFixed(1)), (dataMax) => +(dataMax + 0.6).toFixed(1)]} 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                unit="°C" 
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0b111b', borderColor: '#1f2e4a', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line isAnimationActive={false} type="monotone" dataKey="actual_temp" stroke="#00f2fe" strokeWidth={2.5} dot={false} name="Actual Temp (°C)" />
              <Line isAnimationActive={false} type="monotone" dataKey="pred_5m" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Predicted +5m" />
              <Line isAnimationActive={false} type="monotone" dataKey="pred_15m" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="2 2" dot={false} name="Predicted +15m" />
              <Line isAnimationActive={false} type="monotone" dataKey="safety_limit" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Hard Safety Limit" />
            </LineChart>
          ) : activeMetric === 'workload' ? (
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.45}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                minTickGap={35}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: '#0b111b', borderColor: '#1f2e4a', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area isAnimationActive={false} type="monotone" dataKey="cpu_usage" stroke="#00f2fe" fillOpacity={1} fill="url(#cpuGradient)" strokeWidth={2} name="CPU Utilization (%)" />
              <Area isAnimationActive={false} type="monotone" dataKey="gpu_usage" stroke="#a855f7" fillOpacity={1} fill="url(#gpuGradient)" strokeWidth={2} name="GPU Utilization (%)" />
            </AreaChart>
          ) : activeMetric === 'power' ? (
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                minTickGap={35}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="W" />
              <Tooltip contentStyle={{ backgroundColor: '#0b111b', borderColor: '#1f2e4a', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line isAnimationActive={false} type="monotone" dataKey="server_power" stroke="#f59e0b" strokeWidth={2} dot={false} name="Server Compute Power (W)" />
              <Line isAnimationActive={false} type="monotone" dataKey="cooling_power" stroke="#10b981" strokeWidth={2} dot={false} name="Cooling Fan & CRAH Power (W)" />
            </LineChart>
          ) : activeMetric === 'fan' ? (
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                minTickGap={35}
                interval="preserveStartEnd"
              />
              <YAxis domain={[30, 105]} stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: '#0b111b', borderColor: '#1f2e4a', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line isAnimationActive={false} type="monotone" dataKey="ai_fan" stroke="#a855f7" strokeWidth={2} strokeDasharray="4 4" dot={false} name="AI Recommended PWM (%)" />
              <Line isAnimationActive={false} type="monotone" dataKey="actual_fan" stroke="#00f2fe" strokeWidth={2.5} dot={false} name="Sanctioned Fan Speed (%)" />
            </LineChart>
          ) : (
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                minTickGap={35}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[(dataMin) => Math.max(16, +(dataMin - 0.5).toFixed(1)), (dataMax) => +(dataMax + 0.6).toFixed(1)]} 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                unit="°C" 
              />
              <Tooltip contentStyle={{ backgroundColor: '#0b111b', borderColor: '#1f2e4a', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line isAnimationActive={false} type="monotone" dataKey="rack1_temp" stroke="#00f2fe" strokeWidth={2} dot={false} name="Rack 1 (°C)" />
              <Line isAnimationActive={false} type="monotone" dataKey="rack2_temp" stroke="#f59e0b" strokeWidth={2} dot={false} name="Rack 2 (°C)" />
              <Line isAnimationActive={false} type="monotone" dataKey="rack3_temp" stroke="#10b981" strokeWidth={2} dot={false} name="Rack 3 (°C)" />
              <Line isAnimationActive={false} type="monotone" dataKey="rack4_temp" stroke="#ec4899" strokeWidth={2} dot={false} name="Rack 4 (°C)" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
