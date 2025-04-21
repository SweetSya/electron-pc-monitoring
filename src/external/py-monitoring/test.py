import clr
import os
import re
import serial
import time
from serial.tools import list_ports

# Load DLL
base_dir = os.path.dirname(os.path.abspath(__file__))
dll_path = os.path.join(base_dir, "OpenHardwareMonitorLib.dll")

if not os.path.exists(dll_path):
    raise FileNotFoundError(f"DLL not found at {dll_path}")

clr.AddReference(dll_path)
from OpenHardwareMonitor import Hardware

# Initialize OpenHardwareMonitor
computer = Hardware.Computer()
computer.CPUEnabled = True
computer.GPUEnabled = True
computer.MainboardEnabled = True
computer.RAMEnabled = True
computer.HDDEnabled = True
computer.Open()

def get_value(hw, category, name):
    for sensor in hw.Sensors:
        if sensor.SensorType.ToString().lower() == category.lower() and sensor.Name.lower() == name.lower():
            return round(sensor.Value, 2)
    for sub in hw.SubHardware:
        sub.Update()
        for sensor in sub.Sensors:
            if sensor.SensorType.ToString().lower() == category.lower() and sensor.Name.lower() == name.lower():
                return round(sensor.Value, 2)
    return None

def read_essential_data():
    data = {
        "mainboard": {}, "cpu": {}, "gpu": {}, "ram": {},
        "fans": {}, "storage": {}
    }

    for hw in computer.Hardware:
        hw.Update()
        hw_type = hw.HardwareType.ToString().lower()
        hw_name = hw.Name.strip()

        if hw_type == "mainboard":
            data["mainboard"]["name"] = hw_name

        if hw_type == "cpu":
            # Extract clean CPU model, e.g., "i3-12100F"
            short_name = hw_name.upper()
            intel_match = re.search(
                r"(I\d{1,2})[-\s]?(\d{4,5}[A-Z]?)", short_name)
            if intel_match:
                cpu_name = f"{intel_match.group(1)} {intel_match.group(2)}"
            else:
                # Try AMD Ryzen match
                amd_match = re.search(
                    r"RYZEN\s*(\d)\s*(\d{4,5}[A-Z]?)", short_name)
                if amd_match:
                    cpu_name = f"R{amd_match.group(1)} {amd_match.group(2)}"
                else:
                    cpu_name = hw_name  # fallback

            data["cpu"]["name"] = cpu_name
            data["cpu"]["load"] = get_value(hw, "Load", "cpu total")
            data["cpu"]["temp"] = get_value(hw, "Temperature", "cpu package")

        if "gpu" in hw_type:
            match = re.search(
                r"(GTX\s?\d{3,4}|RTX\s?\d{3,4}|RX\s?\d{3,4}|RADEON\s?\w*)", hw_name.upper())
            data["gpu"]["name"] = match.group(
                1).replace(" ", "") if match else hw_name
            data["gpu"]["temp"] = get_value(hw, "Temperature", "GPU Core")
            data["gpu"]["load"] = get_value(hw, "Load", "GPU Core")

        if hw_type == "ram":
            data["ram"]["load"] = get_value(hw, "Load", "Memory")
            data["ram"]["used"] = get_value(hw, "Data", "Used Memory")
            data["ram"]["available"] = get_value(
                hw, "Data", "Available Memory")

        if hw_type == "mainboard":
            all_sensors = list(hw.Sensors)
            for sub in hw.SubHardware:
                sub.Update()
                all_sensors += list(sub.Sensors)
            for sensor in all_sensors:
                if sensor.SensorType.ToString().lower() == "temperature" and sensor.Name.lower() == "cpu core":
                    data["cpu"]["temp"] = round(sensor.Value, 2)
                elif sensor.SensorType.ToString().lower() == "fan":
                    if "fan #1" in sensor.Name.lower():
                        data["fans"]["fan1"] = round(sensor.Value, 0)
                    elif "fan #2" in sensor.Name.lower():
                        data["fans"]["fan2"] = round(sensor.Value, 0)

        elif hw_type == "hdd":
            for sensor in hw.Sensors:
                if sensor.SensorType.ToString().lower() == "temperature":
                    data["storage"][hw.Name] = round(sensor.Value, 1)

    return data

def format_data_string(data):
    storage_temps = ','.join([f"{k[:10]}:{v}" for k, v in data["storage"].items()])
    return (
        f"MB={data['mainboard'].get('name','')}|"
        f"CPU={data['cpu'].get('name','')}|"
        f"CPUT={data['cpu'].get('temp','')}|"
        f"CPUL={data['cpu'].get('load','')}|"
        f"GPU={data['gpu'].get('name','')}|"
        f"GPUT={data['gpu'].get('temp','')}|"
        f"GPUL={data['gpu'].get('load','')}|"
        f"RAML={data['ram'].get('load','')}|"
        f"RAMU={data['ram'].get('used','')}|"
        f"RAMA={data['ram'].get('available','')}|"
        f"FAN1={data['fans'].get('fan1','')}|"
        f"FAN2={data['fans'].get('fan2','')}|"
        f"STOR={storage_temps}"
    )

def find_esp32_port():
    ports = list_ports.comports()
    for p in ports:
        if "USB" in p.description or "CH340" in p.description or "CP210" in p.description or "ESP32" in p.description:
            return p.device
    return None

if __name__ == "__main__":
    while True:
        data = read_essential_data()
        payload = format_data_string(data)

        port = find_esp32_port()
        if not port:
            print("ESP32 not found!")
        else:
            try:
                with serial.Serial(port, 115200, timeout=1) as ser:
                    time.sleep(1.5)
                    ser.write((payload + "\n").encode())
            except Exception as e:
                print(f"Serial Error: {e}")
        
