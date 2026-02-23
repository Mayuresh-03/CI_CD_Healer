# # app/routes/agent_routes.py

# from fastapi import APIRouter, HTTPException
# from app.controllers.agent_controller import run_agent_controller
# from app.db.schemas import RunRequest

# router = APIRouter()

# @router.post("/run-agent")
# async def run_agent(payload: RunRequest):
#     try:
#         result = await run_agent_controller(payload.model_dump())
#         return {
#             "success": True,
#             "data": result
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Run
from app.db.schemas import RunRequest
from app.controllers.agent_controller import (
    handle_scan_logic, 
    handle_fix_logic, 
    get_fix_progress_logic,
    handle_orchestrator_logic
)

router = APIRouter(tags=["Healer Agent"])

# @router.post("/scan-repo")
# async def scan_repo_endpoint(payload: RunRequest):
#     """Step 1: HTTP layer for scanning."""
#     result = await handle_scan_logic(payload)
#     if not result["success"]:
#         raise HTTPException(status_code=500, detail=result.get("error"))
#     return result

# @router.post("/fix-all")
# async def fix_all_endpoint(team_name: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
#     """Step 2: HTTP layer for triggering background healing."""
#     result = await handle_fix_logic(team_name, background_tasks, db)
#     if not result["success"]:
#         raise HTTPException(status_code=404, detail=result.get("error"))
#     return result

@router.get("/fix-progress/{run_id}")
async def fix_progress_endpoint(run_id: int, db: Session = Depends(get_db)):
    """Step 3: HTTP layer for progress tracking."""
    result = await get_fix_progress_logic(run_id, db)
    if not result["success"]:
        raise HTTPException(status_code=404, detail="Run not found")
    return result

# app/routes/agent_routes.py

@router.post("/run-orchestrator")
async def run_orchestrator_endpoint(payload: RunRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    ONE-CLICK HEAL: Clones, Scans, and Heals in one continuous background flow.
    """
    # Create the initial DB entry so the user gets a Run ID immediately
    new_run = Run(
        repo_url=payload.repo_url,
        branch="INITIALIZING",
        status="IN_PROGRESS",
        iterations=0,
        user_id=1,
        time_taken=0.0
    )
    db.add(new_run)
    db.commit()
    db.refresh(new_run)

    # Hand off the entire lifecycle to the Orchestrator
    background_tasks.add_task(handle_orchestrator_logic, payload=payload, run_id=new_run.id, _db_from_route=db)

    return {
        "success": True,
        "run_id": new_run.id,
        "message": "Orchestrator started. Use /fix-progress to track live agent actions."
    }