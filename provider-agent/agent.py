import time
import logging
import signal
import sys

AGENT_NAME = "GridX Provider Agent"
AGENT_VERSION = "0.1"

HEARTBEAT_INTERVAL_SECONDS = 5

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def shutdown_handler(signum, frame):
    logging.info("Shutting down provider agent...")
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)

def main():
    logging.info(f"Starting {AGENT_NAME} v{AGENT_VERSION}")
    logging.info("Provider agent is running")

    while True:
        logging.debug("Agent alive")
        time.sleep(HEARTBEAT_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
