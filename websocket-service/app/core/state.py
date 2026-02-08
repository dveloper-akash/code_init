import time
from collections import deque

# Stores connected nodes: node_id -> { websocket, resources, last_seen }
connected_nodes = {}

# Queue for jobs waiting to be assigned
job_queue = deque()
