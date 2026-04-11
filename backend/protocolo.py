"""
Motor de Protocolo — ObservadorUriel
Basado en: Decreto 1965/2013, Ley 1620/2013, Manual de Convivencia IERD Uriel Murcia 2026
"""

PROTOCOLOS = {
    "llamado_atencion": {
        "codigo": "llamado_atencion",
        "titulo": "Llamado de Atención",
        "descripcion": "Diálogo formativo con el estudiante. Registro en el Observador. Acta de compromiso.",
        "responsable": "Docente / Director de Grupo",
        "base_legal": "Decreto 1965/2013 – Situación Tipo I",
        "color": "amarillo",
        "urgencia": 1,
    },
    "citacion_padres": {
        "codigo": "citacion_padres",
        "titulo": "Citación al Acudiente",
        "descripcion": "Citar formalmente al padre, madre o acudiente. Reunión con director de grupo y/o coordinación. Firma de acta de compromisos.",
        "responsable": "Director de Grupo / Coordinación",
        "base_legal": "Decreto 1965/2013 – Art. 42 / Ley 1620 Art. 29",
        "color": "naranja",
        "urgencia": 2,
    },
    "comite_convivencia": {
        "codigo": "comite_convivencia",
        "titulo": "Comité Escolar de Convivencia",
        "descripcion": "Activar el Comité de Convivencia (Ley 1620/2013). Convocar a todas las partes. Construir plan de acción con seguimiento.",
        "responsable": "Rector / Coordinación / Comité",
        "base_legal": "Ley 1620/2013 – Art. 12 / Decreto 1965/2013 – Art. 43",
        "color": "rojo_suave",
        "urgencia": 3,
    },
    "ruta_atencion": {
        "codigo": "ruta_atencion",
        "titulo": "Ruta de Atención Integral",
        "descripcion": "Activar ruta integral: notificar a ICBF, Comisaría de Familia o Policía de Infancia y Adolescencia. Proteger al estudiante de forma inmediata.",
        "responsable": "Rector / Coordinación / Orientación",
        "base_legal": "Ley 1620/2013 – Art. 29 / Decreto 1965/2013 – Art. 44 / SNBF",
        "color": "rojo",
        "urgencia": 4,
    },
    "policia_infancia": {
        "codigo": "policia_infancia",
        "titulo": "Policía de Infancia y Adolescencia",
        "descripcion": "Situación constitutiva de presunto delito. Reportar de inmediato a la Policía de Infancia y Adolescencia y a la Fiscalía si aplica.",
        "responsable": "Rector",
        "base_legal": "Código de Infancia y Adolescencia – Ley 1098/2006 / Ley 1620/2013 Art. 29",
        "color": "rojo_oscuro",
        "urgencia": 5,
    },
}

CATEGORIAS_FALTA = {
    "tipo1": [
        "Incumplimiento de uniforme",
        "Llegada tarde reiterada",
        "Uso de celular sin autorización",
        "Desorden en el aula",
        "Lenguaje inapropiado leve",
        "Incumplimiento de tareas reiterado",
        "Conflicto verbal leve entre estudiantes",
        "Irrespeto leve a un compañero",
        "Daño menor a materiales",
        "Otra situación Tipo I",
    ],
    "tipo2": [
        "Agresión verbal grave o intimidación",
        "Agresión física menor",
        "Daño intencional a bienes ajenos o institucionales",
        "Grabación sin consentimiento",
        "Inasistencias injustificadas reiteradas (>5 días)",
        "Reincidencia en faltas Tipo I",
        "Discriminación o trato degradante",
        "Hurto menor",
        "Acoso entre pares (inicio)",
        "Otra situación Tipo II",
    ],
    "tipo3": [
        "Agresión física grave con lesiones",
        "Porte o tráfico de armas",
        "Consumo o tráfico de sustancias psicoactivas",
        "Abuso sexual o violencia sexual",
        "Acoso escolar sistemático (bullying)",
        "Ciberacoso o difusión de contenido íntimo",
        "Amenaza grave o extorsión",
        "Vulneración grave de derechos fundamentales",
        "Delito contra la propiedad (hurto mayor)",
        "Otra situación Tipo III (presunto delito)",
    ],
}


def calcular_protocolo(tipo1: int, tipo2: int, tipo3: int, nueva_tipo: str) -> dict:
    """
    Calcula el protocolo de atención según el historial de anotaciones.
    Retorna el protocolo sugerido con su descripción completa.
    """
    # Cualquier Tipo III → Ruta integral inmediata
    if nueva_tipo == "tipo3" or tipo3 > 0:
        if tipo3 >= 1 and nueva_tipo == "tipo3":
            return PROTOCOLOS["policia_infancia"]
        return PROTOCOLOS["ruta_atencion"]

    # Acumulación grave
    if tipo2 >= 2:
        return PROTOCOLOS["comite_convivencia"]

    if tipo2 == 1 and tipo1 >= 2:
        return PROTOCOLOS["comite_convivencia"]

    if tipo2 == 1:
        return PROTOCOLOS["citacion_padres"]

    if tipo1 >= 3:
        return PROTOCOLOS["citacion_padres"]

    if tipo1 >= 2:
        return PROTOCOLOS["citacion_padres"]

    # Primera falta tipo 1
    return PROTOCOLOS["llamado_atencion"]


def generar_mensaje_whatsapp(
    nombre_acudiente: str,
    nombre_estudiante: str,
    tipo_falta: str,
    categoria: str,
    descripcion: str,
    protocolo_titulo: str,
    nombre_docente: str,
    fecha: str,
    telefono: str,
) -> str:
    """Genera URL de WhatsApp con mensaje pre-escrito para el acudiente."""
    tipo_texto = {"tipo1": "Tipo I (Leve)", "tipo2": "Tipo II (Grave)", "tipo3": "Tipo III (Gravísima)"}.get(tipo_falta, tipo_falta)

    mensaje = (
        f"Estimado/a {nombre_acudiente}, le informamos que su acudido/a "
        f"*{nombre_estudiante}* ha recibido una anotación en el Observador Escolar "
        f"el día {fecha}.\n\n"
        f"📋 *Tipo de situación:* {tipo_texto}\n"
        f"📌 *Categoría:* {categoria}\n"
        f"📝 *Descripción:* {descripcion}\n\n"
        f"⚖️ *Paso a seguir:* {protocolo_titulo}\n\n"
        f"Por favor comuníquese con la institución.\n"
        f"*IERD Uriel Murcia — Yacopí, Cundinamarca*\n"
        f"📞 314 440 5106"
    )

    import urllib.parse
    msg_encoded = urllib.parse.quote(mensaje)
    tel_clean = telefono.replace("+", "").replace(" ", "").replace("-", "")
    if not tel_clean.startswith("57"):
        tel_clean = "57" + tel_clean

    return f"https://wa.me/{tel_clean}?text={msg_encoded}"
