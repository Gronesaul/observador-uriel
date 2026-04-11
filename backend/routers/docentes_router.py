from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import hashear_contrasena, requerir_coordinador, get_usuario_actual
from schemas import UsuarioCreate, UsuarioOut
from typing import List

router = APIRouter(prefix="/api/docentes", tags=["docentes"])


@router.get("/", response_model=List[UsuarioOut])
def listar_docentes(db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    return db.query(models.Usuario).filter(models.Usuario.activo == True).all()


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
