import base64
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_usuario_actual
from protocolo import calcular_protocolo, PROTOCOLOS

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable,
)

router = APIRouter(prefix="/api/pdf", tags=["pdf"])

VERDE_INSTITUCIONAL = colors.HexColor("#1f6f4a")
GRIS = colors.HexColor("#4b564c")

TIPO_TEXTO = {
    "tipo1": "Situación Tipo I (Leve) — Decreto 1965/2013",
    "tipo2": "Situación Tipo II (Grave) — Decreto 1965/2013",
    "tipo3": "Situación Tipo III (Gravísima) — Decreto 1965/2013",
    "leve": "Falta Leve al Manual de Convivencia",
    "grave": "Falta Grave al Manual de Convivencia",
    "gravisima": "Falta Gravísima al Manual de Convivencia",
}
AREA_TEXTO = {"academica": "Académico", "convivencia": "Convivencia"}


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="TituloInst", fontSize=14, leading=17, textColor=VERDE_INSTITUCIONAL,
                           fontName="Helvetica-Bold", spaceAfter=2))
    ss.add(ParagraphStyle(name="Subt", fontSize=9, textColor=GRIS, spaceAfter=10))
    ss.add(ParagraphStyle(name="H2", fontSize=11, textColor=VERDE_INSTITUCIONAL, fontName="Helvetica-Bold",
                           spaceBefore=14, spaceAfter=6))
    ss.add(ParagraphStyle(name="Cuerpo", fontSize=9.5, leading=13, textColor=colors.HexColor("#151b16")))
    ss.add(ParagraphStyle(name="Peque", fontSize=8, leading=11, textColor=GRIS))
    return ss


def _encabezado(story, ss, titulo):
    story.append(Paragraph("IERD Uriel Murcia — Yacopí, Cundinamarca", ss["TituloInst"]))
    story.append(Paragraph(titulo, ss["Subt"]))
    story.append(HRFlowable(width="100%", thickness=1, color=VERDE_INSTITUCIONAL, spaceAfter=10))


def _foto_flowable(foto_base64):
    if not foto_base64:
        return None
    try:
        if "," in foto_base64:
            foto_base64 = foto_base64.split(",", 1)[1]
        raw = base64.b64decode(foto_base64)
        img = Image(io.BytesIO(raw), width=2.6 * cm, height=2.6 * cm)
        return img
    except Exception:
        return None


@router.get("/estudiante/{estudiante_id}")
def pdf_observador_estudiante(estudiante_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    est = db.query(models.Estudiante).filter(models.Estudiante.id == estudiante_id).first()
    if not est:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")

    anotaciones = (
        db.query(models.Anotacion)
        .filter(models.Anotacion.estudiante_id == estudiante_id)
        .order_by(models.Anotacion.fecha_anotacion.asc())
        .all()
    )
    seguimientos = (
        db.query(models.Seguimiento)
        .filter(models.Seguimiento.estudiante_id == estudiante_id)
        .order_by(models.Seguimiento.fecha_apertura.asc())
        .all()
    )

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=1.6 * cm, bottomMargin=1.6 * cm,
                             leftMargin=1.8 * cm, rightMargin=1.8 * cm)
    ss = _styles()
    story = []
    _encabezado(story, ss, f"Observador del Estudiante — generado {datetime.utcnow().strftime('%d/%m/%Y')}")

    anio_actual = datetime.utcnow().year
    if est.anio_ingreso:
        antiguedad = "Nuevo (ingresó este año)" if est.anio_ingreso == anio_actual else f"Antiguo — desde {est.anio_ingreso}"
    else:
        antiguedad = "Antiguo — año de ingreso no registrado"

    datos = [
        ["Nombre completo", f"{est.nombres} {est.apellidos}"],
        ["Documento", est.documento],
        ["Sede", est.sede],
        ["Grado / Grupo", f"{est.grado or '—'} / {est.grupo or '—'}"],
        ["Edad", str(est.edad or "—")],
        ["Estudiante", antiguedad],
        ["Acudiente", est.nombre_acudiente or "No registrado"],
        ["Teléfono acudiente", est.telefono_acudiente or "No registrado"],
    ]
    tabla_datos = Table(datos, colWidths=[4.2 * cm, 9.5 * cm])
    tabla_datos.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), GRIS),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#d3ddd3")),
    ]))

    foto = _foto_flowable(est.foto_base64)
    if foto:
        cabecera = Table([[tabla_datos, foto]], colWidths=[13.7 * cm, 2.8 * cm])
        cabecera.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        story.append(cabecera)
    else:
        story.append(tabla_datos)

    t1 = sum(1 for a in anotaciones if a.tipo_falta == "tipo1")
    t2 = sum(1 for a in anotaciones if a.tipo_falta == "tipo2")
    t3 = sum(1 for a in anotaciones if a.tipo_falta == "tipo3")
    protocolo_actual = calcular_protocolo(t1, t2, t3, anotaciones[-1].tipo_falta) if anotaciones else None

    story.append(Paragraph("Resumen", ss["H2"]))
    resumen_txt = (
        f"Total de anotaciones: {len(anotaciones)} · Situaciones Tipo I: {t1} · Tipo II: {t2} · Tipo III: {t3}"
    )
    story.append(Paragraph(resumen_txt, ss["Cuerpo"]))
    if protocolo_actual:
        story.append(Paragraph(
            f"<b>Protocolo vigente:</b> {protocolo_actual['titulo']} — {protocolo_actual['base_legal']}",
            ss["Cuerpo"]))

    story.append(Paragraph("Historial de anotaciones", ss["H2"]))
    if not anotaciones:
        story.append(Paragraph("Sin anotaciones registradas.", ss["Cuerpo"]))
    else:
        filas = [["Fecha", "Clasificación", "Área", "Descripción de los hechos", "Docente"]]
        for a in anotaciones:
            filas.append([
                a.fecha_anotacion.strftime("%d/%m/%Y"),
                TIPO_TEXTO.get(a.tipo_falta, a.tipo_falta),
                AREA_TEXTO.get(a.area or "convivencia", "Convivencia"),
                Paragraph(a.descripcion, ss["Peque"]),
                f"{a.docente.nombres} {a.docente.apellidos}" if a.docente else "—",
            ])
        tabla_anot = Table(filas, colWidths=[2 * cm, 3.6 * cm, 2.1 * cm, 6.2 * cm, 2.6 * cm], repeatRows=1)
        tabla_anot.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), VERDE_INSTITUCIONAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d3ddd3")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(tabla_anot)

    story.append(Paragraph("Seguimientos", ss["H2"]))
    if not seguimientos:
        story.append(Paragraph("Sin seguimientos registrados.", ss["Cuerpo"]))
    else:
        filas_s = [["Apertura", "Acción", "Estado", "Compromisos"]]
        for s in seguimientos:
            filas_s.append([
                s.fecha_apertura.strftime("%d/%m/%Y"),
                PROTOCOLOS.get(s.tipo_accion, {}).get("titulo", s.tipo_accion),
                s.estado.replace("_", " ").title(),
                Paragraph(s.compromisos or "—", ss["Peque"]),
            ])
        tabla_seg = Table(filas_s, colWidths=[2.2 * cm, 4.2 * cm, 2.6 * cm, 7.5 * cm], repeatRows=1)
        tabla_seg.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf0ea")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d3ddd3")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(tabla_seg)

    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph(
        "Documento generado automáticamente por ObservadorUriel. No reemplaza el acta oficial firmada "
        "en los casos que la requieran según el Manual de Convivencia.", ss["Peque"]))

    doc.build(story)
    buf.seek(0)
    nombre_archivo = f"observador_{est.documento}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
                              headers={"Content-Disposition": f'inline; filename="{nombre_archivo}"'})


@router.get("/acta-comite/{seguimiento_id}")
def pdf_acta_comite(seguimiento_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_actual)):
    seg = db.query(models.Seguimiento).filter(models.Seguimiento.id == seguimiento_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Seguimiento no encontrado")
    est = db.query(models.Estudiante).filter(models.Estudiante.id == seg.estudiante_id).first()
    anot = db.query(models.Anotacion).filter(models.Anotacion.id == seg.anotacion_id).first() if seg.anotacion_id else None

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=1.8 * cm, bottomMargin=1.8 * cm,
                             leftMargin=2 * cm, rightMargin=2 * cm)
    ss = _styles()
    story = []
    _encabezado(story, ss, "Acta — Comité Escolar de Convivencia (Ley 1620/2013 · Decreto 1965/2013)")

    story.append(Paragraph(f"<b>Acta N.°</b> {seg.id:05d}", ss["Cuerpo"]))
    story.append(Paragraph(f"<b>Fecha de la sesión:</b> {datetime.utcnow().strftime('%d/%m/%Y')}", ss["Cuerpo"]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("1. Identificación del estudiante", ss["H2"]))
    datos = [
        ["Nombre completo", f"{est.nombres} {est.apellidos}" if est else "—"],
        ["Documento", est.documento if est else "—"],
        ["Sede", est.sede if est else "—"],
        ["Grado / Grupo", f"{est.grado or '—'} / {est.grupo or '—'}" if est else "—"],
        ["Acudiente", (est.nombre_acudiente or "No registrado") if est else "—"],
    ]
    tabla = Table(datos, colWidths=[4.5 * cm, 10 * cm])
    tabla.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#d3ddd3")),
    ]))
    story.append(tabla)

    story.append(Paragraph("2. Hechos que motivan el comité", ss["H2"]))
    if anot:
        story.append(Paragraph(
            f"<b>Clasificación:</b> {TIPO_TEXTO.get(anot.tipo_falta, anot.tipo_falta)} "
            f"({AREA_TEXTO.get(anot.area or 'convivencia', 'Convivencia')})", ss["Cuerpo"]))
        story.append(Paragraph(f"<b>Categoría:</b> {anot.categoria or 'Sin categoría'}", ss["Cuerpo"]))
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph("<b>Descripción de los hechos:</b>", ss["Cuerpo"]))
        story.append(Paragraph(anot.descripcion, ss["Cuerpo"]))
        if anot.acciones_inmediatas:
            story.append(Paragraph(f"<b>Acciones inmediatas tomadas:</b> {anot.acciones_inmediatas}", ss["Cuerpo"]))
    else:
        story.append(Paragraph("Sin anotación asociada a este seguimiento.", ss["Cuerpo"]))

    story.append(Paragraph("3. Protocolo activado", ss["H2"]))
    proto = PROTOCOLOS.get(seg.tipo_accion, {})
    story.append(Paragraph(f"<b>{proto.get('titulo', seg.tipo_accion)}</b> — {proto.get('base_legal', '')}", ss["Cuerpo"]))
    story.append(Paragraph(proto.get("descripcion", ""), ss["Cuerpo"]))

    story.append(Paragraph("4. Compromisos y plan de acción", ss["H2"]))
    story.append(Paragraph(seg.compromisos or "Por definir en la sesión del comité.", ss["Cuerpo"]))
    story.append(Paragraph(f"<b>Estado actual del seguimiento:</b> {seg.estado.replace('_', ' ').title()}", ss["Cuerpo"]))
    if seg.observaciones:
        story.append(Paragraph(f"<b>Observaciones:</b> {seg.observaciones}", ss["Cuerpo"]))

    story.append(Paragraph("5. Firmas", ss["H2"]))
    firmas = [
        ["_____________________________", "_____________________________"],
        ["Rector / Presidente del Comité", "Coordinación"],
        ["", ""],
        ["_____________________________", "_____________________________"],
        ["Docente / Director de Grupo", "Acudiente"],
    ]
    tabla_firmas = Table(firmas, colWidths=[7.25 * cm, 7.25 * cm])
    tabla_firmas.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(tabla_firmas)

    doc.build(story)
    buf.seek(0)
    nombre_archivo = f"acta_comite_{seg.id}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
                              headers={"Content-Disposition": f'inline; filename="{nombre_archivo}"'})
