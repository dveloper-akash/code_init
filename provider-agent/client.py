import asyncio
import websockets
import json

WS_URL = "ws://localhost:9000/ws"


async def send_job(ws):
    job_message = {
        "type": "job_assigned",
        "job_id": "job-123",
        "payload": {
            "language": "python",
            "code": """
print("Hello from GridX!")
for i in range(5):
    print("Count:", i)
""",
            "dependencies": None
        }
    }

    await ws.send(json.dumps(job_message))
    print("📤 Job sent")


async def listen(ws):
    while True:
        message = await ws.recv()
        data = json.loads(message)

        if data["type"] == "job_progress":
            print(f"📊 Progress: {data['progress']}%")

        elif data["type"] == "job_log":
            print("📜 Logs:")
            print(data["log"])

        elif data["type"] == "job_complete":
            print("✅ Job completed")
            break


async def main():
    async with websockets.connect(WS_URL) as ws:
        print("✅ Connected to provider")

        await send_job(ws)
        await listen(ws)


if __name__ == "__main__":
    asyncio.run(main())
