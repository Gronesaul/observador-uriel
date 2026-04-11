from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── AUTH ──────────────────────────────────────────────
class LoginRequest(BaseModel):
    documento: str
    contrasena: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    usuario: dict


# ── USUARIO ───────────────────────────────────────────
class UsuarioCreate(BaseModel):
    nombres: str
    apellidos: str
    documento: str
    email: Optional[str] = None
    contrasena: str
    rol: str = "docente"
    sede: Optional[str] = None


class UsuarioOut(BaseModel):
    id: int
    nombres: str
    apellidos: str
    documento: str
    email: Optional[str]
    rol: str
    sede: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


# ── ESTUDIANTE ────────────────────────────────────────
class EstudianteOut(BaseModel):
    id: int
    nombres: str
    apellidos: str
    documento: str
    sede: str
    grado: Optional[str]
    grupo: Optional[str]
    edad: Optional[int]
    genero: Optional[str]
    nombre_acudiente: Optional[str]
    telefono_acudiente: Optional[str]
    activo: bool

    class Config:
        from_attributes = True


class EstudianteUpdate(BaseModel):
    nombre_acudiente: Optional[str] = None
    telefono_acudiente: Optional[str] = None


# ── ANOTACION ─────────────────────────────────────────
class AnotacionCreate(BaseModel):
    estudiante_id: int
    tipo_falta: str        # "tipo1" | "tipo2" | "tipo3"
    categoria: Optional[str] = None
    descripcion: str
    acciones_inmediatas: Optional[str] = None


class AnotacionOut(BaseModel):
    id: int
    estudiante_id: int
    docente_id: int
    tipo_falta: str
    categoria: Optional[str]
    descripcion: str
    acciones_inmediatas: Optional[str]
    sede_origen: Optional[str]
    fecha_anotacion: datetime
    protocolo_sugerido: Optional[str]
    protocolo_descripcion: Optional[str]
    notificado_acudiente: bool
    fecha_notificacion: Optional[datetime]
    docente: Optional[UsuarioOut]
    whatsapp_url: Optional[str] = None

    class Config:
        from_attributes = True


# ── SEGUIMIENTO ───────────────────────────────────────
class SeguimientoCreate(BaseModel):
    estudiante_id: int
    anotacion_id: Optional[int] = None
    tipo_accion: str
    observaciones: Optional[str] = None
    compromisos: Optional[str] = None


class SeguimientoUpdate(BaseModel):
    estado: Optional[str] = None
    observaciones: Optional[str] = None
    compromisos: Optional[str] = None


class SeguimientoOut(BaseModel):
    id: int
    estudiante_id: int
    anotacion_id: Optional[int]
    tipo_accion: str
    estado: str
    observaciones: Optional[str]
    compromisos: Optional[str]
    fecha_apertura: datetime
    fecha_cierre: Optional[datetime]

    class Config:
        from_attributes = True


# ── FICHA COMPLETA DEL ESTUDIANTE ─────────────────────
class FichaEstudianteOut(BaseModel):
    estudiante: EstudianteOut
    anotaciones: List[AnotacionOut]
    seguimientos: List[SeguimientoOut]
    resumen: dict          # {tipo1: n, tipo2: n, tipo3: n, total: n, protocolo_actual: {...}}
    whatsapp_url: Optional[str] = None
