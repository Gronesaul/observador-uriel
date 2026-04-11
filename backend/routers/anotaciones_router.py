from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_usuario_actual, requerir_docente
from schemas import AnotacionCreate, AnotacionOut, SeguimientoCreate, SeguimientoOut, SeguimientoUpdate
from protocolo import calcular_protocolo, generar_mensaje_whatsapp, PROTOCOLOS
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/anotaciones", tags=["anotaciones"])


@router.post("/", response_model=AnotacionOut)
def crear_anotacion(
    data: AnotacionCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requerir_docente)
):
    est = db.query(models.Estudiante).filter(models.Estudiante.id == data.estudiante_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    # Contar anotaciones previas
    previas = db.query(models.Anotacion).filter(
        models.Anotacion.estudiante_id == data.estudiante_id
    ).all()
    t1 = sum(1 for a in previas if a.tipo_falta == "tipo1")
    t2 = sum(1 for a in previas if a.tipo_falta == "tipo2")
    t3 = sum(1 for a in previas if a.tipo_falta == "tipo3")

    # Calcular protocolo
    protocolo = calcular_protocolo(t1, t2, t3, data.tipo_falta)

    # Crear anotación
    anotacion = models.Anotacion(
        estudiante_id=data.estudiante_id,
        docente_id=usuario.id,
        tipo_falta=data.tipo_falta,
        categoria=data.categoria,
        descripcion=data.descripcion,
        acciones_inmediatas=data.acciones_inmediatas,
        sede_origen=usuario.sede,
        protocolo_sugerido=protocolo["codigo"],
        protocolo_descripcion=protocolo["descripcion"],
    )
    db.add(anotacion)
    db.flush()

    # Crear seguimiento automático
    seguimiento = models.Seguimiento(
        estudiante_id=data.estudiante_id,
        anotacion_id=anotacion.id,
        tipo_accion=protocolo["codigo"],
        estado="pendiente",
        creado_por_id=usuario.id,
    )
    db.add(seguimiento)
    db.commit()
    db.refresh(anotacion)

    # Generar WhatsApp URL
    whatsapp_url = None
    if est.telefono_acudiente:
        whatsapp_url = generar_mensaje_whatsapp(
            nombre_acudiente=est.nombre_acudiente or "Acudiente",
            nombre_estudiante=f"{est.nombres} {est.apellidos}",
            tipo_falta=data.tipo_falta,
            categoria=data.categoria or "Sin categoría",
            descripcion=data.descripcion,
            protocolo_titulo=protocolo["titulo"],
            nombre_docente=f"{usuario.nombres} {usuario.apellidos}",
            fecha=anotacion.fecha_anotacion.strftime("%d/%m/%Y"),
            telefono=est.telefono_acudiente,
        )

    return AnotacionOut(
        id=anotacion.id,
        estudiante_id=anotacion.estudiante_id,
        docente_id=anotacion.docente_id,
        tipo_falta=anotacion.tipo_falta,
        categoria=anotacion.categoria,
        descripcion=anotacion.descripcion,
        acciones_inmediatas=anotacion.acciones_inmediatas,
        sede_origen=anotacion.sede_origen,
        fecha_anotacion=anotacion.fecha_anotacion,
        protocolo_sugerido=anotacion.protocolo_sugerido,
        protocolo_descripcion=anotacion.protocolo_descripcion,
        notificado_acudiente=anotacion.notificado_acudiente,
        fecha_notificacion=anotacion.fecha_notificacion,
        docente=usuario,
        whatsapp_url=whatsapp_url,
    )


@router.put("/{anotacion_id}/notificado")
def marcar_notificado(
    anotacion_id: int,
    db: Session = Depends(get_db),
    _=Depends(requerir_docente)
):
    anot = db.query(models.Anotacion).filter(models.Anotacion.id == anotacion_id).first()
    if not anot:
        raise HTTPException(status_code=404, detail="Anotación no encontrada")
    anot.notificado_acudiente = True
    anot.fecha_notificacion = datetime.utcnow()
    db.commit()
    return {"mensaje": "Marcada como notificada al acudiente"}


# ── SEGUIMIENTOS ──────────────────────────────────────
@router.get("/seguimientos/pendientes", response_model=List[SeguimientoOut])
def seguimientos_pendientes(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    return (
        db.query(models.Seguimiento)
        .filter(models.Seguimiento.estado.in_(["pendiente", "en_proceso"]))
        .order_by(models.Seguimiento.fecha_apertura.desc())
        .all()
    )


@router.put("/seguimientos/{seg_id}")
def actualizar_seguimiento(
    seg_id: int,
    data: SeguimientoUpdate,
    db: Session = Depends(get_db),
    _=Depends(requerir_docente)
):
    seg = db.query(models.Seguimiento).filter(models.Seguimiento.id == seg_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Seguimiento no encontrado")
    if data.estado:
        seg.estado = data.estado
        if data.estado == "completado":
            seg.fecha_cierre = datetime.utcnow()
    if data.observaciones is not None:
        seg.observaciones = data.observaciones
    if data.compromisos is not None:
        seg.compromisos = data.compromisos
    db.commit()
    return {"mensaje": "Seguimiento actualizado"}
