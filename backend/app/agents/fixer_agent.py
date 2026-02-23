# app/agents/fixer_agent.py
import os
from mistralai import Mistral

class FixerAgent:
    def __init__(self, api_key):
        self.client = Mistral(api_key=api_key)

    async def execute_fix(self, repo_path, error_data):
        file_path = os.path.join(repo_path, error_data['file'])
        
        original_code = ""
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                original_code = f.read()

        system_prompt = """
        You are an Expert Python Software Engineer and Debugger specialized in automated CI/CD healing.
        Your goal is to fix code that is failing tests or static analysis. Your code must be production-ready and syntax-perfect.

        CRITICAL RULES:
        CRITICAL: CODE INTEGRITY RULE
        - You are strictly forbidden from deleting existing functions (add, divide, greet, etc.).
        - If a function is in the 'EXISTING CODE', it MUST be in your output.
        - If the error is 'ImportError: cannot import name X', you MUST look at your output and ensure 'def X' exists with a proper colon and indentation.
        - Do not prioritize linting (unused imports) over functional code. Keep the code running first.
        1. LOGICAL REASONING: If a test fails with an AssertionError, compare the actual return value with the expected value in the traceback. Adjust the mathematical operators (e.g., +, -, *, /) or comparison operators (e.g., ==, >, <) to match the intended behavior.
        2. EXCEPTION MATCHING: If a test expects a specific Exception type (e.g., ZeroDivisionError) but your code raises a different one, you MUST update the code to raise the EXACT exception class the test expects.
        3. FULL FILE CONTENT: Return the FULL content of the file. Never return placeholders like '...' or just the fixed snippet.
        4. NO MARKDOWN: Output ONLY raw Python code. Do NOT use markdown blocks (```python).
        5. NO CHAT: Do not include explanations, comments, or talk to the user.
        6. SYNTAX RIGOR: Every 'def', 'if', and 'class' MUST end with a colon (:) and be followed by a 4-space indented block.
        7. IMPORT FALLBACKS: If a module is missing, ensure the import is handled safely, but prioritize fixing the code logic as requested by the test failures.
        8. CODE PRESERVATION: You are FORBIDDEN from deleting existing functions. Even if they are not related to the current error, you MUST keep them in the file. If you see 'def add' in the existing code, it MUST be in your response.
        9. IMPORT INTEGRITY: Ensure all functions requested by the tests (like 'add' and 'divide') are present in the final output.
        """

        user_msg = f"""
        Fix the logical and syntax errors in '{error_data['file']}':

        ERROR CONTEXT:
        - Target File: {error_data['file']} (This is the SOURCE code to fix)
        - Bug Type: {error_data['bug_type']}
        - Traceback/Assertion: {error_data.get('message', 'Unknown Error')}

        REPAIR INSTRUCTIONS:
        - The test is failing because the logic in '{error_data['file']}' is incorrect.
        - Analyze the mismatch in the Traceback. If the test expected 12 but got 7, fix the math operator (+ to *) in THIS file.
        - Ensure all function signatures match what the tests expect.
        - Do not change any test files; only repair the implementation in '{error_data['file']}'.

        EXISTING CODE:
        ---
        {original_code}
        ---

        Return the entire corrected file content:
        """

        response = await self.client.chat.complete_async(
            model="codestral-latest",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg}
            ],
            temperature=0.1
        )
        
        fixed_code = response.choices[0].message.content.strip()

        if not fixed_code or fixed_code == "..." or "I cannot fix" in fixed_code:
            print(f"⚠️ AI gave up or returned placeholder for {error_data['file']}")
            return {"fixed_code": original_code, "commit_msg": "No fix generated", "changed": False}

        if fixed_code.strip() == original_code.strip():
            print(f"ℹ️ AI returned identical code for {error_data['file']}. No logic change.")
            return {"fixed_code": original_code, "commit_msg": "No change detected", "changed": False}

        with open(file_path, 'w') as f:
            f.write(fixed_code)

        fix_description = f"Fix: corrected {error_data['bug_type'].lower()} issue"
        dashboard_string = f"{error_data['bug_type']} error in {error_data['file']} -> {fix_description}"

        return {
            "fixed_code": fixed_code,
            "commit_msg": f"[AI-AGENT] {dashboard_string}",
            "changed": True
        }