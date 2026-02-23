# # app/services/github_service.py 
# # Member 2 — System + DevOps + Execution 
# # Handles: repo cloning, branch creation, commit & push 
 
# import os 
# import re 
# import sys 
# import stat 
# import shutil 
# import logging 
# import tempfile 
# from git import Repo, GitCommandError 
 
# logger = logging.getLogger(__name__) 
 
# # Use OS-appropriate temp directory (fixes WinError 5 on Windows) 
# CLONE_BASE = os.path.join(tempfile.gettempdir(), "agent_repos") 
 
 
# def _force_remove(path: str): 
#     """ 
#     Force-delete a directory on any OS. 
#     On Windows, git sets files to read-only which causes WinError 5. 
#     This handler removes read-only flag before deleting. 
#     """ 
#     def handle_readonly(func, fpath, excinfo): 
#         try: 
#             os.chmod(fpath, stat.S_IWRITE) 
#             func(fpath) 
#         except Exception: 
#             pass 
#     if os.path.exists(path): 
#         shutil.rmtree(path, onerror=handle_readonly) 
 
 
# def _sanitize_for_branch(text: str) -> str: 
#     """ 
#     Convert any string to UPPERCASE_WITH_UNDERSCORES. 
#     Strips all special chars except underscores. 
#     Required by hackathon spec: TEAM_NAME_LEADER_NAME_AI_Fix 
#     """ 
#     text = text.upper().strip() 
#     text = re.sub(r'\s+', '_', text)           # spaces → underscores 
#     text = re.sub(r'[^A-Z0-9_]', '', text)     # strip special chars 
#     text = re.sub(r'_+', '_', text)            # collapse multiple underscores 
#     text = text.strip('_')                      # remove leading/trailing underscores 
#     return text 
 
 
# def clone_repo(repo_url: str) -> str: 
#     """ 
#     Clone the given GitHub repository to /tmp/agent_repos/<repo_name>. 
#     If already exists, deletes and re-clones for a clean state. 
 
#     Returns: 
#         str: Local path to the cloned repository. 
 
#     Raises: 
#         GitCommandError: If cloning fails (bad URL, auth issue, etc.) 
#     """ 
#     repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "") 
#     local_path = os.path.join(CLONE_BASE, repo_name) 
 
#     # Clean slate — force remove even if git locked files (Windows fix) 
#     _force_remove(local_path) 
 
#     os.makedirs(CLONE_BASE, exist_ok=True) 
 
#     logger.info(f"[CLONE] Cloning {repo_url} → {local_path}") 
#     Repo.clone_from(repo_url, local_path) 
#     logger.info(f"[CLONE] Done.") 
 
#     return local_path 
 
 
# def create_branch(repo_path: str, team_name: str, leader_name: str) -> str: 
#     """ 
#     Create a new branch from HEAD with the EXACT required format: 
#         TEAM_NAME_LEADER_NAME_AI_Fix  (all uppercase, underscores, no special chars) 
 
#     DISQUALIFICATION RISK: Wrong format → immediate DQ. 
#     This function enforces the format strictly. 
 
#     Returns: 
#         str: The created branch name. 
 
#     Raises: 
#         GitCommandError: If branch already exists or repo is invalid. 
#     """ 
#     team_sanitized = _sanitize_for_branch(team_name) 
#     leader_sanitized = _sanitize_for_branch(leader_name) 
 
#     # CRITICAL: Exact format as per hackathon spec 
#     branch_name = f"{team_sanitized}_{leader_sanitized}_AI_Fix" 
 
#     repo = Repo(repo_path) 
 
#     # Guard: never allow pushing to main/master 
#     current = repo.active_branch.name 
#     if current in ("main", "master"): 
#         repo.git.checkout('-b', branch_name) 
#         logger.info(f"[BRANCH] Created branch: {branch_name}") 
#     else: 
#         # Already on a non-main branch (shouldn't happen on fresh clone, but be safe) 
#         repo.git.checkout('-b', branch_name) 
#         logger.info(f"[BRANCH] Created branch: {branch_name}") 
 
#     return branch_name 
 
 
# def commit_and_push( 
#     repo_path: str, 
#     branch_name: str, 
#     commit_message: str, 
#     github_token: str, 
#     repo_url: str 
# ) -> dict: 
#     """ 
#     Stage all changes, commit with mandatory [AI-AGENT] prefix, and push to remote. 
 
#     DISQUALIFICATION RISKS HANDLED: 
#       1. Commits without [AI-AGENT] prefix → enforced here, impossible to bypass 
#       2. Pushing to main → guarded, only pushes to branch_name 
#       3. Wrong branch name → branch_name comes from create_branch(), already validated 
 
#     Args: 
#         repo_path:      Local path to cloned repo 
#         branch_name:    Branch to push to (must be from create_branch()) 
#         commit_message: Short description of the fix (NO prefix needed, added here) 
#         github_token:   GitHub Personal Access Token for auth 
#         repo_url:       Original HTTPS repo URL (token will be injected) 
 
#     Returns: 
#         dict with commit sha, branch, message, success flag 
#     """ 
#     repo = Repo(repo_path) 
 
#     # Safety guard: NEVER push to main/master 
#     if branch_name.lower() in ("main", "master"): 
#         raise ValueError( 
#             f"CRITICAL: Refusing to push to protected branch '{branch_name}'. " 
#             "Use create_branch() to get a valid AI_Fix branch." 
#         ) 
 
#     # Check if there's anything to commit 
#     if not repo.is_dirty(untracked_files=True): 
#         logger.info("[COMMIT] No changes to commit.") 
#         return { 
#             "success": False, 
#             "reason": "no_changes", 
#             "branch": branch_name 
#         } 
 
#     # Stage all changes (modified + new files) 
#     repo.git.add(A=True) 
 
#     # CRITICAL: [AI-AGENT] prefix is MANDATORY — disqualification if missing 
#     full_message = f"[AI-AGENT] {commit_message}" 
 
#     commit = repo.index.commit(full_message) 
#     logger.info(f"[COMMIT] {full_message} → sha: {commit.hexsha[:8]}") 
 
#     # Inject token into HTTPS URL for authentication 
#     # Transforms: https://github.com/user/repo 
#     #         to: https://<token>@github.com/user/repo 
#     clean_url = repo_url.replace("https://", "").replace("http://", "") 
#     auth_url = f"https://{github_token}@{clean_url}" 
 
#     try: 
#         origin = repo.remote(name='origin') 
#         origin.set_url(auth_url) 
 
#         # Push ONLY to the AI_Fix branch — never to main 
#         push_result = origin.push(refspec=f"refs/heads/{branch_name}:refs/heads/{branch_name}") 
 
#         logger.info(f"[PUSH] Pushed to remote branch: {branch_name}") 
 
#         return { 
#             "success": True, 
#             "branch": branch_name, 
#             "commit_sha": commit.hexsha, 
#             "commit_message": full_message, 
#             "push_summary": str(push_result[0].summary) if push_result else "ok" 
#         } 
 
#     except GitCommandError as e: 
#         logger.error(f"[PUSH] Failed: {e}") 
#         return { 
#             "success": False, 
#             "reason": str(e), 
#             "branch": branch_name, 
#             "commit_sha": commit.hexsha, 
#             "commit_message": full_message 
#         } 
#     finally: 
#         # Always clean up token from remote URL after use (security) 
#         try: 
#             origin.set_url(repo_url) 
#         except Exception: 
#             pass 
 
 
# def get_repo_info(repo_path: str) -> dict: 
#     """ 
#     Extract basic repo metadata for dashboard display. 
 
#     Returns: 
#         dict with current branch, commit count, remote URL 
#     """ 
#     repo = Repo(repo_path) 
#     return { 
#         "current_branch": repo.active_branch.name, 
#         "commit_count": len(list(repo.iter_commits())), 
#         "remote_url": repo.remotes.origin.url if repo.remotes else None, 
#         "is_dirty": repo.is_dirty(untracked_files=True) 
#     }

# app/services/github_service.py
# Member 2 — System + DevOps + Execution
# Handles: repo cloning, branch creation, commit & push, results.json

import os
import re
import sys
import stat
import json
import shutil
import logging
import tempfile
from datetime import datetime
from git import Repo, GitCommandError

logger = logging.getLogger(__name__)

# Use OS-appropriate temp directory (fixes WinError 5 on Windows)
CLONE_BASE = os.path.join(tempfile.gettempdir(), "agent_repos")


def _force_remove(path: str):
    """
    Force-delete a directory on any OS.
    On Windows, git sets files to read-only which causes WinError 5.
    This handler removes read-only flag before deleting.
    """
    def handle_readonly(func, fpath, excinfo):
        try:
            os.chmod(fpath, stat.S_IWRITE)
            func(fpath)
        except Exception:
            pass
    if os.path.exists(path):
        shutil.rmtree(path, onerror=handle_readonly)


def _sanitize_for_branch(text: str) -> str:
    """
    Convert any string to UPPERCASE_WITH_UNDERSCORES.
    Strips all special chars except underscores.
    Required by hackathon spec: TEAM_NAME_LEADER_NAME_AI_Fix
    """
    text = text.upper().strip()
    text = re.sub(r'\s+', '_', text)           # spaces → underscores
    text = re.sub(r'[^A-Z0-9_]', '', text)     # strip special chars
    text = re.sub(r'_+', '_', text)            # collapse multiple underscores
    text = text.strip('_')                      # remove leading/trailing underscores
    return text
    
def clone_repo(repo_url: str) -> str:
    """
    Clone the given GitHub repository to temp/agent_repos/<repo_name>.
    If already exists, force-deletes and re-clones for a clean state.

    Returns:
        str: Local path to the cloned repository.
    """
    # Define a consistent path for the repo
    repo_name = repo_url.split("/")[-1].replace(".git", "")
    local_path = f"/tmp/agent_repos/{repo_name}"

    # 🚨 THE RE-CLONE FIX: Delete the old folder if it exists
    if os.path.exists(local_path):
        print(f"[GIT] Cleaning up existing directory: {local_path}")
        shutil.rmtree(local_path)

    print(f"[GIT] Cloning fresh repository from {repo_url}...")
    Repo.clone_from(repo_url, local_path)
    
    return local_path


def create_branch(repo_path: str, team_name: str, leader_name: str) -> str:
    """
    Create a new branch with EXACT required format:
        TEAM_NAME_LEADER_NAME_AI_Fix  (all uppercase, underscores only)

    DISQUALIFICATION RISK: Wrong format = immediate DQ.

    Returns:
        str: The created branch name.
    """
    team_sanitized   = _sanitize_for_branch(team_name)
    leader_sanitized = _sanitize_for_branch(leader_name)

    # CRITICAL: Exact format as per hackathon spec
    branch_name = f"{team_sanitized}_{leader_sanitized}_AI_Fix"

    repo = Repo(repo_path)
    repo.git.checkout('-b', branch_name)
    logger.info(f"[BRANCH] Created branch: {branch_name}")

    return branch_name


def commit_and_push(repo_path, branch_name, commit_message, github_token, repo_url):
    repo = Repo(repo_path)
    
    # 1. Clean URL and Setup Remote with Auth
    clean_url = repo_url.replace("https://", "").replace("http://", "")
    auth_url = f"https://{github_token}@{clean_url}"
    
    try:
        origin = repo.remote(name='origin')
        origin.set_url(auth_url)
        
        # 2. Stage and commit locally
        repo.git.add(A=True)
        # Ensure we don't commit if the agent didn't change anything
        if not repo.is_dirty(untracked_files=True):
            print("[GIT] No changes detected, skipping push.")
            return {"success": True, "reason": "No changes", "sha": None}

        # The FixerAgent provides the [AI-AGENT] prefix
        commit = repo.index.commit(commit_message)

        # 3. Pull/Sync before Pushing
        try:
            origin.fetch()
            remote_branch_exists = any(ref.name == f"origin/{branch_name}" for ref in origin.refs)
            
            if remote_branch_exists:
                # Use rebase with 'ours' strategy to favor the AI's latest local fix
                repo.git.pull('origin', branch_name, '--rebase', '-X', 'ours')
                print(f"[GIT] Synced with remote {branch_name}")
        except Exception as e:
            print(f"[GIT] Sync skipped or non-critical failure: {e}")

        # 4. The Push
        push_infos = origin.push(refspec=f"refs/heads/{branch_name}:refs/heads/{branch_name}")
        
        info = push_infos[0]
        if info.flags & info.ERROR:
            error_msg = f"Push rejected: {info.summary}"
            print(f"[GIT ERROR] {error_msg}")
            return {"success": False, "reason": error_msg}

        # 🚨 THE CRITICAL FIX: Hard reset local files to the remote state
        # This ensures the NEXT iteration of the agent sees the code it just pushed.
        repo.git.reset('--hard', f'origin/{branch_name}')
        print(f"[GIT SUCCESS] Pushed {commit.hexsha[:7]} and synced local workspace.")

        return {
            "success": True, 
            "branch": branch_name, 
            "sha": commit.hexsha, 
            "commit_count": len(list(repo.iter_commits()))
        }

    except Exception as e:
        print(f"[GIT CRITICAL ERROR] {str(e)}")
        return {"success": False, "reason": str(e)}
    finally:
        # Always remove the token from the remote URL for safety
        try:
            origin.set_url(repo_url)
        except:
            pass

def generate_results_json(
    repo_url: str,
    branch_name: str,
    team_name: str,
    leader_name: str,
    fixes: list,
    ci_status: str,
    start_time: str,
    time_taken: float,
    iterations: int,
    commit_count: int,
    max_retries: int = 5
) -> dict:
    total_fixes  = len(fixes)
    total_fixed  = len([f for f in fixes if f.get("status") == "Fixed"])
    total_failed = total_fixes - total_fixed
    # ✅ CORRECT SCORING LOGIC
    base_score = 100
    speed_bonus = 10 if time_taken < 300 else 0
    efficiency_penalty = max(0, (commit_count - 20) * 2)
    final_score = base_score + speed_bonus - efficiency_penalty
    results = {
        "repository": repo_url,
        "branch": branch_name,
        "team_name": team_name,
        "leader_name": leader_name,
        "start_time": start_time,
        "end_time": datetime.utcnow().isoformat(),
        "time_taken_seconds": round(time_taken, 2),
        "total_failures_detected": total_fixes,
        "total_fixes_applied": total_fixed,
        "ci_status": ci_status,
        # ✅ SCORE PANEL (IMPORTANT)
        "score_breakdown": {
            "base_score": base_score,
            "speed_bonus": speed_bonus,
            "efficiency_penalty": efficiency_penalty,
            "final_score": final_score,
            "commit_count": commit_count,
            "under_5_minutes": time_taken < 300
        },
        "fixes": [
            {
                "file": f.get("file"),
                "bug_type": f.get("bug_type"),
                "line_number": f.get("line"),
                "commit_message": f"[AI-AGENT] Fix {f.get('bug_type')} in {f.get('file')} line {f.get('line')}",
                "status": f.get("status", "Failed")
            }
            for f in fixes
        ],
        # ✅ ITERATION TRACKING
        "ci_history": {
            "iterations_used": iterations,
            "max_retries": max_retries,
            "final_status": ci_status
        }
    }
    os.makedirs("results", exist_ok=True)
    with open("results/results.json", "w") as f:
        json.dump(results, f, indent=2)
    return results


def get_repo_info(repo_path: str) -> dict:
    """Extract basic repo metadata for dashboard display."""
    repo = Repo(repo_path)
    return {
        "current_branch": repo.active_branch.name,
        "commit_count":   len(list(repo.iter_commits())),
        "remote_url":     repo.remotes.origin.url if repo.remotes else None,
        "is_dirty":       repo.is_dirty(untracked_files=True)
    }
