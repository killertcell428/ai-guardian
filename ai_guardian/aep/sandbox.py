"""Sandbox execution environments for the Atomic Execution Pipeline.

Provides isolated execution of code snippets with resource limits,
environment stripping, and artifact tracking.  The ``ProcessSandbox``
implementation uses only stdlib modules (subprocess, tempfile, shutil).
"""

from __future__ import annotations

import os
import platform
import subprocess
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol, runtime_checkable


@dataclass
class SandboxResult:
    """Outcome of running code inside a sandbox."""

    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: float
    artifacts: list[str] = field(default_factory=list)


@runtime_checkable
class Sandbox(Protocol):
    """Protocol that any sandbox implementation must satisfy."""

    def execute(
        self,
        code: str,
        env: dict[str, str],
        timeout: float,
        work_dir: Path,
    ) -> SandboxResult:
        """Execute *code* inside the sandbox and return results."""
        ...


class ProcessSandbox:
    """Stdlib-only sandbox using ``subprocess`` + temporary directory.

    Security measures
    -----------------
    * ``subprocess.run`` with strict ``timeout``.
    * Temporary directory isolated from the project tree.
    * Environment variables stripped to a minimal safe set.
    * Working directory restricted to the temp location.

    Platform behaviour
    ------------------
    * **Windows** -- uses ``cmd /c`` as the shell.
    * **Unix / macOS** -- uses ``bash -c`` (falls back to ``sh -c``).
    """

    SAFE_ENV_KEYS: frozenset[str] = frozenset(
        {"PATH", "HOME", "TEMP", "TMP", "SYSTEMROOT", "COMSPEC", "LANG", "LC_ALL"}
    )

    def __init__(self, *, extra_safe_keys: set[str] | None = None) -> None:
        """Create a ProcessSandbox.

        Args:
            extra_safe_keys: Additional environment variable names that should
                be preserved when building the sandboxed environment.
        """
        self._safe_keys = self.SAFE_ENV_KEYS | (extra_safe_keys or set())

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def execute(
        self,
        code: str,
        env: dict[str, str] | None = None,
        timeout: float = 30.0,
        work_dir: Path | None = None,
    ) -> SandboxResult:
        """Execute *code* in an isolated subprocess.

        Args:
            code: Shell code to execute (bash on Unix, cmd on Windows).
            env: Extra environment variables merged into the safe set.
            timeout: Maximum wall-clock seconds before the process is killed.
            work_dir: If ``None`` a fresh temporary directory is created
                (and returned via :pyattr:`SandboxResult.artifacts`).

        Returns:
            ``SandboxResult`` with captured stdout/stderr, exit code,
            elapsed time, and a list of files created in *work_dir*.
        """
        created_tmp = False
        if work_dir is None:
            work_dir = Path(tempfile.mkdtemp(prefix="aep_sandbox_"))
            created_tmp = True

        work_dir.mkdir(parents=True, exist_ok=True)

        # Snapshot existing files so we can detect new artifacts later.
        pre_existing = self._list_files(work_dir)

        safe_env = self._build_env(env)
        shell_cmd = self._shell_command(code)

        t0 = time.perf_counter()
        try:
            proc = subprocess.run(
                shell_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=str(work_dir),
                env=safe_env,
            )
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            stdout = proc.stdout
            stderr = proc.stderr
            exit_code = proc.returncode
        except subprocess.TimeoutExpired as exc:
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            stdout = (exc.stdout or b"").decode(errors="replace") if isinstance(exc.stdout, bytes) else (exc.stdout or "")
            stderr = (exc.stderr or b"").decode(errors="replace") if isinstance(exc.stderr, bytes) else (exc.stderr or "")
            exit_code = -1

        # Detect files created during execution.
        post_existing = self._list_files(work_dir)
        new_artifacts = sorted(post_existing - pre_existing)

        return SandboxResult(
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            execution_time_ms=round(elapsed_ms, 2),
            artifacts=new_artifacts,
        )

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _build_env(self, extra: dict[str, str] | None) -> dict[str, str]:
        """Build a stripped environment from the current process env."""
        base = {k: v for k, v in os.environ.items() if k in self._safe_keys}
        if extra:
            base.update(extra)
        return base

    @staticmethod
    def _shell_command(code: str) -> list[str]:
        """Return the platform-appropriate shell invocation."""
        if platform.system() == "Windows":
            return ["cmd", "/c", code]
        # Prefer bash; fall back to sh.
        bash = "/bin/bash"
        if not Path(bash).exists():
            bash = "/bin/sh"
        return [bash, "-c", code]

    @staticmethod
    def _list_files(directory: Path) -> set[str]:
        """Return the set of relative file paths under *directory*."""
        result: set[str] = set()
        if not directory.exists():
            return result
        for p in directory.rglob("*"):
            if p.is_file():
                result.add(str(p.relative_to(directory)))
        return result

    def __repr__(self) -> str:
        return f"ProcessSandbox(safe_keys={sorted(self._safe_keys)})"
