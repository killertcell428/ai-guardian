# ai-guardian への貢献ガイド

コントリビューションに興味を持っていただきありがとうございます！

## 貢献の方法

- **検出パターンの追加** — `ai_guardian/filters/patterns.py` にルールを追加する
- **middleware の追加** — `ai_guardian/middleware/` 配下に連携モジュールを追加する
- **バグ修正** — まず issue を作成し、修正方針を議論してから着手する
- **ドキュメント改善** — README や docstring の充実化

## セットアップ

```bash
git clone https://github.com/killertcell428/ai-guardian
cd ai-guardian
pip install -e '.[dev]'
```

## テストの実行

```bash
pytest tests/ -v
pytest tests/ --cov=ai_guardian --cov-report=term-missing
```

## 検出パターンの追加手順

1. `ai_guardian/filters/patterns.py` を開く。
2. 該当するリストに `DetectionPattern` を追加する（新しいカテゴリが必要な場合はリストを作成し、`ALL_INPUT_PATTERNS` / `OUTPUT_PATTERNS` に登録する）。
3. `owasp_ref` と `remediation_hint` を必ず含める。ルールが発火した際に開発者へ表示される情報となる。
4. `tests/test_filters.py` にテストを追加する。対象文字列にマッチすること、かつ正常な入力にはマッチしないことの両方を検証する。
5. `pytest` を実行し、全テストが通ることを確認する。

## middleware 連携の追加手順

1. `ai_guardian/middleware/<framework>.py` を作成する。
2. import 部分を `try/except ImportError` で囲み、必要な `pip install` のエクストラを案内する明確なエラーメッセージを出す。
3. `ai_guardian/middleware/__init__.py` でクラスを export する。
4. `pyproject.toml` の `[project.optional-dependencies]` にオプション依存パッケージを追加する。
5. `tests/test_middleware.py` に `@pytest.mark.skipif(not HAS_<FRAMEWORK>, ...)` を付けたテストを書く。

## PR チェックリスト

- [ ] テストが通ること（`pytest tests/ -v`）
- [ ] 新しいパターンには正例テストと負例（正常入力）テストの両方があること
- [ ] 公開 API の変更に対して docstring が更新されていること
- [ ] 必要に応じて `CHANGELOG.md` にエントリを追加していること

## コードスタイル

```bash
ruff check ai_guardian/ tests/
ruff format ai_guardian/ tests/
```

## セキュリティ脆弱性の報告

セキュリティ脆弱性については、公開の GitHub issue を作成**しないで**ください。リポジトリの連絡先情報を参照し、メンテナーへ直接メールで報告してください。
