import requests
import socket

SERVER_URL = "https://gridx-central.com"  # Replace with actual registry URL

def get_local_ip() -> str:
    """Return local IP of this machine."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def register_provider(node_id: str, cpu: int, gpu: bool, ram: int, ws_port: int = 9000):
    ip = get_local_ip()
    print(f"Local IP detected: {ip}")

    payload = {
        "node_id": node_id,
        "cpu_cores": cpu,
        "gpu": gpu,
        "ram_gb": ram,
        "websocket_url": f"ws://{ip}:{ws_port}"
    }

    try:
        r = requests.post(f"{SERVER_URL}/register_node", json=payload, timeout=5)
        try:
            resp_json = r.json()
        except ValueError:
            resp_json = r.text
        print(f"Registry response: {resp_json}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to register with central registry: {e}")
