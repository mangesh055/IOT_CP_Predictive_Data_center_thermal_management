import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertOctagon, ShieldAlert, Volume2, VolumeX, Flame, 
  Terminal, Zap, Wind, EyeOff, Radio, RefreshCw, X, Music
} from 'lucide-react';
import { alarmAudio } from '../services/alarmSound';

export default function HackingAlertOverlay({
  state,
  onTriggerEvent,
  manualSimulate = false,
  onToggleManualSimulate
}) {
  const [isSilenced, setIsSilenced] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [soundPreset, setSoundPreset] = useState(() => {
    return localStorage.getItem('cyber_alarm_preset') || 'sci-fi';
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [hexTicker, setHexTicker] = useState([]);
  const lastAlertTimeRef = useRef(0);

  // Extract alert status from state
  const racks = state?.racks || [];
  const safetyStatus = state?.safety_status || {};
  const currentScenario = state?.scenario || 'NORMAL';
  const hardLimit = state?.custom_settings?.hard_temp_limit || 27.0;

  // Find critical racks
  const criticalRacks = racks.filter(
    (r) => (r.temperature >= hardLimit) || r.status === 'CRITICAL'
  );

  const isHardLimitBreached = safetyStatus.hard_limit === 'CRITICAL' || criticalRacks.length > 0;
  const isFailureScenario = ['ML_FAILURE', 'NETWORK_FAILURE', 'COOLING_FAILURE'].includes(currentScenario);
  const isHighRiskActive = manualSimulate || isHardLimitBreached || isFailureScenario;

  // Peak temperature among all racks
  const maxTemp = racks.reduce((acc, r) => Math.max(acc, r.temperature || 0), state?.max_temp || 24.2);

  // Auto-reset silence when a brand new critical event triggers
  useEffect(() => {
    if (isHighRiskActive) {
      const now = Date.now();
      if (now - lastAlertTimeRef.current > 15000) {
        setIsSilenced(false);
        setIsMinimized(false);
      }
      lastAlertTimeRef.current = now;
    }
  }, [isHighRiskActive, criticalRacks.length, currentScenario]);

  // Audio siren control
  useEffect(() => {
    if (isHighRiskActive && !isSilenced && !isAudioMuted) {
      alarmAudio.startAlarm(0.14);
    } else {
      alarmAudio.stopAlarm();
    }
    return () => {
      alarmAudio.stopAlarm();
    };
  }, [isHighRiskActive, isSilenced, isAudioMuted]);

  // Generate continuous Hollywood hacker matrix/hex dump stream
  useEffect(() => {
    if (!isHighRiskActive) return;

    const interval = setInterval(() => {
      const hex = '0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
      const messages = [
        `INTRUSION_ALERT::CRITICAL_THERMAL_SURGE [${maxTemp.toFixed(1)}°C]`,
        `KERNEL_TRIP::SAFETY_LIMIT_OVERRUN (LIMIT: ${hardLimit.toFixed(1)}°C)`,
        `FAILSAFE_CONTROLLER::FORCING_100%_COOLING_VALVES`,
        `ACTUATOR_OVERHEAT::RACK_TEMP_CRITICAL`,
        `AI_MODEL_GATED::CONSERVATIVE_OVERRIDE_ACTIVE`,
        `SEC_DAEMON::UNAUTHORIZED_RATE_OF_RISE_DETECTED`,
        `SYS_MEMORY::${hex} BUFFER_OVERFLOW_GUARD_TRIGGERED`,
        `TELEMETRY_ANOMALY::EMERGENCY_COOLING_ENGAGED`
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setHexTicker((prev) => [
        { id: Math.random(), hex, msg: randomMsg, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 5)
      ]);
    }, 700);

    return () => clearInterval(interval);
  }, [isHighRiskActive, maxTemp, hardLimit]);

  if (!isHighRiskActive) return null;

  const handleSilence = () => {
    setIsSilenced(true);
    alarmAudio.stopAlarm();
  };

  const handlePresetChange = (preset) => {
    setSoundPreset(preset);
    try {
      localStorage.setItem('cyber_alarm_preset', preset);
    } catch {}
    alarmAudio.setPreset(preset);
  };

  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (nextMuted) {
      alarmAudio.stopAlarm();
    } else if (isHighRiskActive && !isSilenced) {
      alarmAudio.startAlarm(0.12);
    }
  };

  const handleEmergencyFlush = () => {
    if (onTriggerEvent) {
      onTriggerEvent('COOLING_BLAST');
    }
  };

  return (
    <>
      {/* 1. Cinematic Red Alert Vignette & Viewport Edge Glow */}
      <div 
        className="fixed inset-0 pointer-events-none z-40 cinematic-vignette border-4 border-rose-500/70 transition-all duration-300"
        aria-hidden="true"
      />

      {/* 2. CRT Scanline Texture Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-40 crt-overlay opacity-40 mix-blend-overlay"
        aria-hidden="true"
      />

      {/* 3. Top Hazard Stripe Cinema Ribbon */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-auto">
        <div className="h-2 w-full hazard-stripe-red" />
        
        {/* Cinema Broadcast Marquee Ticker */}
        <div className="bg-rose-950/95 border-b border-rose-600/80 px-4 py-1.5 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-600 text-black font-black text-[11px] font-mono tracking-widest animate-pulse">
              <AlertOctagon className="w-4 h-4 fill-black" />
              <span>CRITICAL ALERT</span>
            </span>

            <div className="flex items-center space-x-2 text-xs font-mono font-bold cyber-red-glow">
              <span className="text-rose-300">
                {manualSimulate 
                  ? '⚡ CINEMA MODE: SYSTEM BREACH & THERMAL RUNAWAY SIMULATION'
                  : isHardLimitBreached
                  ? `CORE OVER-TEMPERATURE BREACH: ${maxTemp.toFixed(1)}°C (LIMIT: ${hardLimit.toFixed(1)}°C)`
                  : `SYSTEM INTEGRITY ANOMALY: ${currentScenario} ACTIVE`}
              </span>
              <span className="hidden md:inline text-rose-400/70">|</span>
              <span className="hidden md:inline text-[11px] text-rose-200/90 font-normal">
                {criticalRacks.length > 0 
                  ? `[${criticalRacks.map(r => r.rack_id).join(', ')}] IN RED ZONE - FAIL-SAFE 100% FORCED`
                  : 'MULTI-TIER GUARDRAIL OVERRIDING AI CONTROLLER'}
              </span>
            </div>
          </div>

          {/* Quick Cinema Controls in Top Bar */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleEmergencyFlush}
              title="Force Emergency 100% Cooling Actuators"
              className="px-2.5 py-1 rounded bg-rose-500 hover:bg-rose-400 text-black font-mono font-bold text-xs flex items-center space-x-1.5 transition-all shadow-lg shadow-rose-900/50 hover:scale-105 active:scale-95"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>OVERRIDE 100% FAN</span>
            </button>

            {/* Sound Style Preset Selector */}
            <div className="flex items-center space-x-1 bg-slate-900/90 border border-rose-700/60 rounded px-1.5 py-0.5 text-xs font-mono">
              <Music className="w-3 h-3 text-rose-400" />
              <select
                value={soundPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="bg-transparent text-rose-200 text-[11px] font-mono focus:outline-none cursor-pointer"
                title="Choose Alert Sound Style"
              >
                <option value="sci-fi" className="bg-slate-900 text-slate-100">Sci-Fi Red Alert</option>
                <option value="cyber-ping" className="bg-slate-900 text-slate-100">Cyber Chime</option>
                <option value="deep-sonar" className="bg-slate-900 text-slate-100">Deep Sonar</option>
                <option value="two-tone" className="bg-slate-900 text-slate-100">Classic Siren</option>
              </select>
            </div>

            <button
              onClick={handleToggleAudio}
              title={isAudioMuted ? 'Unmute Audio Siren' : 'Mute Audio Siren'}
              className={`p-1.5 rounded border text-xs font-mono transition-all ${
                isAudioMuted 
                  ? 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white' 
                  : 'bg-rose-600/30 border-rose-500 text-rose-300 animate-pulse'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleSilence}
              title="Silence Alert Audio and Minimize"
              className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono hover:text-white transition-all"
            >
              {isSilenced ? 'SILENCED' : 'ACKNOWLEDGE'}
            </button>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Expand Movie Alert HUD' : 'Collapse HUD'}
              className="p-1 rounded bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white transition-all"
            >
              {isMinimized ? <Terminal className="w-3.5 h-3.5 text-rose-400" /> : <X className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Hollywood Hacker Floating Tactical HUD Panel */}
      {!isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full pointer-events-auto animate-fadeIn">
          <div className="bg-[#0b0507]/95 border-2 border-rose-600/90 rounded-2xl p-4 shadow-2xl shadow-rose-950/80 backdrop-blur-xl relative overflow-hidden">
            {/* Top Hazard Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 hazard-stripe-red" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-900/60 mb-3">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500 flex items-center justify-center animate-fast-strobe">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  </div>
                  {/* Rotating radar reticle */}
                  <div className="absolute inset-0 rounded-lg border border-dashed border-rose-400/50 animate-radar-sweep pointer-events-none" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-black text-rose-400 tracking-wider flex items-center gap-1.5 cyber-red-glow">
                    <span>SECURITY COMPROMISE / HIGH ALERT</span>
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400">
                    THREAT ASSESSMENT: <strong className="text-rose-400">CRITICAL RUNAWAY RISK</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-slate-500 hover:text-slate-300 p-1 rounded"
                  title="Minimize HUD"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Affected Nodes & Telemetry HUD Matrix */}
            <div className="grid grid-cols-2 gap-2 mb-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400">MAX CLUSTER TEMP</span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-xl font-black text-rose-400 cyber-red-glow">
                    {maxTemp.toFixed(1)}°C
                  </span>
                  <span className="text-[10px] text-rose-300">
                    (+{(maxTemp - hardLimit > 0 ? maxTemp - hardLimit : 0).toFixed(1)}°C)
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (maxTemp / 32) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400">SAFETY ACTUATOR</span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-base font-bold text-amber-400">
                    100% FAN
                  </span>
                  <span className="text-[10px] text-slate-400">FORCED</span>
                </div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                  <Radio className="w-3 h-3 animate-ping" />
                  <span>FAIL-SAFE GUARDRAIL</span>
                </div>
              </div>
            </div>

            {/* Hollywood Matrix/Hex Code Terminal Stream */}
            <div className="bg-[#050203] rounded-lg p-2.5 border border-rose-900/50 font-mono text-[10px] mb-3">
              <div className="flex items-center justify-between text-slate-500 mb-1 border-b border-rose-950/80 pb-1">
                <span className="flex items-center gap-1 text-rose-400">
                  <Terminal className="w-3 h-3" />
                  LIVE SYSTEM BREACH STREAM
                </span>
                <span className="text-[9px] text-slate-600">ENCRYPTION: SHADOW-X</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-hidden">
                {hexTicker.length === 0 ? (
                  <div className="text-slate-600 animate-pulse">&gt;&gt; Initializing breach diagnostic link...</div>
                ) : (
                  hexTicker.map((t) => (
                    <div key={t.id} className="text-rose-400/90 truncate flex items-center space-x-2">
                      <span className="text-rose-600 text-[9px]">{t.hex}</span>
                      <span className="text-slate-300 font-semibold truncate">&gt; {t.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audio Profile Selector Strip */}
            <div className="bg-[#050203] rounded-lg p-2 border border-rose-900/40 mb-3 font-mono text-[10px]">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <Music className="w-3 h-3" />
                  ALARM SOUND STYLE:
                </span>
                <span className="text-[9px] text-slate-500">CLICK TO PREVIEW</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'sci-fi', label: 'Sci-Fi Sweep' },
                  { id: 'cyber-ping', label: 'Cyber Chime' },
                  { id: 'deep-sonar', label: 'Deep Sonar' },
                  { id: 'two-tone', label: 'Classic Siren' },
                ].map((snd) => (
                  <button
                    key={snd.id}
                    onClick={() => handlePresetChange(snd.id)}
                    className={`px-1 py-1 rounded text-center truncate border transition-all text-[10px] ${
                      soundPreset === snd.id
                        ? 'bg-rose-600 text-white font-bold border-rose-400 shadow-sm shadow-rose-900/50'
                        : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {snd.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEmergencyFlush}
                className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono font-bold text-xs tracking-wider transition-all shadow-md shadow-rose-900/40 flex items-center justify-center space-x-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>ENGAGE EMERGENCY FLUSH</span>
              </button>

              {manualSimulate && onToggleManualSimulate && (
                <button
                  onClick={onToggleManualSimulate}
                  className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono"
                  title="Turn off movie breach simulation"
                >
                  EXIT TEST
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minimized Quick Button if minimized */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-50 bg-rose-600 hover:bg-rose-500 text-black px-4 py-2.5 rounded-full font-mono font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce border-2 border-white pointer-events-auto"
        >
          <AlertOctagon className="w-4 h-4 fill-black" />
          <span>VIEW CRITICAL HUD ({maxTemp.toFixed(1)}°C)</span>
        </button>
      )}
    </>
  );
}
