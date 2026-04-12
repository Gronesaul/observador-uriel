"""
Motor de Protocolo — ObservadorUriel
Basado en: Decreto 1965/2013, Ley 1620/2013, Manual de Convivencia IERD Uriel Murcia 2026

IMPORTANTE: Distingue entre dos tracks independientes:
  - SITUACIONES (tipo_registro="situacion"): conflictos de convivencia según Decreto 1965/2013
  - FALTAS AL MANUAL (tipo_registro="falta"): infracciones a las normas internas del colegio
"""

PROTOCOLOS = {
    # ── TRACK SITUACIONES (Decreto 1965/2013) ─────────────────────────
    "llamado_atencion": {
        "codigo": "llamado_atencion",
        "titulo": "Llamado de Atención",
        "descripcion": "Diálogo formativo con el estudiante. Registro en el Observador. Acta de compromiso personal.",
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
        "descripcion": "Activar el Comité de Convivencia (Ley 1620/2013). Convocar a todas las partes. Construir plan de acción con seguimiento y plazos.",
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
        "base_legal": "Código de Infancia – Ley 1098/2006 / Ley 1620/2013 Art. 29",
        "color": "rojo_oscuro",
        "urgencia": 5,
    },
    # ── TRACK FALTAS AL MANUAL ────────────────────────────────────────
    "amonestacion_verbal": {
        "codigo": "amonestacion_verbal",
        "titulo": "Amonestación Verbal con Registro",
        "descripcion": "Llamado de atención verbal. Registro en el Observador. El docente informa al director de grupo. No requiere citar al acudiente en primera instancia.",
        "responsable": "Docente",
        "base_legal": "Manual de Convivencia IERD Uriel Murcia 2026 – Faltas Leves",
        "color": "amarillo_suave",
        "urgencia": 1,
    },
    "citacion_falta": {
        "codigo": "citacion_falta",
        "titulo": "Citación al Acudiente por Falta",
        "descripcion": "Reincidencia en faltas al Manual. Citar al acudiente. Firma de acta de compromisos. Si persiste, se remite al Comité de Convivencia.",
        "responsable": "Director de Grupo / Coordinación",
        "base_legal": "Manual de Convivencia IERD Uriel Murcia 2026 – Proceso Disciplinario",
        "color": "naranja",
        "urgencia": 2,
    },
    "proceso_disciplinario": {
        "codigo": "proceso_disciplinario",
        "titulo": "Apertura de Proceso Disciplinario",
        "descripcion": "Falta grave o reincidencia reiterada. Abrir proceso disciplinario formal. Comité de Convivencia define sanción según el Manual. Notificación escrita al acudiente.",
        "responsable": "Coordinación / Comité de Convivencia",
        "base_legal": "Manual de Convivencia IERD Uriel Murcia 2026 – Faltas Graves / Art. 43 D.1965",
        "color": "rojo_suave",
        "urgencia": 3,
    },
    "suspension_comite": {
        "codigo": "suspension_comite",
        "titulo": "Comité + Posible Matrícula Condicional",
        "descripcion": "Falta gravísima al Manual. Comité de Convivencia extraordinario. Puede implicar matrícula condicional, suspensión temporal o en casos extremos cancelación de matrícula, según el Manual.",
        "responsable": "Rector / Comité de Convivencia",
        "base_legal": "Manual de Convivencia IERD Uriel Murcia 2026 – Faltas Gravísimas / Decreto 1965 Art. 43",
        "color": "rojo",
        "urgencia": 4,
    },
}

# ── CATEGORÍAS POR TRACK ──────────────────────────────────────────────

CATEGORIAS_SITUACIONES = {
    "tipo1": [
        "Conflicto verbal leve entre estudiantes",
        "Irrespeto verbal esporádico a un compañero",
        "Exclusión o burla puntual",
        "Desacuerdo que altera el ambiente de aula",
        "Lenguaje ofensivo leve y aislado",
        "Otro conflicto Tipo I",
    ],
    "tipo2": [
        "Agresión verbal sostenida o intimidación",
        "Agresión física (empujones, golpes sin lesión grave)",
        "Daño intencional a bienes de un compañero",
        "Acoso entre pares en inicio (patrón de hostigamiento)",
        "Discriminación o trato degradante reiterado",
        "Grabación o difusión sin consentimiento",
        "Hurto comprobado dentro de la institución",
        "Inasistencias injustificadas reiteradas (más de 5 días)",
        "Reincidencia en situaciones Tipo I sin mejoría",
        "Otra situación Tipo II",
    ],
    "tipo3": [
        "Agresión física grave con lesiones",
        "Porte o uso de armas",
        "Consumo o tráfico de sustancias psicoactivas",
        "Abuso sexual o violencia de género",
        "Acoso escolar sistemático (bullying documentado)",
        "Ciberacoso o difusión de contenido íntimo",
        "Amenaza grave o extorsión",
        "Delito contra la propiedad (hurto mayor)",
        "Vulneración grave de derechos fundamentales",
        "Otra situación Tipo III (presunto delito)",
    ],
}

CATEGORIAS_FALTAS = {
    "leve": [
        "Uso inadecuado del uniforme",
        "Impuntualidad (llegada tarde)",
        "No traer materiales o agenda",
        "Uso de celular sin autorización",
        "Desorden o indisciplina en clase",
        "Lenguaje inadecuado leve y aislado",
        "Incumplimiento de tareas o compromisos académicos",
        "Juegos bruscos en descanso (sin lesión)",
        "Salir del salón sin permiso",
        "Otra falta leve al Manual",
    ],
    "grave": [
        "Irrespeto verbal a un docente o directivo",
        "Daño o deterioro de bienes institucionales",
        "Fraude académico (copia en evaluación, plagio)",
        "Reincidencia reiterada en faltas leves sin mejoría",
        "Falsificación de firma o documentos",
        "Salir de la institución sin autorización",
        "Incitar a otros estudiantes a la indisciplina",
        "Consumo de cigarrillo o alcohol en la institución",
        "Otra falta grave al Manual",
    ],
    "gravisima": [
        "Irrespeto grave o agresión a un docente / directivo",
        "Destrucción intencional de bienes institucionales",
        "Reincidencia en faltas graves sin ninguna mejoría",
        "Tráfico o distribución de sustancias dentro del colegio",
        "Amenaza a miembros de la comunidad educativa",
        "Actos que atenten contra la moral e imagen del colegio",
        "Otra falta gravísima al Manual",
    ],
}


def calcular_protocolo_situacion(tipo1: int, tipo2: int, tipo3: int, nueva_tipo: str) -> dict:
    """
    Protocolo para SITUACIONES según Decreto 1965/2013.
    Se basa en el historial previo de situaciones (no de faltas).
    """
    if nueva_tipo == "tipo3" or tipo3 > 0:
        if tipo3 >= 1 and nueva_tipo == "tipo3":
            return PROTOCOLOS["policia_infancia"]
        return PROTOCOLOS["ruta_atencion"]

    if tipo2 >= 2:
        return PROTOCOLOS["comite_convivencia"]
    if tipo2 == 1 and tipo1 >= 2:
        return PROTOCOLOS["comite_convivencia"]
    if tipo2 == 1:
        return PROTOCOLOS["citacion_padres"]
    if tipo1 >= 3:
        return PROTOCOLOS["citacion_padres"]
    if tipo1 >= 1:
        return PROTOCOLOS["llamado_atencion"]

    return PROTOCOLOS["llamado_atencion"]


def calcular_protocolo_falta(leves: int, graves: int, gravisimas: int, nueva_tipo: str) -> dict:
    """
    Protocolo para FALTAS AL MANUAL de Convivencia.
    Proceso disciplinario interno según el Manual IERD Uriel Murcia 2026.
    """
    if nueva_tipo == "gravisima" or gravisimas > 0:
        return PROTOCOLOS["suspension_comite"]

    if nueva_tipo == "grave":
        if graves >= 1:
            return PROTOCOLOS["proceso_disciplinario"]
        return PROTOCOLOS["citacion_falta"]

    # Faltas leves
    if leves >= 4:
        return PROTOCOLOS["proceso_disciplinario"]
    if leves >= 2:
        return PROTOCOLOS["citacion_falta"]

    return PROTOCOLOS["amonestacion_verbal"]


def calcular_protocolo(tipo1: int, tipo2: int, tipo3: int, nueva_tipo: str,
                        tipo_registro: str = "situacion",
                        leves: int = 0, graves: int = 0, gravisimas: int = 0) -> dict:
    """
    Punto de entrada unificado. Despacha al motor correcto según tipo_registro.
    Mantiene retrocompatibilidad con código existente (tipo_registro default = "situacion").
    """
    if tipo_registro == "falta":
        return calcular_protocolo_falta(leves, graves, gravisimas, nueva_tipo)
    else:
        return calcular_protocolo_situacion(tipo1, tipo2, tipo3, nueva_tipo)


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
    tipo_registro: str = "situacion",
) -> str:
    """Genera URL de WhatsApp con mensaje pre-escrito para el acudiente."""

    if tipo_registro == "falta":
        tipo_texto = {
            "leve":      "Falta Leve al Manual",
            "grave":     "Falta Grave al Manual",
            "gravisima": "Falta Gravísima al Manual",
        }.get(tipo_falta, tipo_falta)
        intro = "ha cometido una falta disciplinaria registrada en el Observador Escolar"
    else:
        tipo_texto = {
            "tipo1": "Situación Tipo I (Leve)",
            "tipo2": "Situación Tipo II (Grave)",
            "tipo3": "Situación Tipo III (Gravísima)",
        }.get(tipo_falta, tipo_falta)
        intro = "ha sido reportado/a en una situación de convivencia registrada en el Observador Escolar"

    mensaje = (
        f"Estimado/a {nombre_acudiente}, le informamos que su acudido/a "
        f"*{nombre_estudiante}* {intro} "
        f"el día {fecha}.\n\n"
        f"📋 *Clasificación:* {tipo_texto}\n"
        f"📌 *Categoría:* {categoria}\n"
        f"📝 *Descripción:* {descripcion}\n\n"
        f"⚖️ *Paso a seguir:* {protocolo_titulo}\n\n"
        f"Por favor comuníquese con la institución para mayor información.\n"
        f"*IERD Uriel Murcia — Yacopí, Cundinamarca*\n"
        f"📞 314 440 5106"
    )

    import urllib.parse
    msg_encoded = urllib.parse.quote(mensaje)
    tel_clean = telefono.replace("+", "").replace(" ", "").replace("-", "")
    if not tel_clean.startswith("57"):
        tel_clean = "57" + tel_clean

    return f"https://wa.me/{tel_clean}?text={msg_encoded}"
