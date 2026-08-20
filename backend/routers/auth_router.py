from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import verificar_contrasena, hashear_contrasena, crear_token, get_usuario_actual
from schemas import ActivarCuentaRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.documento == form.username
    ).first()

    if not usuario or not usuario.contrasena_hash or not verificar_contrasena(form.password, usuario.contrasena_hash):
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


# ── ACTIVACIÓN DE CUENTA (autoservicio del docente) ────────────────────
# El rector/coordinación precarga el nombre (sin clave) desde Gestión de Docentes.
# El propio docente entra a la pantalla de login, elige su nombre, pone su cédula
# y crea su PIN. Estos endpoints son públicos a propósito: solo exponen nombres,
# nunca datos sensibles, y no permiten iniciar sesión hasta completar la activación.

@router.get("/sedes-pendientes")
def sedes_con_pendientes(db: Session = Depends(get_db)):
    sedes = db.query(models.Usuario.sede).filter(
        models.Usuario.activo == False, models.Usuario.documento.is_(None)
    ).distinct().all()
    return sorted([s[0] for s in sedes if s[0]])


@router.get("/pendientes")
def listar_pendientes_publico(sede: str, db: Session = Depends(get_db)):
    pendientes = db.query(models.Usuario).filter(
        models.Usuario.activo == False,
        models.Usuario.documento.is_(None),
        models.Usuario.sede == sede,
    ).order_by(models.Usuario.apellidos).all()
    return [{"id": p.id, "nombres": p.nombres, "apellidos": p.apellidos} for p in pendientes]


@router.post("/activar")
def activar_cuenta(data: ActivarCuentaRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.id == data.usuario_id,
        models.Usuario.activo == False,
        models.Usuario.documento.is_(None),
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Esa cuenta no existe o ya fue activada")

    documento = data.documento.strip()
    if not documento or len(documento) < 4:
        raise HTTPException(status_code=400, detail="Ingresa tu número de documento completo")
    if not data.pin.isdigit() or not (4 <= len(data.pin) <= 6):
        raise HTTPException(status_code=400, detail="El PIN debe tener entre 4 y 6 números")
    if db.query(models.Usuario).filter(models.Usuario.documento == documento).first():
        raise HTTPException(status_code=400, detail="Ese número de documento ya está registrado en el sistema")

    usuario.documento = documento
    usuario.contrasena_hash = hashear_contrasena(data.pin)
    usuario.activo = True
    db.commit()
    return {"mensaje": f"Cuenta activada. Ya puedes iniciar sesión con tu documento y tu PIN.", "documento": documento}
