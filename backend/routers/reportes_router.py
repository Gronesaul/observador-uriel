from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from auth import get_usuario_actual, requerir_coordinador
from typing import Optional

router = APIRouter(prefix="/api/reportes", tags=["reportes"])


@router.get("/resumen")
def resumen_general(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    total_est = db.query(models.Estudiante).filter(models.Estudiante.activo == True).count()
    total_anot = db.query(models.Anotacion).count()
    t1 = db.query(models.Anotacion).filter(models.Anotacion.tipo_falta == "tipo1").count()
    t2 = db.query(models.Anotacion).filter(models.Anotacion.tipo_falta == "tipo2").count()
    t3 = db.query(models.Anotacion).filter(models.Anotacion.tipo_falta == "tipo3").count()
    pendientes = db.query(models.Seguimiento).filter(
        models.Seguimiento.estado.in_(["pendiente", "en_proceso"])
    ).count()
    no_notificados = db.query(models.Anotacion).filter(
        models.Anotacion.notificado_acudiente == False
    ).count()

    return {
        "total_estudiantes": total_est,
        "total_anotaciones": total_anot,
        "tipo1": t1,
        "tipo2": t2,
        "tipo3": t3,
        "seguimientos_pendientes": pendientes,
        "sin_notificar_acudiente": no_notificados,
    }


@router.get("/por-sede")
def reporte_por_sede(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    sedes = db.query(models.Estudiante.sede).distinct().all()
    resultado = []
    for (sede,) in sedes:
        if not sede:
            continue
        estudiantes_ids = [
            e.id for e in db.query(models.Estudiante).filter(
                models.Estudiante.sede == sede, models.Estudiante.activo == True
            ).all()
        ]
        anot = db.query(models.Anotacion).filter(
            models.Anotacion.estudiante_id.in_(estudiantes_ids)
        ).count() if estudiantes_ids else 0
        resultado.append({
            "sede": sede,
            "estudiantes": len(estudiantes_ids),
            "anotaciones": anot,
        })
    return sorted(resultado, key=lambda x: x["anotaciones"], reverse=True)


@router.get("/estudiantes-con-mas-anotaciones")
def top_estudiantes(limit: int = Query(10, le=50), db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    conteo = (
        db.query(
            models.Anotacion.estudiante_id,
            func.count(models.Anotacion.id).label("total")
        )
        .group_by(models.Anotacion.estudiante_id)
        .order_by(func.count(models.Anotacion.id).desc())
        .limit(limit)
        .all()
    )
    resultado = []
    for est_id, total in conteo:
        est = db.query(models.Estudiante).filter(models.Estudiante.id == est_id).first()
        if est:
            t3 = db.query(models.Anotacion).filter(
                models.Anotacion.estudiante_id == est_id,
                models.Anotacion.tipo_falta == "tipo3"
            ).count()
            resultado.append({
                "id": est.id,
                "nombre": f"{est.nombres} {est.apellidos}",
                "sede": est.sede,
                "grado": est.grado,
                "total_anotaciones": total,
                "tiene_tipo3": t3 > 0,
            })
    return resultado


@router.get("/seguimientos-activos")
def seguimientos_activos(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    segs = (
        db.query(models.Seguimiento)
        .filter(models.Seguimiento.estado.in_(["pendiente", "en_proceso"]))
        .order_by(models.Seguimiento.fecha_apertura.desc())
        .all()
    )
    resultado = []
    for s in segs:
        est = db.query(models.Estudiante).filter(models.Estudiante.id == s.estudiante_id).first()
        resultado.append({
            "id": s.id,
            "estudiante": f"{est.nombres} {est.apellidos}" if est else "N/A",
            "sede": est.sede if est else "N/A",
            "grado": est.grado if est else "N/A",
            "tipo_accion": s.tipo_accion,
            "estado": s.estado,
            "fecha_apertura": s.fecha_apertura.isoformat(),
        })
    return resultado
