from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models
from auth import requerir_superior, get_usuario_actual
from schemas import AsignacionGrupoCreate, AsignacionGrupoOut
from typing import List

router = APIRouter(prefix="/api/grupos", tags=["grupos"])


@router.get("/", response_model=List[AsignacionGrupoOut])
def listar_asignaciones(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    """Quién es director/a de qué sede+grado+grupo. Visible para cualquier autenticado."""
    asignaciones = (
        db.query(models.AsignacionGrupo)
        .options(joinedload(models.AsignacionGrupo.docente))
        .order_by(models.AsignacionGrupo.sede, models.AsignacionGrupo.grado)
        .all()
    )
    return [
        AsignacionGrupoOut(
            id=a.id, docente_id=a.docente_id, sede=a.sede, grado=a.grado, grupo=a.grupo,
            docente_nombre=f"{a.docente.nombres} {a.docente.apellidos}" if a.docente else None,
        )
        for a in asignaciones
    ]


@router.post("/", response_model=AsignacionGrupoOut, status_code=201)
def crear_asignacion(
    data: AsignacionGrupoCreate,
    db: Session = Depends(get_db),
    _=Depends(requerir_superior),
):
    """Rector/admin asigna un docente como director/a de un sede+grado(+grupo)."""
    docente = db.query(models.Usuario).filter(models.Usuario.id == data.docente_id).first()
    if not docente:
        raise HTTPException(status_code=404, detail="Docente no encontrado")

    ya_existe = db.query(models.AsignacionGrupo).filter(
        models.AsignacionGrupo.docente_id == data.docente_id,
        models.AsignacionGrupo.sede == data.sede,
        models.AsignacionGrupo.grado == data.grado,
        models.AsignacionGrupo.grupo == data.grupo,
    ).first()
    if ya_existe:
        raise HTTPException(status_code=400, detail="Esa asignación ya existe")

    asignacion = models.AsignacionGrupo(
        docente_id=data.docente_id, sede=data.sede, grado=data.grado, grupo=data.grupo,
    )
    db.add(asignacion)
    db.commit()
    db.refresh(asignacion)
    return AsignacionGrupoOut(
        id=asignacion.id, docente_id=asignacion.docente_id, sede=asignacion.sede,
        grado=asignacion.grado, grupo=asignacion.grupo,
        docente_nombre=f"{docente.nombres} {docente.apellidos}",
    )


@router.delete("/{asignacion_id}")
def eliminar_asignacion(asignacion_id: int, db: Session = Depends(get_db), _=Depends(requerir_superior)):
    a = db.query(models.AsignacionGrupo).filter(models.AsignacionGrupo.id == asignacion_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    db.delete(a)
    db.commit()
    return {"mensaje": "Asignación eliminada"}
