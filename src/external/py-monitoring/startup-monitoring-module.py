import os
import getpass
import subprocess
import argparse

TASK_NAME = "StartupMonitoringModuleSya19"
EXE_NAME = "monitoring_module.exe"
EXE_PATH = os.path.join(os.getcwd(), "src", "external", "py-monitoring", EXE_NAME)

def task_exists():
    result = subprocess.run(f'schtasks /Query /TN {TASK_NAME}', shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return result.returncode == 0

def create_task():
    if task_exists():
        print(f"⚠️ Task '{TASK_NAME}' already exists.")
        return
    current_user = getpass.getuser()
    cmd = [
        "schtasks",
        "/Create",
        "/TN", TASK_NAME,
        "/TR", f'"{EXE_PATH}"',
        "/SC", "ONLOGON",
        "/RL", "HIGHEST",
        "/F",
        "/RU", current_user
    ]
    print("Creating scheduled task...")
    subprocess.run(" ".join(cmd), shell=True)
    print(f"✅ Scheduled task '{TASK_NAME}' created to run {EXE_PATH} at login with admin rights.")

def delete_task():
    if not task_exists():
        print(f"⚠️ Task '{TASK_NAME}' does not exist.")
        return
    subprocess.run(f'schtasks /Delete /TN {TASK_NAME} /F', shell=True)
    print(f"❌ Deleted task '{TASK_NAME}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enable or disable monitoring module on startup with admin rights.")
    parser.add_argument('--state', required=True, help="Use 'true' to enable, 'false' to disable.")

    args = parser.parse_args()
    state_value = args.state.lower()

    if state_value == "true":
        create_task()
    elif state_value == "false":
        delete_task()
    else:
        print("❌ Invalid value for --state. Use 'true' or 'false'.")
