from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import hashear_contrasena, requerir_coordinador, get_usuario_actual
from schemas import UsuarioCreate, UsuarioOut, DocentePendienteCreate
from typing import List

router = APIRouter(prefix="/api/docentes", tags=["docentes"])


@router.get("/", response_model=List[UsuarioOut])
def listar_docentes(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    return db.query(models.Usuario).filter(models.Usuario.activo == True).all()


@router.get("/pendientes")
def listar_pendientes_gestion(db: Session = Depends(get_db), _=Depends(requerir_coordinador)):
    """Cuentas precargadas por rector/coordinación que el docente aún no ha activado."""
    pendientes = db.query(models.Usuario).filter(
        models.Usuario.activo == False, models.Usuario.documento.is_(None)
    ).order_by(models.Usuario.sede, models.Usuario.apellidos).all()
    return [
        {"id": p.id, "nombres": p.nombres, "apellidos": p.apellidos, "sede": p.sede, "rol": p.rol}
        for p in pendientes
    ]


@router.post("/pendientes", status_code=201)
def crear_pendiente(data: DocentePendienteCreate, db: Session = Depends(get_db), _=Depends(requerir_coordinador)):
    """
    Precarga el nombre de un docente sin contraseña. El docente completa su propia
    activación (cédula + PIN) desde la pantalla de login — ver /api/auth/pendientes y /api/auth/activar.
    """
    nuevo = models.Usuario(
        nombres=data.nombres, apellidos=data.apellidos, sede=data.sede, rol=data.rol,
        documento=None, contrasena_hash=None, activo=False,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"id": nuevo.id, "nombres": nuevo.nombres, "apellidos": nuevo.apellidos, "sede": nuevo.sede, "rol": nuevo.rol}


@router.delete("/pendientes/{usuario_id}")
def eliminar_pendiente(usuario_id: int, db: Session = Depends(get_db), _=Depends(requerir_coordinador)):
    p = db.query(models.Usuario).filter(
        models.Usuario.id == usuario_id, models.Usuario.documento.is_(None)
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Cuenta pendiente no encontrada")
    db.delete(p)
    db.commit()
    return {"mensaje": "Cuenta pendiente eliminada"}


@router.post("/", response_model=UsuarioOut)
def crear_docente(data: UsuarioCreate, db: Session = Depends(get_db), _=Depends(requerir_coordinador)):
    if db.query(models.Usuario).filter(models.Usuario.documento == data.documento).first():
        raise HTTPException(status_code=400, detail="El documento ya está registrado")
    docente = models.Usuario(
        nombres=data.nombres,
        apellidos=data.apellidos,
        documento=data.documento,
        email=data.email,
        contrasena_hash=hashear_contrasena(data.contrasena),
        rol=data.rol,
        sede=data.sede,
    )
    db.add(docente)
    db.commit()
    db.refresh(docente)
    return docente


@router.put("/{docente_id}/desactivar")
def desactivar_docente(docente_id: int, db: Session = Depends(get_db), _=Depends(requerir_coordinador)):
    docente = db.query(models.Usuario).filter(models.Usuario.id == docente_id).first()
    if not docente:
        raise HTTPException(status_code=404, detail="Docente no encontrado")
    docente.activo = False
    db.commit()
    return {"mensaje": "Docente desactivado"}


@router.put("/{docente_id}/reset-clave")
def reset_clave(docente_id: int, nueva_clave: str, db: Session = Depends(get_db), _=Depends(requerir_coordinador)):
    docente = db.query(models.Usuario).filter(models.Usuario.id == docente_id).first()
    if not docente:
        raise HTTPException(status_code=404, detail="Docente no encontrado")
    docente.contrasena_hash = hashear_contrasena(nueva_clave)
    db.commit()
    return {"mensaje": "Contraseña actualizada"}
