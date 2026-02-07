import time
import logging
import signal
import sys
import psutil
import GPUtil

AGENT_NAME = "GridX Provider Agent"
AGENT_VERSION = "0.1"

HEARTBEAT_INTERVAL_SECONDS = 5

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def get_cpu_info():
    total_cores = psutil.cpu_count(logical=True)
    cpu_usage_percent = psutil.cpu_percent(interval=1)

    return {
        "total_cores": total_cores,
        "cpu_usage_percent": cpu_usage_percent
    }
    
def get_memory_info():
    memory = psutil.virtual_memory()

    return {
        "total_memory_gb": round(memory.total / (1024**3), 2),
        "available_memory_gb": round(memory.available / (1024**3), 2),
        "memory_usage_percent": memory.percent
    }
    
def get_gpu_info():
    
    try:
        import pynvml
        pynvml.nvmlInit()

        gpus = []
        device_count = pynvml.nvmlDeviceGetCount()

        for i in range(device_count):
            handle = pynvml.nvmlDeviceGetHandleByIndex(i)
            mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
            name = pynvml.nvmlDeviceGetName(handle)

            gpus.append({
                "gpu_index": i,
                "name": name.decode("utf-8") if isinstance(name, bytes) else name,
                "vendor": "NVIDIA",
                "total_memory_gb": round(mem.total / (1024 ** 3), 2),
                "free_memory_gb": round(mem.free / (1024 ** 3), 2),
                "used_memory_gb": round(mem.used / (1024 ** 3), 2),
            })

        pynvml.nvmlShutdown()
        return gpus

    except Exception:
        pass

    try:
        import GPUtil

        gpus = []
        for gpu in GPUtil.getGPUs():
            gpus.append({
                "gpu_index": gpu.id,
                "name": gpu.name,
                "vendor": gpu.vendor or "Unknown",
                "total_memory_gb": round(gpu.memoryTotal / 1024, 2),
                "free_memory_gb": round(gpu.memoryFree / 1024, 2),
                "used_memory_gb": round(gpu.memoryUsed / 1024, 2),
            })

        return gpus

    except Exception:
        pass

    return []
    
def get_network_usage():
    net1 = psutil.net_io_counters()
    time.sleep(1)
    net2 = psutil.net_io_counters()

    upload_speed = (net2.bytes_sent - net1.bytes_sent) / 1024  # KB/s
    download_speed = (net2.bytes_recv - net1.bytes_recv) / 1024  # KB/s

    return {
        "upload_kb_per_sec": round(upload_speed, 2),
        "download_kb_per_sec": round(download_speed, 2)
    }

def calculate_cpu_share(cpu_info):
    current_usage = cpu_info["cpu_usage_percent"]
    total_cores = cpu_info["total_cores"]

    if current_usage > 70:
        return 0

    max_allowed_percent = 60
    share_percent = max_allowed_percent - current_usage

    if share_percent <= 0:
        return 0

    share_cores = round((share_percent / 100) * total_cores, 2)

    return share_cores

def calculate_memory_share(memory_info):
    available = memory_info["available_memory_gb"]

    reserve_gb = 4

    if available <= reserve_gb:
        return 0

    return round(available - reserve_gb, 2)

def calculate_gpu_share(gpu_info):
    shareable_gpus = []

    for gpu in gpu_info:
        if gpu["free_memory_gb"] > 2:
            shareable_gpus.append(gpu)

    return shareable_gpus

def calculate_bandwidth_share(network_info):
    current_upload = network_info["upload_kb_per_sec"]
    current_download = network_info["download_kb_per_sec"]

    max_upload_limit = 5000  # Assume 5MB/s safe upper limit
    max_download_limit = 5000

    upload_available = max_upload_limit - current_upload
    download_available = max_download_limit - current_download

    if upload_available < 0:
        upload_available = 0

    if download_available < 0:
        download_available = 0

    return {
        "upload_kb_per_sec": round(upload_available * 0.5, 2),
        "download_kb_per_sec": round(download_available * 0.5, 2)
    }

def shutdown_handler(signum, frame):
    logging.info("Shutting down provider agent...")
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)

def main():
    logging.info(f"Starting {AGENT_NAME} v{AGENT_VERSION}")
    logging.info("Provider agent is running")

    while True:
        cpu = get_cpu_info()
        memory = get_memory_info()
        gpu = get_gpu_info()
        network = get_network_usage()

        offer = {
            "cpu_cores": calculate_cpu_share(cpu),
            "memory_gb": calculate_memory_share(memory),
            "gpu": calculate_gpu_share(gpu),
            "bandwidth": calculate_bandwidth_share(network)
        }
        
        logging.info(f"Offerable Resources: {offer}")

        time.sleep(HEARTBEAT_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
