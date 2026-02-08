from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from executor.runner import run_job
import asyncio
import json
import threading

app = FastAPI()

connected_nodes = {}
NODE_ID = "node-1"


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()

    connected_nodes[NODE_ID] = {
        "websocket": ws,
        "jobs": {}
    }

    print(f"✅ WebSocket connected for {NODE_ID}")

    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            # -------- JOB MESSAGE --------
            if data["type"] == "job_assigned":
                job_id = data["job_id"]
                payload = data["payload"]

                language = payload["language"]
                code = payload["code"]
                dependencies = payload.get("dependencies")

                asyncio.create_task(
                    execute_and_stream(
                        ws,
                        job_id,
                        language,
                        code,
                        dependencies
                    )
                )

    except WebSocketDisconnect:
        print("❌ WebSocket disconnected")
        connected_nodes.pop(NODE_ID, None)


# ---------------- EXECUTION + STREAMING ----------------

async def execute_and_stream(ws, job_id, language, code, dependencies):

    loop = asyncio.get_event_loop()

    def run():
        return run_job(
            language=language,
            code=code,
            dependency_file=dependencies,
            cpu_limit=1.0,
            memory_limit="1g",
            gpu_limit="0",
            timeout_seconds=20
        )

    # Send progress start
    await ws.send_text(json.dumps({
        "type": "job_progress",
        "job_id": job_id,
        "progress": 0
    }))

    # Run blocking Docker in thread
    output = await loop.run_in_executor(None, run)

    # Send logs
    await ws.send_text(json.dumps({
        "type": "job_log",
        "job_id": job_id,
        "log": output
    }))

    # Send complete
    await ws.send_text(json.dumps({
        "type": "job_complete",
        "job_id": job_id
    }))
