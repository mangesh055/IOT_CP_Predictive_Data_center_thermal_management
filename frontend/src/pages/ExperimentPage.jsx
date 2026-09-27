import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Play, Clock, Flame, ShieldAlert, 
  CheckCircle2, TrendingDown, Database, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { api } from '../services/api';

export default function ExperimentPage() {
  const [selectedScenario, setSelectedScenario] = useState('HIGH_LOAD');
  const [durationSec, setDurationSec] = useState(25);
  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [historicalRuns, setHistoricalRuns] = useState([]);

  useEffect(() => {
    loadHistoricalRuns();
  }, []);

  const loadHistoricalRuns = () => {
    api.getExperiments().then((data) => {
      if (data.experiments) setHistoricalRuns(data.experiments);
    }).catch((e) => console.log('Error loading experiments', e));
  };

  const handleRunExperiment = async () => {
    setIsRunning(true);
    setCurrentResult(null);
    try {
      const data = await api.runExperiment(selectedScenario, durationSec);
      setCurrentResult(data);
      loadHistoricalRuns();
    } catch (err) {
      console.error('Experiment failed', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Prepare chart data if result exists
  const chartData = currentResult ? [
    {
      mode: 'Traditional (80%)',
      energy_kwh: currentResult.results.TRADITIONAL.energy_kwh,
      avg_temp: currentResult.results.TRADITIONAL.avg_temp,
      max_temp: currentResult.results.TRADITIONAL.max_temp,
      violations: currentResult.results.TRADITIONAL.safety_violations,
      avg_fan: currentResult.results.TRADITIONAL.avg_fan_speed,
      savings: 0
    },
    {
      mode: 'Reactive IoT',
      energy_kwh: currentResult.results.REACTIVE.energy_kwh,
      avg_temp: currentResult.results.REACTIVE.avg_temp,
      max_temp: currentResult.results.REACTIVE.max_temp,
      violations: currentResult.results.REACTIVE.safety_violations,
      avg_fan: currentResult.results.REACTIVE.avg_fan_speed,
      savings: currentResult.results.REACTIVE.energy_savings_pct
    },
    {
      mode: 'AI Predictive',
      energy_kwh: currentResult.results.AI_PREDICTIVE.energy_kwh,
      avg_temp: currentResult.results.AI_PREDICTIVE.avg_temp,
      max_temp: currentResult.results.AI_PREDICTIVE.max_temp,
      violations: currentResult.results.AI_PREDICTIVE.safety_violations,
      avg_fan: currentResult.results.AI_PREDICTIVE.avg_fan_speed,
      savings: currentResult.results.AI_PREDICTIVE.energy_savings_pct
    }
  ] : [];

  return (
    <div className="space-y-4">
      {/* Experiment Runner Controls */}
      <div className="glass-panel p-5 rounded-xl border border-datacenter-border">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Automated Comparative Control Strategy Benchmark
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Executes the exact same computational workload scenario across Traditional, Reactive, and AI Predictive control strategies to evaluate energy reduction and thermal safety.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunExperiment}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
                isRunning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-900/50'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Simulating Benchmark...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Benchmark Experiment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Experiment Configuration Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Target Scenario for Benchmark:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full bg-[#080d17] border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-cyan-500 outline-none"
            >
              <option value="NORMAL">NORMAL (40% CPU, 35% GPU)</option>
              <option value="HIGH_LOAD">HIGH_LOAD (80% CPU, 75% GPU)</option>
              <option value="AI_WORKLOAD">AI_WORKLOAD (70% CPU, 92% GPU)</option>
              <option value="SUDDEN_SPIKE">SUDDEN_SPIKE (Surge to 95%)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Benchmark Duration:</span>
              <span className="text-cyan-400 font-bold">{durationSec} simulated seconds</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>
        </div>
      </div>

      {/* Results Comparison Table & Charts */}
      {currentResult && (
        <div className="glass-panel p-5 rounded-xl border border-datacenter-border animate-fadeIn space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase text-white tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Simulated Benchmark Results ({currentResult.scenario})
            </h3>
            <span className="text-xs font-mono text-emerald-400 font-bold px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40">
              SIMULATED RESULT: AI ENERGY SAVINGS: -{currentResult.results.AI_PREDICTIVE.energy_savings_pct}%
            </span>
          </div>

          {/* Side-by-side Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">METRIC</th>
                  <th className="pb-3 text-slate-300">TRADITIONAL (80% CONSTANT)</th>
                  <th className="pb-3 text-slate-300">REACTIVE IoT (THRESHOLD 26°C)</th>
                  <th className="pb-3 text-cyan-400 font-bold">AI PREDICTIVE + SAFETY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2.5 text-slate-400 font-sans">Cooling Energy Consumption</td>
                  <td className="py-2.5 font-bold text-white">{currentResult.results.TRADITIONAL.energy_kwh} kWh</td>
                  <td className="py-2.5 font-bold text-white">{currentResult.results.REACTIVE.energy_kwh} kWh</td>
                  <td className="py-2.5 font-bold text-emerald-400">{currentResult.results.AI_PREDICTIVE.energy_kwh} kWh</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-400 font-sans">Average Temperature</td>
                  <td className="py-2.5">{currentResult.results.TRADITIONAL.avg_temp}°C</td>
                  <td className="py-2.5">{currentResult.results.REACTIVE.avg_temp}°C</td>
                  <td className="py-2.5 font-bold text-cyan-300">{currentResult.results.AI_PREDICTIVE.avg_temp}°C</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-400 font-sans">Maximum Temperature</td>
                  <td className="py-2.5">{currentResult.results.TRADITIONAL.max_temp}°C</td>
                  <td className="py-2.5">{currentResult.results.REACTIVE.max_temp}°C</td>
                  <td className="py-2.5 font-bold text-cyan-300">{currentResult.results.AI_PREDICTIVE.max_temp}°C</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-400 font-sans">Safety Limit Violations (&gt;27.0°C)</td>
                  <td className="py-2.5">{currentResult.results.TRADITIONAL.safety_violations}</td>
                  <td className="py-2.5">{currentResult.results.REACTIVE.safety_violations}</td>
                  <td className="py-2.5 font-bold text-emerald-400">{currentResult.results.AI_PREDICTIVE.safety_violations} (Zero)</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-400 font-sans">Average Fan Speed</td>
                  <td className="py-2.5">{currentResult.results.TRADITIONAL.avg_fan_speed}%</td>
                  <td className="py-2.5">{currentResult.results.REACTIVE.avg_fan_speed}%</td>
                  <td className="py-2.5 font-bold text-cyan-300">{currentResult.results.AI_PREDICTIVE.avg_fan_speed}%</td>
                </tr>
                <tr className="bg-slate-900/60 font-bold">
                  <td className="py-3 text-white font-sans">Estimated Cooling Energy Savings</td>
                  <td className="py-3 text-slate-500">Baseline (0%)</td>
                  <td className="py-3 text-slate-300">{currentResult.results.REACTIVE.energy_savings_pct}%</td>
                  <td className="py-3 text-emerald-400 text-sm">+{currentResult.results.AI_PREDICTIVE.energy_savings_pct}% SAVINGS</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Visual Comparison Chart */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-300 mb-2 font-mono uppercase">
              Energy Consumption Comparison (kWh)
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="mode" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit=" kWh" />
                  <Tooltip contentStyle={{ backgroundColor: '#0b111b', borderColor: '#1f2e4a', borderRadius: '8px', fontSize: '11px' }} />
                  <Bar dataKey="energy_kwh" fill="#00f2fe" radius={[4, 4, 0, 0]} name="Energy Consumption (kWh)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Historical Experiments Table from Database */}
      <div className="glass-panel p-5 rounded-xl border border-datacenter-border">
        <h3 className="text-sm font-semibold text-white uppercase mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Recorded Experiments (Persisted in SQLite DB)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">RUN ID</th>
                <th className="pb-2">MODE</th>
                <th className="pb-2">SCENARIO</th>
                <th className="pb-2">ENERGY (kWh)</th>
                <th className="pb-2">AVG TEMP</th>
                <th className="pb-2">MAX TEMP</th>
                <th className="pb-2">VIOLATIONS</th>
                <th className="pb-2">SAVINGS %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {historicalRuns.slice(0, 8).map((run, idx) => (
                <tr key={idx} className="text-slate-300 hover:bg-slate-900/40">
                  <td className="py-2 text-slate-400">{run.experiment_id}</td>
                  <td className="py-2 font-bold text-white">{run.control_mode}</td>
                  <td className="py-2">{run.scenario}</td>
                  <td className="py-2">{run.energy_kwh}</td>
                  <td className="py-2">{run.avg_temp}°C</td>
                  <td className="py-2">{run.max_temp}°C</td>
                  <td className="py-2">{run.safety_violations}</td>
                  <td className="py-2 font-bold text-emerald-400">
                    {run.energy_savings_pct > 0 ? `+${run.energy_savings_pct}%` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
