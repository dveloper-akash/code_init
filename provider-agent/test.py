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
import time
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score


def log(message):
    print(message, flush=True)


def main():
    log("🚀 Starting ML job...")

    # Step 1: Load dataset
    log("📦 Loading dataset...")
    data = load_iris()
    X = data.data
    y = data.target
    time.sleep(1)

    # Step 2: Split dataset
    log("✂️ Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    time.sleep(1)

    # Step 3: Train model
    log("🧠 Training model...")
    model = LogisticRegression(max_iter=200)
    model.fit(X_train, y_train)
    time.sleep(1)

    # Step 4: Evaluate
    log("📊 Evaluating model...")
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)

    log(f"✅ Accuracy: {accuracy:.4f}")
    log("🎉 ML job completed successfully!")


if __name__ == "__main__":
    main()
""",
            "dependencies": "scikit-learn==1.8.0"
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
