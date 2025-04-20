import subprocess
import psutil
import os
import argparse

EXE_NAME = "monitoring_module.exe"
EXE_PATH = os.path.join(os.getcwd(), "src", "external", "py-monitoring", EXE_NAME)

def is_process_running(exe_name):
    for proc in psutil.process_iter(['name']):
        if proc.info['name'] == exe_name:
            return True
    return False

def run_exe(path_to_exe):
    # print(f"Launching: {path_to_exe}")
    subprocess.Popen([path_to_exe], shell=False)

def kill_exe(exe_name):
    killed = False
    for proc in psutil.process_iter(['pid', 'name']):
        if proc.info['name'] == exe_name:
            # print(f"Killing process: {exe_name} (PID: {proc.info['pid']})")
            psutil.Process(proc.info['pid']).terminate()
            killed = True
    # if not killed:
    #     # print(f"No process named {exe_name} found running.")

def main():
    parser = argparse.ArgumentParser(description="Control monitoring_module.exe")
    parser.add_argument("--state", required=True, help="Use 'true' to launch, 'false' to kill the process.")
    args = parser.parse_args()

    state = args.state.lower()

    if state == "true":
        if is_process_running(EXE_NAME):
            print("skipping")
        else:
            run_exe(EXE_PATH)
            print('launched')

    elif state == "false":
        kill_exe(EXE_NAME)
        print('killed')

    else:
        print("Error: Invalid --state value. Use 'true' or 'false'.")

if __name__ == "__main__":
    main()
