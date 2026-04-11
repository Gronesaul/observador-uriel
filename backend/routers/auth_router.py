from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import verificar_contrasena, crear_token, get_usuario_actual

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.documento == form.username
    ).first()

    if not usuario or not verificar_contrasena(form.password, usuario.contrasena_hash):
        raise HTTPException(status_code=401, detail="Documento o contraseña incorrectos")

    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    token = crear_token({"sub": usuario.documento})
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": {
            "id": usuario.id,
            "nombres": usuario.nombres,
            "apellidos": usuario.apellidos,
            "documento": usuario.documento,
            "rol": usuario.rol,
            "sede": usuario.sede,
        }
    }


@router.get("/me")
def me(usuario=Depends(get_usuario_actual)):
    return {
        "id": usuario.id,
        "nombres": usuario.nombres,
        "apellidos": usuario.apellidos,
        "documento": usuario.documento,
        "rol": usuario.rol,
        "sede": usuario.sede,
    }
