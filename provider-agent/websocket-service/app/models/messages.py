from pydantic import BaseModel
from typing import Dict, Optional

#----------Node Registration-----
class RegisterMessage(BaseModel):
    type: str
    node_id: str
    cpu_cores: int
    gpu: bool
    ram_gb: int

#----------Heartbeat-----------
class HeartbeatMessage(BaseModel):
    type: str
    node_id: str

#----------Job Assignment-------
class JobAssigned(BaseModel):
      type: str = "job_assigned"
      job_id: str
      payload: Dict

# --- Job progress ---
class JobProgressMessage(BaseModel):
    type: str  # "job_progress"
    node_id: str
    job_id: str
    progress: int  # percentage 0-100

# --- Job status ---
class JobStatusMessage(BaseModel):
    type: str  # "job_status"
    node_id: str
    job_id: str
    status: str  # "started", "processing", "paused", "retrying"

# --- Job completion ---
class JobCompleteMessage(BaseModel):
    type: str  # "job_complete"
    node_id: str
    job_id: str
    result: str  # "success" or "failed"
    output: Optional[Dict] = None