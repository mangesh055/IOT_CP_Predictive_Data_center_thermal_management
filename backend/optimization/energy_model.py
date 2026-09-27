class EnergyModel:
    """
    Simplified yet physically grounded data center cooling energy model.
    Models:
    - Fan aerodynamic power (Fan affinity cubic law: P ~ RPM^3)
    - Computer Room Air Handler (CRAH) / Chiller heat rejection energy
    - Accumulated energy (Joules and kWh)
    Clearly labeled: 'Estimated simulated energy'.
    """
    def __init__(
        self,
        max_fan_power_watts: float = 450.0,
        base_cooling_plant_watts: float = 180.0,
        chiller_cop: float = 3.6 # Coefficient of Performance
    ):
        self.max_fan_power = max_fan_power_watts
        self.base_cooling = base_cooling_plant_watts
        self.cop = chiller_cop
        self.total_energy_joules = 0.0

    def calculate_power(self, fan_speed_pct: float, cooling_watts_removed: float = 0.0) -> dict:
        """
        Calculate instantaneous cooling power (Watts).
        """
        norm_fan = max(0.0, min(100.0, fan_speed_pct)) / 100.0
        # Aerodynamic fan power follows cubic affinity law
        fan_power = self.max_fan_power * (norm_fan ** 3)
        # Chiller compressor electrical work = Q_removed / COP
        chiller_electrical_power = (cooling_watts_removed / self.cop) if cooling_watts_removed > 0 else 0.0
        total_power = fan_power + self.base_cooling + chiller_electrical_power

        return {
            "fan_power_w": round(fan_power, 1),
            "chiller_power_w": round(chiller_electrical_power, 1),
            "base_cooling_w": round(self.base_cooling, 1),
            "total_cooling_power_w": round(total_power, 1)
        }

    def update_energy(self, cooling_power_watts: float, dt_seconds: float = 1.0) -> float:
        """Accumulate energy consumption over interval."""
        joules = cooling_power_watts * dt_seconds
        self.total_energy_joules += joules
        return round(self.total_energy_joules / 3.6e6, 4) # kWh

    def get_kwh(self) -> float:
        return round(self.total_energy_joules / 3.6e6, 4)

    def reset(self):
        self.total_energy_joules = 0.0
