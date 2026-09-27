import json
import time
from typing import Dict, Any, List, Callable
from collections import deque

class MQTTMessage:
    def __init__(self, topic: str, payload: Any, qos: int = 1, timestamp: float = None):
        self.topic = topic
        self.payload = payload if isinstance(payload, str) else json.dumps(payload)
        self.qos = qos
        self.timestamp = timestamp or time.time()

    def to_dict(self):
        return {
            "topic": self.topic,
            "payload": self.payload,
            "qos": self.qos,
            "timestamp": self.timestamp
        }

class VirtualMQTTBroker:
    """
    In-memory lightweight MQTT message broker simulation.
    Supports topic subscriptions, wildcard dispatching ('#', '+'),
    message history buffer for UI inspection, and failure injection.
    """
    def __init__(self, max_history: int = 100):
        self.subscriptions: Dict[str, List[Callable[[MQTTMessage], None]]] = {}
        self.message_history: deque = deque(maxlen=max_history)
        self.total_messages = 0
        self.is_connected = True
        self.network_latency_ms = 12.0
        self.packet_loss_rate = 0.0

    def subscribe(self, topic_filter: str, callback: Callable[[MQTTMessage], None]):
        if topic_filter not in self.subscriptions:
            self.subscriptions[topic_filter] = []
        self.subscriptions[topic_filter].append(callback)

    def publish(self, topic: str, payload: Any, qos: int = 1) -> bool:
        if not self.is_connected:
            return False # Network dropped

        msg = MQTTMessage(topic, payload, qos)
        self.total_messages += 1
        self.message_history.append(msg.to_dict())

        # Match subscriptions
        for sub_topic, callbacks in self.subscriptions.items():
            if self._topic_matches(sub_topic, topic):
                for cb in callbacks:
                    try:
                        cb(msg)
                    except Exception as e:
                        print(f"Error in MQTT callback for {topic}: {e}")
        return True

    def _topic_matches(self, sub: str, topic: str) -> bool:
        """Standard MQTT topic matching with '+' single-level and '#' multi-level wildcards."""
        if sub == "#" or sub == topic:
            return True
        sub_parts = sub.split('/')
        topic_parts = topic.split('/')

        for i, sub_part in enumerate(sub_parts):
            if sub_part == '#':
                return True
            if i >= len(topic_parts):
                return False
            if sub_part != '+' and sub_part != topic_parts[i]:
                return False
        return len(sub_parts) == len(topic_parts)

    def set_network_state(self, connected: bool):
        self.is_connected = connected

    def get_recent_messages(self, limit: int = 25) -> List[dict]:
        return list(self.message_history)[-limit:]

class VirtualESP32Node:
    """
    Simulates an ESP32 microcontroller with Wi-Fi / MQTT client on a server rack.
    Gathers local sensor readings and publishes telemetry payloads to the broker.
    """
    def __init__(self, rack_id: str, broker: VirtualMQTTBroker):
        self.rack_id = rack_id
        self.broker = broker
        self.device_id = f"esp32_{rack_id.lower()}"
        self.firmware_version = "v2.4.1-iot"
        self.wifi_rssi_dbm = -58
        self.packets_sent = 0

    def publish_telemetry(self, sensor_readings: Dict[str, Any]):
        """Publish individual and composite topics as expected in IoT architecture."""
        if not self.broker.is_connected:
            return

        rack = self.rack_id.lower()
        now = time.strftime("%H:%M:%S")

        # 1. Temperature topic
        temp_payload = {
            "node": self.device_id,
            "rack": self.rack_id,
            "temp_primary": sensor_readings["temperature"],
            "sensor_a": sensor_readings["sensor_a"],
            "sensor_b": sensor_readings["sensor_b"],
            "sensor_c": sensor_readings["sensor_c"],
            "unit": "°C",
            "time": now
        }
        self.broker.publish(f"datacenter/{rack}/temperature", temp_payload)

        # 2. Humidity topic
        hum_payload = {
            "node": self.device_id,
            "humidity": sensor_readings["humidity"],
            "unit": "%RH"
        }
        self.broker.publish(f"datacenter/{rack}/humidity", hum_payload)

        # 3. Power topic
        power_payload = {
            "node": self.device_id,
            "power_watts": sensor_readings["power"],
            "voltage_v": 230.2,
            "unit": "W"
        }
        self.broker.publish(f"datacenter/{rack}/power", power_payload)

        # 4. Workload topic
        workload_payload = {
            "node": self.device_id,
            "cpu_util": sensor_readings["cpu_usage"],
            "gpu_util": sensor_readings["gpu_usage"]
        }
        self.broker.publish(f"datacenter/{rack}/workload", workload_payload)

        self.packets_sent += 4

class IoTGateway:
    """
    Central IoT Edge Gateway running on premise.
    Subscribes to all rack telemetry, buffers readings, monitors packet loss,
    and feeds the real-time simulation pipeline.
    """
    def __init__(self, broker: VirtualMQTTBroker):
        self.broker = broker
        self.status = "ONLINE"
        self.latest_telemetry: Dict[str, Dict[str, Any]] = {}
        self.broker.subscribe("datacenter/#", self._handle_mqtt_message)

    def _handle_mqtt_message(self, message: MQTTMessage):
        parts = message.topic.split('/')
        if len(parts) >= 3 and parts[0] == "datacenter":
            rack = parts[1].upper()
            subtopic = parts[2]
            if rack not in self.latest_telemetry:
                self.latest_telemetry[rack] = {}
            try:
                data = json.loads(message.payload) if isinstance(message.payload, str) else message.payload
                self.latest_telemetry[rack][subtopic] = data
            except Exception:
                pass
