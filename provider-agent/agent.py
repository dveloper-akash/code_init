import time
import uuid
import os
import requests
import psutil
import GPUtil
import subprocess
import logging
import socketio
import eventlet
import eventlet.wsgi

# ---------------- CONFIG ----------------

SERVER_URL = "http://localhost:5000"
WS_PORT = 7000
HEARTBEAT_INTERVAL = 5
PROVIDER_ID_FILE = ".provider_id"

REQUIRED_IMAGES = [
    "thengax/runtime-python",
    "thengax/runtime-node",
    "thengax/runtime-go"
]

logging.basicConfig(level=logging.INFO)

# ---------------- UTIL ----------------

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

# ---------------- BACKEND COMM ----------------

def register_provider(pid):
    payload = {
        "providerId": pid,
        "address": f"ws://localhost:{WS_PORT}",
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

# ---------------- EXECUTION ----------------

def execute_code(language, code):
    if language == "python":
        proc = subprocess.run(
            ["python", "-c", code],
            capture_output=True,
            text=True,
            timeout=30
        )
        return proc.stdout, proc.stderr

    return "", "Unsupported language"

# ---------------- SOCKET SERVER ----------------

sio = socketio.Server(cors_allowed_origins="*")
app = socketio.WSGIApp(sio)

@sio.event
def connect(sid, environ):
    logging.info(f"Client connected: {sid}")

@sio.event
def disconnect(sid):
    logging.info(f"Client disconnected: {sid}")

@sio.event
def job_execute(sid, data):
    logging.info("Received job")

    code = data.get("code")
    plan = data.get("plan")
    language = plan.get("language")

    try:
        stdout, stderr = execute_code(language, code)
        sio.emit(
            "job:result",
            { "stdout": stdout, "stderr": stderr },
            to=sid
        )
    except Exception as e:
        sio.emit(
            "job:result",
            { "stdout": "", "stderr": str(e) },
            to=sid
        )

# ---------------- MAIN ----------------

def main():
    pid = get_provider_id()
    register_provider(pid)

    logging.info(f"Provider running: {pid}")

    def background_tasks():
        while True:
            send_heartbeat(pid)
            send_metrics(pid)
            time.sleep(HEARTBEAT_INTERVAL)

    eventlet.spawn(background_tasks)

    logging.info(f"WebSocket server on port {WS_PORT}")
    eventlet.wsgi.server(eventlet.listen(("", WS_PORT)), app)

if __name__ == "__main__":
    main()
