from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Usuario(Base):
    """Docentes, coordinadores y admin que usan el sistema."""
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    documento = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    contrasena_hash = Column(String, nullable=False)
    rol = Column(String, default="docente")       # "docente" | "coordinador" | "admin"
    sede = Column(String, nullable=True)           # Sede asignada del docente
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    anotaciones = relationship("Anotacion", back_populates="docente")


class Estudiante(Base):
    """Todos los estudiantes matriculados en la IERD Uriel Murcia."""
    __tablename__ = "estudiantes"

    id = Column(Integer, primary_key=True, index=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    documento = Column(String, unique=True, index=True, nullable=False)
    sede = Column(String, nullable=False)
    grado = Column(String, nullable=True)
    grupo = Column(String, nullable=True)
    edad = Column(Integer, nullable=True)
    genero = Column(String, nullable=True)
    nombre_acudiente = Column(String, nullable=True)
    telefono_acudiente = Column(String, nullable=True)  # Para WhatsApp
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    anotaciones = relationship("Anotacion", back_populates="estudiante")
    seguimientos = relationship("Seguimiento", back_populates="estudiante")


class Anotacion(Base):
    """Registro de situaciones en el Observador del Estudiante."""
    __tablename__ = "anotaciones"

    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    docente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    # Clasificación según Decreto 1965/2013
    tipo_falta = Column(String, nullable=False)   # "tipo1" | "tipo2" | "tipo3"
    categoria = Column(String, nullable=True)      # Subcategoría de la falta

    descripcion = Column(Text, nullable=False)
    acciones_inmediatas = Column(Text, nullable=True)
    sede_origen = Column(String, nullable=True)

    fecha_anotacion = Column(DateTime, default=datetime.utcnow)

    # Protocolo calculado automáticamente
    protocolo_sugerido = Column(String, nullable=True)
    protocolo_descripcion = Column(Text, nullable=True)

    # Notificación al acudiente
    notificado_acudiente = Column(Boolean, default=False)
    fecha_notificacion = Column(DateTime, nullable=True)

    estudiante = relationship("Estudiante", back_populates="anotaciones")
    docente = relationship("Usuario", back_populates="anotaciones")
    seguimiento = relationship("Seguimiento", back_populates="anotacion", uselist=False)


class Seguimiento(Base):
    """Registro de acciones del protocolo de atención."""
    __tablename__ = "seguimientos"

    id = Column(Integer, primary_key=True, index=True)
    estudiante_id = Column(Integer, ForeignKey("estudiantes.id"), nullable=False)
    anotacion_id = Column(Integer, ForeignKey("anotaciones.id"), nullable=True)

    tipo_accion = Column(String, nullable=False)
    # "llamado_atencion" | "citacion_padres" | "comite_convivencia"
    # "ruta_atencion" | "policia_infancia" | "icbf" | "comisaria_familia"

    estado = Column(String, default="pendiente")  # "pendiente" | "en_proceso" | "completado"
    observaciones = Column(Text, nullable=True)
    compromisos = Column(Text, nullable=True)

    fecha_apertura = Column(DateTime, default=datetime.utcnow)
    fecha_cierre = Column(DateTime, nullable=True)
    creado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    estudiante = relationship("Estudiante", back_populates="seguimientos")
    anotacion = relationship("Anotacion", back_populates="seguimiento")
    creado_por = relationship("Usuario")
