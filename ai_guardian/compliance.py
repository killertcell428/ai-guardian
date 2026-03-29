"""Japan AI Governance compliance checker.

Maps AI Guardian capabilities to specific requirements from:
  - AI事業者ガイドライン v1.1 (2025年3月)
  - AIセキュリティ技術ガイドライン (総務省 2025年度)
  - AI推進法 (2025年9月施行)
  - 個人情報保護法 (APPI) / マイナンバー法

Usage:
    from ai_guardian.compliance import check_compliance, get_compliance_report

    report = get_compliance_report()
    for item in report:
        print(f"[{item['status']}] {item['requirement']}")
"""

from dataclasses import dataclass


@dataclass
class ComplianceItem:
    """A single regulatory requirement and its compliance status."""

    regulation: str
    requirement_id: str
    requirement: str
    description: str
    ai_guardian_feature: str
    status: str  # "covered" | "partial" | "not_covered" | "user_responsibility"
    notes: str = ""


def get_compliance_report() -> list[dict]:
    """Generate a comprehensive compliance report.

    Returns a list of compliance items showing how AI Guardian
    maps to each Japanese AI regulatory requirement.
    """
    items = _build_compliance_items()
    return [
        {
            "regulation": item.regulation,
            "requirement_id": item.requirement_id,
            "requirement": item.requirement,
            "description": item.description,
            "ai_guardian_feature": item.ai_guardian_feature,
            "status": item.status,
            "notes": item.notes,
        }
        for item in items
    ]


def get_compliance_summary() -> dict:
    """Get a summary of compliance coverage."""
    items = _build_compliance_items()
    total = len(items)
    covered = sum(1 for i in items if i.status == "covered")
    partial = sum(1 for i in items if i.status == "partial")
    not_covered = sum(1 for i in items if i.status == "not_covered")
    user_resp = sum(1 for i in items if i.status == "user_responsibility")

    return {
        "total_requirements": total,
        "covered": covered,
        "partial": partial,
        "not_covered": not_covered,
        "user_responsibility": user_resp,
        "coverage_rate": round(((covered + partial * 0.5) / total) * 100, 1) if total else 0,
        "by_regulation": _group_by_regulation(items),
    }


def _group_by_regulation(items: list[ComplianceItem]) -> dict:
    groups: dict[str, dict] = {}
    for item in items:
        if item.regulation not in groups:
            groups[item.regulation] = {"total": 0, "covered": 0, "partial": 0, "not_covered": 0}
        groups[item.regulation]["total"] += 1
        if item.status in ("covered", "partial", "not_covered"):
            groups[item.regulation][item.status] += 1
    return groups


def _build_compliance_items() -> list[ComplianceItem]:
    return [
        # === AI事業者ガイドライン v1.1 ===
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-SEC-01",
            requirement="設計段階からのセキュリティ組み込み",
            description="AIシステムの設計段階からセキュリティを練り込む。",
            ai_guardian_feature="プロキシ型アーキテクチャにより、既存LLMアプリに後付けでセキュリティを追加可能。43+検知パターン。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-SEC-02",
            requirement="脆弱性情報収集と迅速なパッチ配布",
            description="脆弱性情報を収集し、迅速にパッチを配布する体制を構築。",
            ai_guardian_feature="OWASP LLM Top 10分類により既知の脆弱性カテゴリをカバー。パターン更新はSDKバージョンアップで配布。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-RISK-01",
            requirement="危害の大きさと発生確率の事前見積もり",
            description="リスクの大きさと発生確率を事前に見積もり、対策レベルを設定。",
            ai_guardian_feature="リスクスコアリング（0-100）で各リクエストの危険度を定量評価。Low/Medium/High/Criticalの4段階。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-RISK-02",
            requirement="ヒヤリ・ハット情報とインシデントDB",
            description="ヒヤリ・ハット情報とインシデントデータベースを調査・蓄積。",
            ai_guardian_feature="監査ログに全リクエスト・判定・レビュー結果を記録。コンプライアンスレポートで集計。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-TRANS-01",
            requirement="モデルの更新履歴と評価結果のドキュメント化",
            description="更新履歴と評価結果を文書化し、再検証可能な状態を維持。",
            ai_guardian_feature="Activity Streamで全エージェント操作を自動記録（JSONL）。グローバル集約で全プロジェクト横断の履歴を管理。CSV/Excelエクスポートで監査対応。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-TRANS-02",
            requirement="モデルの能力と限界の開示",
            description="モデルの能力と限界を利用者に開示。",
            ai_guardian_feature="修復ヒントで各検知ルールのOWASP参照・修復方法を提供。レポートでカバー範囲を明示。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-HUMAN-01",
            requirement="人間による監督と最終判断",
            description="最終判断を人が担当する設計。危険領域では人間判断を挿入。",
            ai_guardian_feature="Human-in-the-Loop（レビューキュー）。Medium/Highリスクは自動でキューへ。SLAタイムアウト+フォールバック。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-DATA-01",
            requirement="個人情報保護法を踏まえた設計と運用",
            description="プライバシー・バイ・デザインによる対応。",
            ai_guardian_feature="PII検知（日本語+国際）15パターン。自動サニタイズ（sanitize()）でPIIを墨消し。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-DATA-02",
            requirement="データリネージの整備",
            description="データの来歴追跡と外部ソース権利関係の遡行可能性。",
            ai_guardian_feature="Activity Streamで全ファイルアクセス（file:read/write）を記録。scan_rag_context()でRAG検索結果をスキャン。操作の来歴をタイムスタンプ+セッション+ユーザーで追跡可能。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI事業者ガイドライン v1.1",
            requirement_id="GL-AUDIT-01",
            requirement="学習過程とアルゴリズム選定の追跡可能性",
            description="第三者による追跡可能性を確保。変更管理ログの維持。",
            ai_guardian_feature="監査ログ100%記録。全リクエスト・判定・レビュー結果・ポリシー変更を不変ログとして保存。",
            status="covered",
        ),
        # === AIセキュリティ技術ガイドライン（総務省） ===
        ComplianceItem(
            regulation="AIセキュリティ技術ガイドライン（総務省）",
            requirement_id="SEC-ML-01",
            requirement="多層防御の実装",
            description="学習段階、推論段階、周辺システムでの分業と冗長化。",
            ai_guardian_feature="3層防御: Layer 1(正規表現48パターン) → Layer 2(類似度検知40フレーズ) → Layer 3(Human-in-the-Loop)",
            status="covered",
        ),
        ComplianceItem(
            regulation="AIセキュリティ技術ガイドライン（総務省）",
            requirement_id="SEC-PI-01",
            requirement="プロンプトインジェクション対策",
            description="直接/間接プロンプトインジェクション攻撃への技術的対策。",
            ai_guardian_feature="直接PI: 正規表現(EN12+JA6パターン)+類似度検知。間接PI: scan_rag_context()でRAGコンテキストスキャン。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AIセキュリティ技術ガイドライン（総務省）",
            requirement_id="SEC-PI-02",
            requirement="入力の構造的分離（タグ付け）",
            description="ユーザー入力とシステム命令を構造的に分離するタグ付け。",
            ai_guardian_feature="Claude Code Adapterがtool_name/tool_inputを構造的に解析し、ユーザー入力とシステム操作を自動分離。PreToolUse hookでJSON構造化データとして入力を受取り、action/targetに分類してからスキャン。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AIセキュリティ技術ガイドライン（総務省）",
            requirement_id="SEC-GUARD-01",
            requirement="ガードレール実装（入出力検証）",
            description="別のAIやフィルタで入出力をチェックする仕組み。",
            ai_guardian_feature="入力フィルター(48パターン) + 出力フィルター(7パターン)。独立したフィルタリングレイヤーとして機能。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AIセキュリティ技術ガイドライン（総務省）",
            requirement_id="SEC-HUMAN-01",
            requirement="重要な操作への人間の承認",
            description="重要な操作（ファイル削除等）の前に人間の確認プロセスを挟む。",
            ai_guardian_feature="Human-in-the-Loopレビューキュー。Medium/Highリスクは人間の承認が必要。SLAタイムアウトでフォールバック。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AIセキュリティ技術ガイドライン（総務省）",
            requirement_id="SEC-PRIV-01",
            requirement="最小権限の原則",
            description="AIに管理者権限を付与しない。データベース接続は読み取り専用に限定。",
            ai_guardian_feature="Policy Engineで操作ごとの権限を制御（allow/deny/review）。デフォルトポリシーでsudo/rm -rf/force pushをブロック。.env/.ssh/credentialsへのアクセスを制限。エージェントの権限を最小限に強制。",
            status="covered",
        ),
        # === AI推進法 ===
        ComplianceItem(
            regulation="AI推進法（2025年9月施行）",
            requirement_id="ACT-COOP-01",
            requirement="国の施策への協力努力義務",
            description="AI活用事業者は国や自治体の施策に協力する努力義務。",
            ai_guardian_feature="コンプライアンスレポートにより、ガバナンス体制の構築を証明。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI推進法（2025年9月施行）",
            requirement_id="ACT-TRANS-01",
            requirement="透明性の確保",
            description="AIの利用における透明性確保。",
            ai_guardian_feature="監査ログ（100%記録）+ コンプライアンスレポート（OWASP/CWEカバレッジ付き）。",
            status="covered",
        ),
        ComplianceItem(
            regulation="AI推進法（2025年9月施行）",
            requirement_id="ACT-HUMAN-01",
            requirement="人間の関与の確保",
            description="人間の尊厳を守るための人間の関与。",
            ai_guardian_feature="Human-in-the-Loop設計。「AIは検知し、人間が判断する」の原則。",
            status="covered",
        ),
        # === APPI / マイナンバー法 ===
        ComplianceItem(
            regulation="個人情報保護法 / マイナンバー法",
            requirement_id="APPI-PII-01",
            requirement="個人データの安全管理措置",
            description="個人データの漏洩防止のための安全管理措置を講じる。",
            ai_guardian_feature="PII検知（入力15パターン+出力7パターン）+ 自動サニタイズ（sanitize()）で送信前に墨消し。",
            status="covered",
        ),
        ComplianceItem(
            regulation="個人情報保護法 / マイナンバー法",
            requirement_id="APPI-MN-01",
            requirement="特定個人情報（マイナンバー）の適正な取扱い",
            description="マイナンバーの漏洩は刑事罰対象。収集・保管・利用・廃棄を厳格管理。",
            ai_guardian_feature="マイナンバー（12桁）の入力・出力検知。全角数字・ハイフン区切りも正規化して検知。自動墨消し対応。",
            status="covered",
        ),
        ComplianceItem(
            regulation="個人情報保護法 / マイナンバー法",
            requirement_id="APPI-LOG-01",
            requirement="個人データ取扱いの記録",
            description="個人データの取扱い記録を作成・保存。",
            ai_guardian_feature="監査ログにPII検知イベントを記録。検知パターン・リスクスコア・判定結果を保存。",
            status="covered",
        ),
        # === 不正競争防止法 ===
        ComplianceItem(
            regulation="不正競争防止法",
            requirement_id="UCP-TS-01",
            requirement="営業秘密の秘密管理性の維持",
            description="営業秘密をLLMに送信すると秘密管理性が失われるリスク。",
            ai_guardian_feature="営業秘密マーカー検知（「営業秘密」「NDA」「限定提供データ」等）。検知時に修復ヒント提供。",
            status="covered",
        ),
        # === 著作権法 ===
        ComplianceItem(
            regulation="著作権法",
            requirement_id="CR-01",
            requirement="著作物の不正利用防止",
            description="著作物の全文生成・大量引用は著作権侵害のリスク。",
            ai_guardian_feature="著作物全文コピー要求の検知パターン+修復ヒントで出典明記と要約利用を推奨。Activity Streamで全LLMプロンプトを記録し、著作権関連リクエストの事後監査が可能。Policy Engineで著作権リスクの高い操作をreview対象に設定可能。",
            status="covered",
            notes="著作権侵害の最終判断は法的判断であるが、検知・警告・記録・レビューフローの技術的基盤は完備。",
        ),
    ]
