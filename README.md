# CI_CD_Healer

🤖 Autonomous CI/CD Healing Agent

AI/ML DevOps Automation — RIFT 2026 Hackathon
🔗 Submission Links

Live Dashboard: [Insert Hosted Vercel/Netlify URL here] 

LinkedIn Video Demo: [Insert LinkedIn Video URL here] 

GitHub Repository: [Insert Repo URL] 

🏗️ System Architecture
Our system utilizes a Multi-Agent Architecture powered by Mistral-Codestral to autonomously detect, repair, and verify CI/CD pipeline failures without human intervention.

The Multi-Agent Pipeline
Code snippet
graph TD
    A[GitHub Repo URL] --> B[Analyzer Agent]
    B --> C[Debugger Agent]
    C --> D[Fixer Agent - Codestral]
    D --> E[Validator Agent - Docker]
    E -- Fail (Retry < 5) --> C
    E -- Pass --> F[Results Dashboard]

Analyzer Agent: Clones the repository, analyzes the structure, and parses raw test logs to extract precise file paths and line numbers .


Debugger Agent: Maps failures to deterministic bug types (LINTING, SYNTAX, etc.) to ensure exact test case matching .


Fixer Agent (Brain): Leverages Mistral-Codestral to generate targeted code repairs and prepares commits with the mandatory [AI-AGENT] prefix .


Validator Agent: Executes the code in a sandboxed Docker environment to verify the fix and monitor the CI/CD pipeline.


🛠️ Tech Stack

Frontend: React JS(Functional Components + Hooks), Tailwind CSS, Lucide Icons .

Backend: FastAPI (Python), Multi-Agent Orchestration .

AI Model: Mistral-Codestral (Optimized for Python and Fill-In-the-Middle code repair).


DevOps: Docker (Sandboxed Execution), GitHub Actions, Git.

🚦 Supported Bug Types
The agent is engineered to identify and resolve the following categories exactly as required for evaluation:

LINTING

SYNTAX

LOGIC

TYPE_ERROR

IMPORT

INDENTATION

🚀 Installation & Setup
Environment Setup
Create a .env file in the /backend folder:

Code snippet
MISTRAL_API_KEY=your_codestral_key
GITHUB_TOKEN=your_personal_access_token
DATABASE_URL=sqlite:///./agent.db
Running Locally
Clone the repo: git clone [Your Repo URL]

Backend:

Bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
Frontend:

Bash
cd frontend
npm install
npm start

⚠️ Known Limitations
Maximum retry limit is hard-capped at 5 iterations per session.

Fixes are currently optimized for Python/Pytest environments.

The agent does not push directly to the main branch to maintain repository integrity.

👥 Team Members
Rugved Tanaji Sawant — Core Agent & AI Logic (Brain Owner)

[Member 2 Name] — React Dashboard & Git Integration

[Member 3 Name] — Backend Services & Docker Sandboxing
