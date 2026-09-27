import React from 'react';
import { HelpCircle, BookOpen, CheckCircle, ShieldAlert, Cpu, Radio, Sparkles } from 'lucide-react';

export default function ExplainerPage() {
  const faqs = [
    {
      q: '1. What is IoT in the context of this data center project?',
      a: 'IoT (Internet of Things) refers to a network of interconnected physical micro-controllers and digital sensors placed directly across server racks. Instead of having a single generic room thermostat, IoT provides granular, localized, real-time telemetry (inlet temperature, exhaust temperature, humidity, power, airflow) at each server rack to detect thermal hotspots before they spread.'
    },
    {
      q: '2. What role does the ESP32 microcontroller play?',
      a: 'The ESP32 is a low-cost, dual-core 32-bit microcontroller with integrated Wi-Fi and Bluetooth. In this architecture, simulated ESP32 nodes act as edge computing units on every rack: they continuously read thermal probes, apply local median filtering to filter noise, format telemetry packets as lightweight JSON, and transmit them via MQTT over Wi-Fi to the central gateway.'
    },
    {
      q: '3. What is MQTT and why is it preferred over HTTP?',
      a: 'MQTT (Message Queuing Telemetry Transport) is an extremely lightweight, publish-subscribe messaging protocol designed specifically for constrained IoT devices and high-frequency sensor telemetry. Unlike HTTP (which requires heavy headers and connection handshakes for each request), MQTT maintains persistent lightweight TCP connections with low packet overhead (2-byte header) and supports topic-based routing (e.g. "datacenter/rack1/temperature").'
    },
    {
      q: '4. What does the Machine Learning model predict and why is prediction necessary?',
      a: 'The ML model (trained Random Forest regressor) predicts multi-step future rack temperatures at +5 minutes, +10 minutes, and +15 minutes into the future based on current temperatures, lagged history (T-1, T-3, T-5), slope, and dynamic CPU/GPU utilization. Prediction is necessary because data center cooling systems and server thermal masses have substantial physical thermal inertia: chilling takes minutes to propagate. Reactive cooling only speeds up after the room is already overheated, whereas predictive cooling ramps up preemptively before the thermal ceiling is breached.'
    },
    {
      q: '5. Why can’t the AI directly control the cooling equipment without safety checks?',
      a: 'AI and neural models are statistical approximators susceptible to distribution shifts, out-of-domain inputs, sensor noise, or hallucinated outputs. Direct AI control in mission-critical infrastructure creates catastrophic risks of thermal runaway, hardware throttling, or fires. Therefore, the deterministic Multi-Tier Safety Controller acts as an inviolable gatekeeper: it verifies every AI recommendation against hard physical laws and overrides the AI whenever boundaries are crossed.'
    },
    {
      q: '6. What are the 5 safety mechanisms implemented in this system?',
      a: 'The system enforces: (1) Hard Temperature Limit (if T > 27.0°C, emergency 100% cooling overrides AI); (2) Rate-of-Rise Preemption (detects steep temperature climbs and boosts cooling before the ceiling is breached); (3) Prediction Confidence Gate (restricts aggressive cooling cutbacks if model uncertainty is high); (4) Sensor Redundancy Consensus (median voting across 3 probes to isolate faulty or spiked sensors); and (5) Fail-Safe Mode (deterministic 80% fallback cooling engaged whenever network or broker communication is lost).'
    },
    {
      q: '7. How does cooling optimization achieve dramatic energy savings?',
      a: 'Cooling energy follows the aerodynamic Fan Affinity Laws, where electrical power scales with the cube of fan speed (P ∝ RPM³). This means running a cooling fan at 60% speed consumes only (0.60)³ ≈ 21.6% of the electrical power consumed at 100% speed—a ~78% power reduction! Traditional data centers over-provision cooling by running fans constantly at 80-100%. Our optimizer dynamically matches cooling to the exact required safe margin, maximizing energy savings without risking hardware safety.'
    },
    {
      q: '8. What happens during a sensor failure, network failure, or ML failure?',
      a: 'If a sensor fails or spikes (e.g. 38.5°C), the 3-probe median filter rejects the outlier and continues control using verified probes. If the network or MQTT broker disconnects, the Fail-Safe mode halts AI control and sets fans to a safe 80% fallback speed. If the ML predictor fails or underpredicts during a surge, the rate-of-rise and hard-limit safety layers instantly detect divergence and override cooling to 100%.'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl border border-datacenter-border">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              College Project Viva & Presentation Reference Guide
            </h2>
            <p className="text-xs text-slate-400">
              Clear, academically rigorous answers to evaluation panel questions regarding IoT, Machine Learning, thermal physics, and safety engineering.
            </p>
          </div>
        </div>

        {/* Academic Positioning Alert Box */}
        <div className="mt-3 p-3.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 leading-relaxed font-sans">
          <strong className="text-cyan-300 block mb-1">Academic Scope & Positioning:</strong>
          This project is a high-fidelity digital software simulation prototype demonstrating safety-aware predictive thermal management. It couples dynamic physical thermal dynamics (first-law thermodynamics, aerodynamic fan affinity laws) with distributed IoT telemetry and multi-step machine learning to validate how safety guardrails permit aggressive energy optimization in sustainable computing environments.
        </div>
      </div>

      {/* FAQ Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {faqs.map((faq, i) => (
          <div key={i} className="glass-panel p-4 rounded-xl border border-datacenter-border">
            <h3 className="text-xs font-bold text-white mb-2 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>{faq.q}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed pl-6 font-sans">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
