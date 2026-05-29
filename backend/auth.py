from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

import bcrypt as _bcrypt_module
if not hasattr(_bcrypt_module, '__about__'):
    _bcrypt_module.__about__ = type('obj', (object,), {'__version__': _bcrypt_module.__version__})()
_orig_hashpw = _bcrypt_module.hashpw
def _safe_hashpw(password, salt):
    if isinstance(password, (bytes, bytearray)) and len(password) > 72:
        password = password[:72]
    return _orig_hashpw(password, salt)
_bcrypt_module.hashpw = _safe_hashpw

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models, os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "observador-uriel-secret-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 480))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verificar_contrasena(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hashear_contrasena(password: str) -> str:
    return pwd_context.hash(password)


def crear_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autorizado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        documento: str = payload.get("sub")
        if documento is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    usuario = db.query(models.Usuario).filter(models.Usuario.documento == documento).first()
    if usuario is None or not usuario.activo:
        raise credentials_exception
    return usuario


def requerir_docente(usuario=Depends(get_usuario_actual)):
    if usuario.rol not in ["docente", "coordinador", "admin", "rector"]:
        raise HTTPException(status_code=403, detail="Se requiere rol de docente o superior")
    return usuario


def requerir_coordinador(usuario=Depends(get_usuario_actual)):
    if usuario.rol not in ["coordinador", "admin"]:
        raise HTTPException(status_code=403, detail="Se requiere rol de coordinador o admin")
    return usuario
