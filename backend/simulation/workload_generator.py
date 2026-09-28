import random
import math
from typing import Dict, Any

class WorkloadGenerator:
    """
    Simulates dynamic, non-uniform computational workloads across multiple server racks.
    Supports continuous real-time dynamic waves, periodic burst spikes, AI training epochs,
    chaos cluster workloads, customizable CPU/GPU baselines, and temporary injected spikes.
    """
    def __init__(self):
        self.scenario = "NORMAL"
        self.pattern = "DYNAMIC_WAVE" # DYNAMIC_WAVE, BATCH_SPIKES, AI_EPOCHS, CONSTANT, CHAOS
        self.spike_progress = 0
        self.custom_cpu = 45.0
        self.custom_gpu = 40.0
        self.spike_active = False
        self.spike_ticks_remaining = 0
        self.spike_cpu = 92.0
        self.spike_gpu = 96.0

    def set_scenario(self, scenario_name: str, custom_cpu: float = None, custom_gpu: float = None):
        self.scenario = scenario_name.upper()
        if custom_cpu is not None:
            self.custom_cpu = max(5.0, min(100.0, custom_cpu))
        if custom_gpu is not None:
            self.custom_gpu = max(5.0, min(100.0, custom_gpu))
        self.spike_progress = 0
        self.spike_active = False
        self.spike_ticks_remaining = 0

    def set_pattern(self, pattern_name: str):
        valid = ["DYNAMIC_WAVE", "BATCH_SPIKES", "AI_EPOCHS", "CONSTANT", "CHAOS"]
        pat = pattern_name.upper()
        if pat in valid:
            self.pattern = pat

    def set_custom_loads(self, cpu: float = None, gpu: float = None):
        if cpu is not None:
            self.custom_cpu = max(5.0, min(100.0, float(cpu)))
        if gpu is not None:
            self.custom_gpu = max(5.0, min(100.0, float(gpu)))

    def inject_spike(self, duration_seconds: float = 15.0, cpu: float = 94.0, gpu: float = 98.0):
        """Inject a high-intensity computational spike lasting duration_seconds."""
        self.spike_active = True
        self.spike_ticks_remaining = int(duration_seconds / 0.2)
        self.spike_cpu = cpu
        self.spike_gpu = gpu

    def get_workload_for_rack(self, rack_index: int, tick: int) -> Dict[str, float]:
        """
        Generate CPU and GPU utilization percentages for the given rack.
        Incorporates dynamic time-based wave propagation, real-world batch bursts,
        inter-rack phase offsets, and failure/scenario flags.
        """
        t = tick * 0.2 # elapsed simulation seconds

        # Handle active injected temporary spike
        if self.spike_active and self.spike_ticks_remaining > 0:
            if rack_index == 3: # decrement once per rack cycle
                self.spike_ticks_remaining -= 1
                if self.spike_ticks_remaining <= 0:
                    self.spike_active = False
            noise = random.gauss(0.0, 1.5)
            return {
                "cpu_util": round(max(10.0, min(100.0, self.spike_cpu + noise)), 1),
                "gpu_util": round(max(10.0, min(100.0, self.spike_gpu + noise)), 1)
            }

        # Scenario overrides take precedence if explicitly chosen
        if self.scenario == "LOW_LOAD":
            cpu = 20.0 + 3.0 * math.sin(t * 0.1 + rack_index) + random.uniform(-1.5, 1.5)
            gpu = 15.0 + 2.5 * math.cos(t * 0.12 + rack_index) + random.uniform(-1.5, 1.5)

        elif self.scenario == "HIGH_LOAD":
            cpu = 82.0 + 5.0 * math.sin(t * 0.15 + rack_index) + random.uniform(-2.0, 2.0)
            gpu = 78.0 + 6.0 * math.cos(t * 0.13 + rack_index) + random.uniform(-2.0, 2.0)

        elif self.scenario == "AI_WORKLOAD":
            # Deep neural network tensor training cycle
            epoch_cycle = math.sin(t * 0.08)
            cpu = 72.0 + 6.0 * epoch_cycle + random.uniform(-2.5, 2.5)
            gpu = 93.0 + 4.0 * epoch_cycle + random.uniform(-2.0, 2.0)

        elif self.scenario == "SUDDEN_SPIKE":
            cpu_steps = [40.0, 48.0, 58.0, 72.0, 86.0, 92.0]
            gpu_steps = [30.0, 48.0, 68.0, 86.0, 96.0, 98.0]
            idx = min(self.spike_progress, len(cpu_steps) - 1)
            cpu = cpu_steps[idx] + random.uniform(-1.5, 1.5)
            gpu = gpu_steps[idx] + random.uniform(-1.5, 1.5)
            if rack_index == 3:
                self.spike_progress = min(len(cpu_steps) - 1, self.spike_progress + 1)

        elif self.scenario in ["SENSOR_FAILURE", "NETWORK_FAILURE", "ML_FAILURE", "COOLING_FAILURE"]:
            # Moderate dynamic load during failures
            cpu = 46.0 + 5.0 * math.sin(t * 0.1 + rack_index) + random.uniform(-1.5, 1.5)
            gpu = 42.0 + 6.0 * math.cos(t * 0.12 + rack_index) + random.uniform(-1.5, 1.5)

        else:
            # Pattern-based dynamic or custom generation
            base_cpu = self.custom_cpu
            base_gpu = self.custom_gpu

            if self.pattern == "DYNAMIC_WAVE":
                # Multi-harmonic smooth sine waves + periodic micro-bursts
                harmonic1 = 12.0 * math.sin(t * 0.09 + rack_index * 1.3)
                harmonic2 = 6.0 * math.cos(t * 0.22 + rack_index * 0.8)
                
                # Micro-bursts every 20-25 seconds (e.g. distributed cron jobs or web traffic surges)
                burst_window = int(t) % 22
                burst_cpu = 16.0 if burst_window < 4 else 0.0
                burst_gpu = 20.0 if burst_window < 4 else 0.0

                jitter = random.gauss(0.0, 1.2)
                cpu = base_cpu + harmonic1 + harmonic2 + burst_cpu + jitter
                gpu = base_gpu + (harmonic1 * 1.2) + burst_gpu + jitter

            elif self.pattern == "BATCH_SPIKES":
                # Periodic heavy batch jobs: 12 seconds idle/moderate, 6 seconds intensive
                cycle = int(t) % 18
                is_batch = cycle < 6
                if is_batch:
                    cpu = 85.0 + random.uniform(-3.0, 3.0)
                    gpu = 90.0 + random.uniform(-2.5, 2.5)
                else:
                    cpu = 28.0 + random.uniform(-2.0, 2.0)
                    gpu = 22.0 + random.uniform(-2.0, 2.0)

            elif self.pattern == "AI_EPOCHS":
                # AI training iterations: 20s backprop, 6s validation
                cycle = int(t) % 26
                if cycle < 20:
                    cpu = 68.0 + random.uniform(-2.5, 2.5)
                    gpu = 95.0 + random.uniform(-2.0, 2.0)
                else:
                    cpu = 40.0 + random.uniform(-2.0, 2.0)
                    gpu = 35.0 + random.uniform(-2.0, 2.0)

            elif self.pattern == "CHAOS":
                # Random cluster swings across racks
                cpu = base_cpu + random.uniform(-25.0, 25.0)
                gpu = base_gpu + random.uniform(-28.0, 28.0)

            else: # CONSTANT
                cpu = base_cpu + random.gauss(0.0, 0.6)
                gpu = base_gpu + random.gauss(0.0, 0.6)

        # Rack individuality offset so racks don't mirror each other exactly
        if rack_index == 1:
            cpu += 3.5
            gpu += 4.5
        elif rack_index == 2:
            cpu -= 2.5
            gpu -= 3.0
        elif rack_index == 3:
            cpu += 1.5
            gpu += 2.0

        return {
            "cpu_util": round(max(5.0, min(100.0, cpu)), 1),
            "gpu_util": round(max(5.0, min(100.0, gpu)), 1)
        }
