# websocket-service/app/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from app.core.state import connected_nodes
from app.models.messages import RegisterMessage, HeartbeatMessage, JobAssigned
from pydantic import BaseModel
import uvicorn
from app.core.provider_reg import register_provider
import json
import time
import asyncio

app = FastAPI()


# ---------------- WebSocket Endpoint ----------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    node_id = None

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            # --- Job progress update ---
            if data["type"] == "job_progress":
                job_id = data["job_id"]
                progress = data["progress"]  # 0-100
                if node_id in connected_nodes and job_id in connected_nodes[node_id]["jobs"]:
                    connected_nodes[node_id]["jobs"][job_id]["progress"] = progress
                    print(f"System '{node_id}' progress for {job_id}: {progress}%")

            # --- Job completion ---
            elif data["type"] == "job_complete":
                job_id = data["job_id"]
                if node_id in connected_nodes and job_id in connected_nodes[node_id]["jobs"]:
                    connected_nodes[node_id]["jobs"][job_id]["status"] = "completed"
                    connected_nodes[node_id]["jobs"][job_id]["progress"] = 100
                    print(f"System '{node_id}' completed job {job_id}")
                    # Optional: remove job from tracking
                    # del connected_nodes[node_id]["jobs"][job_id]

    except WebSocketDisconnect:
        if node_id and node_id in connected_nodes:
            del connected_nodes[node_id]
            print(f"❌ System disconnected: {node_id}")


# ---------------- Assign Jobs ----------------
async def assign_job(node_id: str, job_id: str, payload: dict):
    node = connected_nodes.get(node_id)
    if not node:
        print(f"⚠️ System {node_id} not found")
        return

    # Track job
    node["jobs"][job_id] = {
        "payload": payload,
        "status": "assigned",
        "progress": 0
    }

    ws = node["websocket"]
    job_msg = JobAssigned(type="job_assigned", job_id=job_id, payload=payload)
    await ws.send_text(job_msg.json())
    print(f"Job {job_id} assigned to {node_id}")


# ---------------- HTTP Endpoint to Assign Jobs ----------------
class JobRequest(BaseModel):
    node_id: str
    job_id: str
    payload: dict


@app.post("/assign_job")
async def assign_job_endpoint(req: JobRequest):
    if req.node_id not in connected_nodes:
        raise HTTPException(status_code=404, detail="Node not found")

    # Schedule the job asynchronously
    asyncio.create_task(assign_job(req.node_id, req.job_id, req.payload))
    return {"status": "job scheduled", "node_id": req.node_id, "job_id": req.job_id}

@app.on_event("startup")
async def startup_reg():
    NODE_ID = "node-1"
    CPU_CORES = 8
    GPU = False
    RAM_GB = 16
    WS_PORT = 9000

    # Register with central registry
    register_provider(NODE_ID, CPU_CORES, GPU, RAM_GB, WS_PORT)

    if __name__ == "__main__":
      uvicorn.run("app.main:app", host="0.0.0.0", port=9000, reload=True)
