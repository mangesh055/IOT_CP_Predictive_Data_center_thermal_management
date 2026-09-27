import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

MODEL_OUTPUT_PATH = os.path.join(MODEL_DIR, "rf_thermal_model.pkl")
METRICS_OUTPUT_PATH = os.path.join(MODEL_DIR, "model_metrics.json")
DATASET_OUTPUT_PATH = os.path.join(DATA_DIR, "synthetic_datacenter_telemetry.csv")

def generate_synthetic_training_data(n_samples: int = 4000) -> pd.DataFrame:
    """
    Generate realistic multi-variable synthetic data center telemetry
    reflecting heat generation, cooling efficiency, thermal lag, and dynamic workloads.
    """
    np.random.seed(42)
    
    # 1. Primary operating conditions
    cpu = np.random.uniform(10.0, 95.0, n_samples)
    gpu = np.random.uniform(10.0, 98.0, n_samples)
    ambient_temp = np.random.normal(22.0, 1.2, n_samples)
    fan_speed = np.random.uniform(40.0, 100.0, n_samples)
    airflow = np.random.uniform(80.0, 100.0, n_samples)
    humidity = 48.0 - (cpu * 0.05) + np.random.normal(0, 1.5, n_samples)
    
    # 2. Power consumption
    power = 160.0 + (cpu * 2.4) + (gpu * 3.6) + np.random.normal(0, 5.0, n_samples)

    # 3. Simulate continuous temperature sequence with thermal lag
    temp = np.zeros(n_samples)
    temp[0] = 23.5
    for i in range(1, n_samples):
        effective_cooling = (fan_speed[i] / 100.0) * 1100.0 * (temp[i-1] - 18.5) / 8.0
        q_net = (power[i] - effective_cooling + 12.0 * (ambient_temp[i] - temp[i-1])) / 420.0
        temp[i] = temp[i-1] + q_net * 0.8 + np.random.normal(0, 0.04)
        temp[i] = np.clip(temp[i], 19.0, 38.0)

    # 4. Lag and slope features
    df = pd.DataFrame({
        "temperature": temp,
        "temperature_lag_1": np.roll(temp, 1),
        "temperature_lag_3": np.roll(temp, 3),
        "temperature_lag_5": np.roll(temp, 5),
        "humidity": np.clip(humidity, 30.0, 65.0),
        "cpu_usage": cpu,
        "gpu_usage": gpu,
        "power": power,
        "fan_speed": fan_speed,
        "airflow": airflow,
        "ambient_temp": ambient_temp,
    })
    
    # Slice off edge wrap-around from rolling
    df = df.iloc[10:].reset_index(drop=True)
    df["temperature_slope"] = (df["temperature"] - df["temperature_lag_5"]) / 5.0

    # 5. Future temperature targets (+5 min, +10 min, +15 min)
    # Using dynamic physical projection matching thermal response
    df["target_5m"] = df["temperature"] + (df["temperature_slope"] * 2.2) + ((df["power"] - df["fan_speed"] * 10.0) * 0.003) + np.random.normal(0, 0.08, len(df))
    df["target_10m"] = df["temperature"] + (df["temperature_slope"] * 3.8) + ((df["power"] - df["fan_speed"] * 10.0) * 0.005) + np.random.normal(0, 0.12, len(df))
    df["target_15m"] = df["temperature"] + (df["temperature_slope"] * 4.9) + ((df["power"] - df["fan_speed"] * 10.0) * 0.007) + np.random.normal(0, 0.16, len(df))

    return df

def train(dataset_path: str = None):
    print("=" * 60)
    print("AI-BASED THERMAL PREDICTION MODEL TRAINING")
    print("=" * 60)

    if dataset_path and os.path.exists(dataset_path):
        print(f"Loading custom dataset from: {dataset_path}")
        df = pd.read_csv(dataset_path)
    else:
        print("Generating synthetic data center telemetry dataset...")
        df = generate_synthetic_training_data(n_samples=5000)
        df.to_csv(DATASET_OUTPUT_PATH, index=False)
        print(f"Saved synthetic training dataset to: {DATASET_OUTPUT_PATH}")

    feature_cols = [
        "temperature", "temperature_lag_1", "temperature_lag_3", "temperature_lag_5",
        "temperature_slope", "humidity", "cpu_usage", "gpu_usage",
        "power", "fan_speed", "airflow", "ambient_temp"
    ]
    target_cols = ["target_5m", "target_10m", "target_15m"]

    X = df[feature_cols]
    y = df[target_cols]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training RandomForestRegressor on {len(X_train)} samples...")
    rf = RandomForestRegressor(
        n_estimators=60,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)

    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(root_mean_squared_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))

    print("-" * 60)
    print("MODEL EVALUATION RESULTS:")
    print(f"  Mean Absolute Error (MAE) : {mae:.4f} °C")
    print(f"  Root Mean Squared Error   : {rmse:.4f} °C")
    print(f"  Coefficient of Det. (R²)  : {r2:.4f}")
    print("-" * 60)

    importances = {col: round(float(imp), 4) for col, imp in zip(feature_cols, rf.feature_importances_)}
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    model_payload = {
        "model": rf,
        "feature_names": feature_cols,
        "feature_importances": sorted_importances,
        "metrics": {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "algorithm": "RandomForestRegressor (scikit-learn)"
        }
    }

    with open(MODEL_OUTPUT_PATH, "wb") as f:
        pickle.dump(model_payload, f)
    print(f"Saved trained model artifact to: {MODEL_OUTPUT_PATH}")

    with open(METRICS_OUTPUT_PATH, "w") as f:
        json.dump(model_payload["metrics"], f, indent=2)
    print(f"Saved model metrics to: {METRICS_OUTPUT_PATH}")

    return model_payload["metrics"]

if __name__ == "__main__":
    train()
