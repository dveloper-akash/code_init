import time
import uuid
import os
import requests
import psutil
import GPUtil
import subprocess
import logging

SERVER_URL = "http://localhost:5000"
HEARTBEAT_INTERVAL = 5
PROVIDER_ID_FILE = ".provider_id"

logging.basicConfig(level=logging.INFO)

REQUIRED_IMAGES = [
    "thengax/runtime-python",
    "thengax/runtime-node",
    "thengax/runtime-go"
]

def check_docker():
    subprocess.run(["docker", "--version"], check=True)

def pull_images():
    for img in REQUIRED_IMAGES:
        subprocess.run(["docker", "pull", img], check=True)

def get_provider_id():
    if os.path.exists(PROVIDER_ID_FILE):
        return open(PROVIDER_ID_FILE).read().strip()

    pid = str(uuid.uuid4())
    open(PROVIDER_ID_FILE, "w").write(pid)
    return pid

def detect_languages():
    langs = []
    for img in REQUIRED_IMAGES:
        if "python" in img: langs.append("python")
        if "node" in img: langs.append("node")
        if "go" in img: langs.append("go")
    return langs

def register_provider(pid):
    payload = {
        "providerId": pid,
        "address": "ws://localhost:7000",
        "capabilities": {
            "languages": detect_languages(),
            "maxTimeout": 30
        }
    }
    requests.post(f"{SERVER_URL}/api/providers/register", json=payload)

def send_heartbeat(pid):
    requests.post(
        f"{SERVER_URL}/api/providers/heartbeat",
        json={ "providerId": pid }
    )

def send_metrics(pid):
    mem = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=1)

    gpus = GPUtil.getGPUs()
    gpu_free = gpus[0].memoryFree if gpus else 0

    metrics = {
        "freeRamMB": mem.available // (1024 * 1024),
        "availCpuCores": psutil.cpu_count() * (1 - cpu / 100),
        "gpu": len(gpus) > 0,
        "gpuFree": gpu_free
    }

    requests.post(
        f"{SERVER_URL}/api/providers/metrics",
        json={ "providerId": pid, "metrics": metrics }
    )

def main():
    check_docker()
    pull_images()

    pid = get_provider_id()
    register_provider(pid)

    logging.info(f"Provider running: {pid}")

    while True:
        send_heartbeat(pid)
        send_metrics(pid)
        time.sleep(HEARTBEAT_INTERVAL)

if __name__ == "__main__":
    main()
