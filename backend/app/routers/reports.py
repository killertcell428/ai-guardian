"""Reports API — compliance report generation endpoints."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.billing.enforcement import require_plan
from app.db.session import get_db
from app.dependencies import get_current_user
from app.reports.generator import generate_report_data, render_csv

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/generate", dependencies=[Depends(require_plan("business"))])
async def generate_report(
    format: str = Query("json", enum=["json", "csv"]),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    """Generate a compliance report for the specified period.

    Args:
        format: Output format (json or csv)
        days: Number of days to include (default 30)
    """
    date_to = datetime.utcnow()
    date_from = date_to - timedelta(days=days)

    report_data = await generate_report_data(
        db=db,
        tenant_id=user.tenant_id,
        date_from=date_from,
        date_to=date_to,
    )

    if format == "csv":
        csv_content = render_csv(report_data)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=ai_guardian_report_{days}d.csv"
            },
        )

    return JSONResponse(content=report_data)
