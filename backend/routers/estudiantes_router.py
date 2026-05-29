from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_usuario_actual, requerir_docente
from schemas import EstudianteOut, EstudianteCreate, EstudianteUpdate, FichaEstudianteOut, AnotacionOut, SeguimientoOut
from protocolo import calcular_protocolo, generar_mensaje_whatsapp
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/estudiantes", tags=["estudiantes"])


@router.post("/", response_model=EstudianteOut, status_code=201)
def crear_estudiante(
    data: EstudianteCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requerir_docente)
):
    """Crea un nuevo estudiante. Requiere rol docente, coordinador, rector o admin."""
    # Verificar que el documento no esté duplicado
    existente = db.query(models.Estudiante).filter(models.Estudiante.documento == data.documento).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un estudiante con ese número de documento")

    nuevo = models.Estudiante(
        nombres=data.nombres,
        apellidos=data.apellidos,
        documento=data.documento,
        sede=data.sede,
        grado=data.grado,
        grupo=data.grupo,
        edad=data.edad,
        genero=data.genero,
        nombre_acudiente=data.nombre_acudiente,
        telefono_acudiente=data.telefono_acudiente,
        activo=True,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=List[EstudianteOut])
def listar_estudiantes(
    sede: Optional[str] = None,
    grado: Optional[str] = None,
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_usuario_actual)
):
    q = db.query(models.Estudiante).filter(models.Estudiante.activo == True)
    if sede:
        q = q.filter(models.Estudiante.sede.ilike(f"%{sede}%"))
    if grado:
        q = q.filter(models.Estudiante.grado == grado)
    if buscar:
        term = f"%{buscar}%"
        q = q.filter(
            (models.Estudiante.nombres.ilike(term)) |
            (models.Estudiante.apellidos.ilike(term)) |
            (models.Estudiante.documento.ilike(term))
        )
    return q.order_by(models.Estudiante.apellidos).all()


@router.get("/sedes")
def listar_sedes(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    sedes = db.query(models.Estudiante.sede).distinct().all()
    return sorted([s[0] for s in sedes if s[0]])


@router.get("/grados")
def listar_grados(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    orden = ["GRADO 0", "PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO",
             "SEXTO", "SEPTIMO", "OCTAVO", "NOVENO", "DÉCIMO", "ONCE"]
    grados = db.query(models.Estudiante.grado).distinct().all()
    resultado = [g[0] for g in grados if g[0]]
    resultado.sort(key=lambda x: orden.index(x) if x in orden else 99)
    return resultado


@router.get("/{estudiante_id}", response_model=FichaEstudianteOut)
def ficha_estudiante(estudiante_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    est = db.query(models.Estudiante).filter(models.Estudiante.id == estudiante_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    anotaciones = (
        db.query(models.Anotacion)
        .filter(models.Anotacion.estudiante_id == estudiante_id)
        .order_by(models.Anotacion.fecha_anotacion.desc())
        .all()
    )

    seguimientos = (
        db.query(models.Seguimiento)
        .filter(models.Seguimiento.estudiante_id == estudiante_id)
        .order_by(models.Seguimiento.fecha_apertura.desc())
        .all()
    )

    t1 = sum(1 for a in anotaciones if a.tipo_falta == "tipo1")
    t2 = sum(1 for a in anotaciones if a.tipo_falta == "tipo2")
    t3 = sum(1 for a in anotaciones if a.tipo_falta == "tipo3")

    protocolo_actual = None
    if anotaciones:
        ultima = anotaciones[0]
        protocolo_actual = calcular_protocolo(t1, t2, t3, ultima.tipo_falta)

    # WhatsApp URL si hay teléfono y anotaciones
    whatsapp_url = None
    if est.telefono_acudiente and anotaciones:
        a = anotaciones[0]
        whatsapp_url = generar_mensaje_whatsapp(
            nombre_acudiente=est.nombre_acudiente or "Acudiente",
            nombre_estudiante=f"{est.nombres} {est.apellidos}",
            tipo_falta=a.tipo_falta,
            categoria=a.categoria or "",
            descripcion=a.descripcion,
            protocolo_titulo=protocolo_actual["titulo"] if protocolo_actual else "",
            nombre_docente="",
            fecha=a.fecha_anotacion.strftime("%d/%m/%Y"),
            telefono=est.telefono_acudiente,
        )

    anot_out = []
    for a in anotaciones:
        ao = AnotacionOut(
            id=a.id, estudiante_id=a.estudiante_id, docente_id=a.docente_id,
            tipo_falta=a.tipo_falta, categoria=a.categoria,
            descripcion=a.descripcion, acciones_inmediatas=a.acciones_inmediatas,
            sede_origen=a.sede_origen, fecha_anotacion=a.fecha_anotacion,
            protocolo_sugerido=a.protocolo_sugerido,
            protocolo_descripcion=a.protocolo_descripcion,
            notificado_acudiente=a.notificado_acudiente,
            fecha_notificacion=a.fecha_notificacion,
            docente=a.docente,
        )
        anot_out.append(ao)

    seg_out = [SeguimientoOut(
        id=s.id, estudiante_id=s.estudiante_id, anotacion_id=s.anotacion_id,
        tipo_accion=s.tipo_accion, estado=s.estado,
        observaciones=s.observaciones, compromisos=s.compromisos,
        fecha_apertura=s.fecha_apertura, fecha_cierre=s.fecha_cierre
    ) for s in seguimientos]

    est_out = EstudianteOut(
        id=est.id, nombres=est.nombres, apellidos=est.apellidos,
        documento=est.documento, sede=est.sede, grado=est.grado,
        grupo=est.grupo, edad=est.edad, genero=est.genero,
        nombre_acudiente=est.nombre_acudiente,
        telefono_acudiente=est.telefono_acudiente, activo=est.activo
    )

    return FichaEstudianteOut(
        estudiante=est_out,
        anotaciones=anot_out,
        seguimientos=seg_out,
        resumen={"tipo1": t1, "tipo2": t2, "tipo3": t3, "total": t1 + t2 + t3, "protocolo_actual": protocolo_actual},
        whatsapp_url=whatsapp_url,
    )


@router.put("/{estudiante_id}/acudiente")
def actualizar_acudiente(
    estudiante_id: int,
    data: EstudianteUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_usuario_actual)
):
    est = db.query(models.Estudiante).filter(models.Estudiante.id == estudiante_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    if data.nombre_acudiente is not None:
        est.nombre_acudiente = data.nombre_acudiente
    if data.telefono_acudiente is not None:
        est.telefono_acudiente = data.telefono_acudiente
    db.commit()
    return {"mensaje": "Datos del acudiente actualizados"}
