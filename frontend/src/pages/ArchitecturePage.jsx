import React, { useState } from 'react';
import { 
  Radio, Cpu, Server, Database, ShieldCheck, 
  Activity, ArrowDown, ArrowRight, Zap, RefreshCw, Layers
} from 'lucide-react';

export default function ArchitecturePage({ state }) {
  const [selectedNode, setSelectedNode] = useState('gateway');
  const recentMessages = state?.mqtt_recent_messages || [];

  const architectureNodes = [
    {
      id: 'sensors',
      name: 'Distributed Sensors',
      type: 'Physical Probes (Simulated)',
      desc: '3 redundant temperature probes (top, middle, bottom), humidity, and Hall-effect power sensors per server rack to isolate thermal stratification.',
      inputs: 'Server heat, room airflow',
      outputs: 'Analog / I2C sensor voltages',
      tech: 'Sensirion SHT31, DS18B20 1-Wire, ACS712 Current Sensors (Simulated)'
    },
    {
      id: 'esp32',
      name: 'ESP32 IoT Nodes',
      type: 'Edge Microcontrollers (Simulated)',
      desc: 'Tensilica dual-core 240MHz microcontroller nodes deployed on each rack. Performs local sampling at 10Hz, outlier rejection, Wi-Fi 802.11 b/g/n transmission, and MQTT client publishing.',
      inputs: 'I2C / SPI / 1-Wire sensor inputs',
      outputs: 'MQTT JSON telemetry payloads over Wi-Fi',
      tech: 'ESP-IDF / FreeRTOS, MQTT QoS 1 client'
    },
    {
      id: 'mqtt',
      name: 'Virtual MQTT Broker',
      type: 'Pub/Sub Messaging Layer',
      desc: 'Lightweight publish/subscribe message broker routing real-time telemetry across topics: datacenter/rack{i}/temperature, humidity, power, workload, and cooling/fan_pwm.',
      inputs: 'ESP32 MQTT Publish packets',
      outputs: 'Subscribed streams dispatched to Central Gateway',
      tech: 'MQTT 3.1.1 protocol simulation with wildcard topic filtering'
    },
    {
      id: 'gateway',
      name: 'Central IoT Gateway',
      type: 'On-Premises Edge Compute',
      desc: 'Ingests distributed MQTT streams, performs packet validation, timestamp alignment, buffering, and orchestrates the closed-loop optimization control cycle.',
      inputs: 'Raw MQTT messages from all 4 racks',
      outputs: 'Synchronized telemetry feed & SQLite persistence',
      tech: 'Python FastAPI, AsyncIO message loop, SQLite DB'
    },
    {
      id: 'ml',
      name: 'ML Thermal Predictor',
      type: 'AI Predictive Engine',
      desc: 'Random Forest multi-target regression engine trained on lagged temperature histories, computational loads, and cooling states. Produces +5m, +10m, and +15m temperature forecasts and confidence scores.',
      inputs: 'Current T, Lags (T-1, T-3, T-5), slope, CPU, GPU, power, fan speed',
      outputs: 'Predicted temperatures & confidence metric',
      tech: 'scikit-learn RandomForestRegressor, Pandas, NumPy'
    },
    {
      id: 'safety',
      name: 'Multi-Tier Safety Layer',
      type: 'Deterministic Guardrails',
      desc: 'Strict multi-tier verification layer. Checks AI recommendations against: (1) Hard 27°C limit, (2) Rate-of-rise gradient, (3) Confidence threshold, (4) Sensor redundancy consensus, and (5) Fail-safe mode. Safety overrides AI whenever violated.',
      inputs: 'AI recommended fan speed, validated temperature, rate-of-rise, confidence',
      outputs: 'Sanctioned fan PWM & override events',
      tech: 'Deterministic multi-priority rule engine'
    },
    {
      id: 'optimizer',
      name: 'Cooling Optimizer',
      type: 'Energy Minimization Engine',
      desc: 'Searches candidate fan levels (40% - 100%), simulates thermal trajectory using ML, rejects unsafe options, and picks the candidate minimizing cubic fan energy (P ∝ RPM³).',
      inputs: 'ML candidate thermal trajectories, energy model',
      outputs: 'AI recommended fan speed + explainable rationale',
      tech: 'Constrained candidate search optimization'
    },
    {
      id: 'actuator',
      name: 'Cooling Fan Actuator',
      type: 'Physical CRAH & Fan (Simulated)',
      desc: 'Modulates fan PWM speed with realistic acceleration/deceleration slew rates and cooling airflow CFM into the server rack thermal envelope.',
      inputs: 'Sanctioned Fan PWM (0 - 100%)',
      outputs: 'Airflow CFM & convective heat extraction Q_cool',
      tech: 'PWM motor driver simulation with physical slew rate'
    }
  ];

  const selectedNodeData = architectureNodes.find(n => n.id === selectedNode) || architectureNodes[3];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl border border-datacenter-border">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Complete Closed-Loop IoT & AI Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Interactive end-to-end data pipeline from edge sensor nodes to predictive cooling actuation.
            </p>
          </div>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="mt-4 p-4 rounded-xl bg-[#080d17] border border-slate-800">
          <div className="text-xs text-slate-400 mb-3 font-mono">
            Click any component to inspect its implementation, inputs, and outputs:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono">
            {architectureNodes.map((node, i) => {
              const active = selectedNode === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node.id)}
                  className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between items-center ${
                    active
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-lg glow-cyan scale-105'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">STEP {i + 1}</span>
                  <span className="font-bold text-xs">{node.name}</span>
                  <span className="text-[9px] text-cyan-400/80 mt-1">{node.type.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Flow Loop Feedback Arrow */}
          <div className="mt-3 flex items-center justify-center space-x-2 text-[11px] font-mono text-cyan-400/80">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Closed-Loop Thermal Feedback: Actuation alters physical dynamics → IoT sensors detect updated temperatures.</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details Box */}
      <div className="glass-panel p-5 rounded-xl border border-datacenter-border animate-fadeIn">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700">
            COMPONENT SPECIFICATION: {selectedNodeData.name.toUpperCase()}
          </span>
          <span className="text-xs text-slate-400 font-mono">{selectedNodeData.type}</span>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-sans mb-4">
          {selectedNodeData.desc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block mb-1 text-[10px]">INPUT SIGNALS</span>
            <span className="text-slate-200">{selectedNodeData.inputs}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block mb-1 text-[10px]">OUTPUT SIGNALS</span>
            <span className="text-slate-200">{selectedNodeData.outputs}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-slate-500 block mb-1 text-[10px]">SIMULATED TECH STACK</span>
            <span className="text-cyan-400">{selectedNodeData.tech}</span>
          </div>
        </div>
      </div>

      {/* Live MQTT Packet Inspector */}
      <div className="glass-panel p-5 rounded-xl border border-datacenter-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase text-white tracking-wide flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Live Simulated MQTT Message Packet Inspector
          </h3>
          <span className="text-xs font-mono text-cyan-400">Broker: Online (QoS 1)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">TOPIC</th>
                <th className="pb-2">QOS</th>
                <th className="pb-2">PAYLOAD (JSON)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentMessages.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-4 text-center text-slate-500">
                    Listening for MQTT telemetry...
                  </td>
                </tr>
              ) : (
                recentMessages.map((msg, i) => (
                  <tr key={i} className="text-slate-300 hover:bg-slate-900/40">
                    <td className="py-2 text-cyan-400 font-bold">{msg.topic}</td>
                    <td className="py-2 text-slate-400">{msg.qos}</td>
                    <td className="py-2 text-slate-300 font-mono truncate max-w-md">
                      {typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
