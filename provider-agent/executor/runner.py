import os
import shutil
import subprocess
import uuid
import threading
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
JOBS_DIR = BASE_DIR / "jobs"

JOBS_DIR.mkdir(exist_ok=True)


def get_image_and_filename(language: str):
    if language == "python":
        return "thengax/runtime-python", "code.py"
    elif language == "node":
        return "thengax/runtime-node", "code.js"
    elif language == "go":
        return "thengax/runtime-go", "code.go"
    else:
        raise ValueError("Unsupported language")


def get_execution_command(language: str):
    if language == "python":
        return """
        if [ -f requirements.txt ]; then
            pip install --user -r requirements.txt;
        fi;
        python code.py
        """

    elif language == "node":
        return """
        if [ -f package.json ]; then
            npm install;
        fi;
        node code.js
        """

    elif language == "go":
        return """
        if [ -f go.mod ]; then
            go mod tidy;
        fi;
        go run code.go
        """


def run_job(
    language: str,
    code: str,
    dependency_file: str = None,
    cpu_limit: float = 1.0,
    memory_limit: str = "1g",
    gpu_limit: str = "0",
    timeout_seconds: int = 10
):
    job_id = str(uuid.uuid4())
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir()

    try:
        image, filename = get_image_and_filename(language)

        code_path = job_dir / filename
        code_path.write_text(code)

        if dependency_file:
            if language == "python":
                (job_dir / "requirements.txt").write_text(dependency_file)
            elif language == "node":
                (job_dir / "package.json").write_text(dependency_file)
            elif language == "go":
                (job_dir / "go.mod").write_text(dependency_file)

        docker_command = [
            "docker", "run",
            "--rm",
            "--name", f"job-{job_id}",
            f"--cpus={cpu_limit}",
            f"--memory={memory_limit}",
            "--pids-limit=100",
            "--network=none",
            "-v", f"{job_dir}:/workspace",
            "-w", "/workspace",
        ]

        if gpu_limit != "0":
            docker_command.extend(["--gpus", gpu_limit])

        docker_command.extend([
            image,
            "bash",
            "-c",
            get_execution_command(language)
        ])

        process = subprocess.Popen(
            docker_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )

        output_lines = []

        def stream_output():
            for line in process.stdout:
                print(line, end="")
                output_lines.append(line)

        thread = threading.Thread(target=stream_output)
        thread.start()

        try:
            process.wait(timeout=timeout_seconds)
        except subprocess.TimeoutExpired:
            subprocess.run(["docker", "kill", f"job-{job_id}"])
            return "Execution timed out."

        thread.join()

        return "".join(output_lines)

    finally:
        if job_dir.exists():
            shutil.rmtree(job_dir)
