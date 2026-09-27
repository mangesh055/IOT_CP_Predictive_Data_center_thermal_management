import React, { useState, useEffect } from 'react';
import { 
  Cpu, CheckCircle2, Upload, FileText, BarChart2, 
  TrendingUp, RefreshCw, Zap, Database
} from 'lucide-react';
import { api } from '../services/api';

export default function MLPage({ state }) {
  const [metrics, setMetrics] = useState({
    mae: 0.1472,
    rmse: 0.1922,
    r2: 0.9866,
    algorithm: 'RandomForestRegressor (scikit-learn)'
  });

  const [featureImportances, setFeatureImportances] = useState({
    temperature: 0.32,
    power: 0.22,
    fan_speed: 0.18,
    gpu_usage: 0.12,
    temperature_slope: 0.07,
    cpu_usage: 0.04,
    ambient_temp: 0.03,
    airflow: 0.01,
    humidity: 0.01
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  useEffect(() => {
    api.getPrediction().then((data) => {
      if (data.metrics) setMetrics(data.metrics);
      if (data.feature_importances) setFeatureImportances(data.feature_importances);
    }).catch((e) => console.log('Error fetching ML prediction info', e));
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);
    try {
      const res = await api.uploadDataset(file);
      if (res.status === 'SUCCESS') {
        setUploadMessage({ type: 'success', text: `Retrained model on ${res.filename} with R²: ${res.metrics.r2}` });
        if (res.metrics) setMetrics(res.metrics);
      } else {
        setUploadMessage({ type: 'error', text: `Upload failed: ${res.message}` });
      }
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Error uploading dataset.' });
    } finally {
      setIsUploading(false);
    }
  };

  const primaryDecision = state?.primary_decision || {};
  const prediction = primaryDecision?.prediction || {};

  return (
    <div className="space-y-4">
      {/* Overview & Model Evaluation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Algorithm</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono mt-1">Random Forest</div>
          <div className="text-[11px] text-slate-400 mt-1">scikit-learn ensemble (60 estimators)</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Mean Absolute Error (MAE)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{metrics.mae}°C</div>
          <div className="text-[11px] text-slate-400 mt-1">Evaluated on test split</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Root Mean Squared (RMSE)</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">{metrics.rmse}°C</div>
          <div className="text-[11px] text-slate-400 mt-1">Strict thermal error bound</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Coefficient of Det. (R²)</span>
            <BarChart2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">{metrics.r2}</div>
          <div className="text-[11px] text-slate-400 mt-1">Variance explained (98.7%)</div>
        </div>
      </div>

      {/* Feature Importances Bar Chart */}
      <div className="glass-panel p-5 rounded-xl border border-datacenter-border">
        <h3 className="text-sm font-semibold tracking-wide text-white uppercase mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
          Feature Importance Distribution (Random Forest)
        </h3>

        <div className="space-y-3">
          {Object.entries(featureImportances).map(([feat, imp]) => {
            const pct = Math.round(imp * 100);
            return (
              <div key={feat} className="text-xs font-mono">
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-semibold">{feat.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="text-cyan-400">{pct}% ({(imp).toFixed(3)})</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Features & Dataset Retraining Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feature Definitions Table */}
        <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
          <h3 className="text-sm font-semibold text-white uppercase mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Engineered Thermal Lag & Slope Features
          </h3>
          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <strong className="text-cyan-400">temperature_lag_1, 3, 5:</strong> Captures physical thermal inertia and heat capacity delays.
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <strong className="text-cyan-400">temperature_slope:</strong> (T - T_lag_5)/5 — detects rapid temperature gradient surges early.
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <strong className="text-cyan-400">gpu_usage & cpu_usage:</strong> Dynamic computational workloads leading to power spikes.
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <strong className="text-cyan-400">power & fan_speed:</strong> Heat generation vs dynamic cooling heat rejection rate.
            </div>
          </div>
        </div>

        {/* Dataset Upload & Training Script Section */}
        <div className="glass-panel p-4 rounded-xl border border-datacenter-border flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Custom Dataset Upload & Model Training Pipeline
            </h3>
            <p className="text-xs text-slate-400 mb-3 font-sans leading-relaxed">
              Upload custom CSV/Parquet data center logs (e.g. from public data center repositories or server rack logs) to retrain the Random Forest model on the fly.
            </p>

            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-4 text-center transition-colors">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                  {isUploading ? 'Retraining Model...' : 'Click to select CSV/Parquet dataset'}
                </span>
                <input
                  type="file"
                  accept=".csv,.parquet"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-500 mt-1">Columns: temperature, humidity, CPU, GPU, power, fan_speed</p>
            </div>

            {uploadMessage && (
              <div className={`mt-3 p-2 rounded text-xs font-mono ${
                uploadMessage.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
              }`}>
                {uploadMessage.text}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400">
            Training script: <strong className="text-slate-200">backend/ml/train_model.py</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
