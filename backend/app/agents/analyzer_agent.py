# app/agents/analyzer_agent.py

class AnalyzerAgent:
    def __init__(self, max_file_attempts=3):
        self.attempted_files = [] 
        self.file_failure_counts = {}
        self.max_file_attempts = max_file_attempts

    def process_logs(self, all_errors):
        if not all_errors:
            return None
        
        # 🛡️ Step 1: Redirect Test errors to Source files
        mapped_errors = []
        for e in all_errors:
            orig_file = e['file']
            target_file = orig_file

            if orig_file.startswith('tests/test_'):
                target_file = orig_file.replace('tests/test_', 'src/')
            elif orig_file.startswith('tests/'):
                target_file = orig_file.replace('tests/', 'src/')

            if self.file_failure_counts.get(target_file, 0) >= self.max_file_attempts:
                continue
            
            new_error = e.copy()
            new_error['file'] = target_file
            mapped_errors.append(new_error)
        
        if not mapped_errors:
            return None

        # 🎯 Step 2: Tiered Priority (Blockers > Logic > Others)
        
        # TIER 0: BLOCKERS (Import/Collection/Syntax errors that stop pytest entirely)
        blocker_keywords = ["ImportError", "SyntaxError", "NameError", "module not found"]
        blockers = [
            e for e in mapped_errors 
            if any(k.lower() in e.get('message', '').lower() for k in blocker_keywords) or 
            e.get('bug_type') in ['SYNTAX', 'IMPORT']
        ]
        # TIER 0: THE BLOCKERS (Highest Priority)
        # If pytest can't even LOAD the file, nothing else matters.
        blockers = [
            e for e in mapped_errors 
            if "ImportError" in e.get('message', '') or 
            "SyntaxError" in e.get('message', '') or
            e.get('bug_type') == 'BLOCKER'
        ]

        if blockers:
            print(f"🚨 [ANALYZER] BLOCKER DETECTED in {blockers[0]['file']}. Fixing this first!")
            return self._pick_with_rotation(blockers)
        
        # TIER 1: LOGIC (Assertion failures)
        logic_errors = [e for e in mapped_errors if "AssertionError" in e.get('message', '')]

        # TIER 2: MINOR (Linting, etc.)
        minor_errors = [e for e in mapped_errors if e not in blockers and e not in logic_errors]

        # 🚀 Execute Selection
        if blockers:
            print(f"🚨 [ANALYZER] Priority: BLOCKER error in {blockers[0]['file']}")
            return self._pick_with_rotation(blockers)

        if logic_errors:
            print(f"🎯 [ANALYZER] Priority: LOGIC error in {logic_errors[0]['file']}")
            return self._pick_with_rotation(logic_errors)

        print("🧹 [ANALYZER] Priority: MINOR issues.")
        return self._pick_with_rotation(minor_errors)

    def _pick_with_rotation(self, error_list):
        for error in error_list:
            if error['file'] not in self.attempted_files:
                self.attempted_files.append(error['file'])
                return self._format_error(error)
        
        self.attempted_files = []
        return self._format_error(error_list[0])

    def _format_error(self, error):
        msg = error.get('message', '')
        bug_type = error.get('bug_type', 'UNKNOWN')
        
        # Dynamically categorize based on message content rather than hardcoding
        if "AssertionError" in msg:
            bug_type = "LOGIC"
        elif any(k in msg for k in ["ImportError", "SyntaxError"]):
            bug_type = "BLOCKER"

        return {
            "file": error['file'],
            "message": msg, 
            "bug_type": bug_type,
            "line": error.get('line', 0)
        }

    def increment_attempt(self, file_path):
        self.file_failure_counts[file_path] = self.file_failure_counts.get(file_path, 0) + 1