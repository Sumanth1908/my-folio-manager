"""Router for data export and import operations."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlmodel import Session

from app.core.database import get_session
from app.deps import get_current_user
from app.models.user import User
from app.services.data_export_service import data_export_service

router = APIRouter(prefix="/data", tags=["data"])


@router.get("/export")
def export_data(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Export all user data to a JSON format.
    
    Returns a JSON object containing all accounts, transactions,
    categories, rules, and settings for the current user.
    """
    try:
        export_data = data_export_service.export_user_data(session, current_user.user_id)
        return export_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.post("/import")
async def import_data(
    file: UploadFile = File(...),
    clear_existing: bool = False,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Import user data from an exported JSON file.
    
    Args:
        file: The JSON file to import
        clear_existing: If True, delete all existing data before import
        
    Returns:
        Summary of imported data
    """
    if not file.filename or not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Please upload a valid JSON file")
    
    try:
        import json
        content = await file.read()
        import_data = json.loads(content.decode('utf-8'))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    try:
        summary = data_export_service.import_user_data(
            session, 
            current_user.user_id, 
            import_data,
            clear_existing=clear_existing
        )
        return {
            "message": "Import completed successfully",
            "summary": summary
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
