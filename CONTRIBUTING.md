# Contributing to ai-guardian

Thank you for your interest in contributing!

## Ways to contribute

- **New detection patterns** — add rules in `ai_guardian/filters/patterns.py`
- **New middleware** — add integrations under `ai_guardian/middleware/`
- **Bug fixes** — open an issue first to discuss the fix
- **Documentation** — improve README or docstrings

## Setup

```bash
git clone https://github.com/killertcell428/ai-guardian
cd ai-guardian
pip install -e '.[dev]'
```

## Running tests

```bash
pytest tests/ -v
pytest tests/ --cov=ai_guardian --cov-report=term-missing
```

## Adding a detection pattern

1. Open `ai_guardian/filters/patterns.py`.
2. Add a `DetectionPattern` to the appropriate list (or create a new category list and add it to `ALL_INPUT_PATTERNS` / `OUTPUT_PATTERNS`).
3. Include `owasp_ref` and `remediation_hint` — these are displayed to developers when a rule fires.
4. Add a test in `tests/test_filters.py` that asserts the new rule matches an example string and does NOT match clean input.
5. Run `pytest` to confirm all tests pass.

## Adding a middleware integration

1. Create `ai_guardian/middleware/<framework>.py`.
2. Guard the import with a `try/except ImportError` that raises a clear message directing users to the right `pip install` extra.
3. Export the class in `ai_guardian/middleware/__init__.py`.
4. Add the optional dependency to `pyproject.toml` under `[project.optional-dependencies]`.
5. Write tests in `tests/test_middleware.py` with `@pytest.mark.skipif(not HAS_<FRAMEWORK>, ...)`.

## Pull request checklist

- [ ] Tests pass (`pytest tests/ -v`)
- [ ] New patterns have both a positive test and a negative (clean input) test
- [ ] Docstrings updated for public API changes
- [ ] `CHANGELOG.md` entry added (if applicable)

## Code style

```bash
ruff check ai_guardian/ tests/
ruff format ai_guardian/ tests/
```

## Reporting security vulnerabilities

Please do **not** open public GitHub issues for security vulnerabilities. Email the maintainers directly (see repository contact info).
