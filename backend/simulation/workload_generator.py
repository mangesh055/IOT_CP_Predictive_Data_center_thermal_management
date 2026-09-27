import random
from typing import Dict, Any

class WorkloadGenerator:
    """
    Simulates dynamic computational workloads across multiple server racks.
    Supports normal baseline, low load, heavy enterprise load, high-density AI/GPU training,
    sudden workload spikes, and customized overrides.
    """
    def __init__(self):
        self.scenario = "NORMAL"
        self.spike_progress = 0 # 0 to 5
        self.custom_cpu = 45.0
        self.custom_gpu = 40.0

    def set_scenario(self, scenario_name: str, custom_cpu: float = None, custom_gpu: float = None):
        self.scenario = scenario_name.upper()
        if custom_cpu is not None:
            self.custom_cpu = max(0.0, min(100.0, custom_cpu))
        if custom_gpu is not None:
            self.custom_gpu = max(0.0, min(100.0, custom_gpu))
        self.spike_progress = 0

    def get_workload_for_rack(self, rack_index: int, tick: int) -> Dict[str, float]:
        """
        Generate CPU and GPU utilization percentages for the given rack.
        Slight natural phase difference between racks so they don't look completely identical.
        """
        phase = rack_index * 0.7
        jitter = random.gauss(0.0, 1.2)

        if self.scenario == "LOW_LOAD":
            cpu = 20.0 + random.uniform(-2.0, 2.0)
            gpu = 15.0 + random.uniform(-2.0, 2.0)

        elif self.scenario == "HIGH_LOAD":
            cpu = 80.0 + random.uniform(-3.0, 3.0)
            gpu = 75.0 + random.uniform(-3.0, 3.0)

        elif self.scenario == "AI_WORKLOAD":
            # Very heavy GPU tensor training
            cpu = 70.0 + random.uniform(-3.0, 3.0)
            gpu = 92.0 + random.uniform(-2.0, 2.5)

        elif self.scenario == "SUDDEN_SPIKE":
            # Ramp-up: 40 -> 45 -> 55 -> 70 -> 85 (CPU)
            #          30 -> 45 -> 65 -> 85 -> 95 (GPU)
            cpu_steps = [40.0, 48.0, 58.0, 72.0, 86.0, 90.0]
            gpu_steps = [30.0, 48.0, 68.0, 86.0, 96.0, 98.0]
            idx = min(self.spike_progress, len(cpu_steps) - 1)
            cpu = cpu_steps[idx] + random.uniform(-1.0, 1.0)
            gpu = gpu_steps[idx] + random.uniform(-1.0, 1.0)
            # Advance spike progress
            if rack_index == 3: # advance once per tick cycle
                self.spike_progress = min(len(cpu_steps) - 1, self.spike_progress + 1)

        elif self.scenario == "CUSTOM":
            cpu = self.custom_cpu + jitter
            gpu = self.custom_gpu + jitter

        elif self.scenario in ["SENSOR_FAILURE", "NETWORK_FAILURE", "ML_FAILURE", "COOLING_FAILURE"]:
            # Run at normal/medium load during failure scenarios unless specified
            cpu = 45.0 + random.uniform(-2.0, 2.0)
            gpu = 42.0 + random.uniform(-2.0, 2.0)

        else: # NORMAL
            cpu = 40.0 + random.uniform(-2.5, 2.5)
            gpu = 35.0 + random.uniform(-2.5, 2.5)

        # Rack specific variance: Rack 2 is slightly busier in default
        if rack_index == 1:
            cpu += 3.0
            gpu += 4.0
        elif rack_index == 2:
            cpu -= 2.0
            gpu -= 3.0

        return {
            "cpu_util": round(max(5.0, min(100.0, cpu)), 1),
            "gpu_util": round(max(5.0, min(100.0, gpu)), 1)
        }
