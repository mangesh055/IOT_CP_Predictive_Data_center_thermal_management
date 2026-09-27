import React from 'react';
import KpiCards from '../components/KpiCards';
import DigitalTwin from '../components/DigitalTwin';
import AIDecisionCard from '../components/AIDecisionCard';
import SafetyMonitor from '../components/SafetyMonitor';
import ScenarioControls from '../components/ScenarioControls';
import LiveCharts from '../components/LiveCharts';
import EventLog from '../components/EventLog';

export default function DashboardPage({ state, historyData, onSelectScenario }) {
  return (
    <div className="space-y-4">
      {/* 1. Top KPI Summary Cards */}
      <KpiCards state={state} />

      {/* 2. 4-Rack Digital Twin View */}
      <DigitalTwin state={state} />

      {/* 3. Safety Guardrails Monitor */}
      <SafetyMonitor state={state} />

      {/* 4. Split Section: Explainable AI Decision Card + Scenario Injection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <AIDecisionCard state={state} />
        </div>
        <div className="lg:col-span-7">
          <ScenarioControls
            currentScenario={state?.scenario || 'NORMAL'}
            onSelectScenario={onSelectScenario}
          />
        </div>
      </div>

      {/* 5. Live Charts + Real-time Event Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <LiveCharts historyData={historyData} />
        </div>
        <div className="lg:col-span-4">
          <EventLog events={state?.events} />
        </div>
      </div>
    </div>
  );
}
