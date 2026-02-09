from decimal import Decimal
from openpyxl.cell.cell import MergedCell
from openpyxl.styles import Alignment, Font
from openpyxl.worksheet.cell_range import CellRange
from .models import SalesProforma, PurchaseProforma
from .utils import (
    jalali_date,
    load_sales_proforma_template,
    party_name,
    party_national_code,
    rial_words,
    workbook_to_pdf_bytes,
)


# ── helpers ──────────────────────────────────────────────────────────────
_PERSIAN = "۰۱۲۳۴۵۶۷۸۹"
_ENGLISH = "0123456789"
_FA2EN = str.maketrans(_PERSIAN, _ENGLISH)


def _to_en(value) -> str:
    """Convert any Persian/Arabic digits in *value* to English (ASCII) digits."""
    if value is None:
        return ""
    return str(value).translate(_FA2EN)


def _clear_region(ws, min_row, max_row, min_col=1, max_col=15):
    """
    Prepare a region for fresh writes:
      1. Discard every merged-cell range whose min_row falls in [min_row, max_row].
      2. Replace stale ``MergedCell`` objects in the cell cache with real
         ``Cell`` objects so that subsequent writes don't crash.
    """
    # 1) Discard merge ranges
    to_remove = [
        CellRange(str(mr))
        for mr in ws.merged_cells.ranges
        if mr.min_row >= min_row and mr.min_row <= max_row
    ]
    for cr in to_remove:
        ws.merged_cells.ranges.discard(cr)

    # 2) Evict stale MergedCell objects from the cell cache
    for row in range(min_row, max_row + 1):
        for col in range(min_col, max_col + 1):
            obj = ws._cells.get((row, col))
            if obj is not None and isinstance(obj, MergedCell):
                del ws._cells[(row, col)]


# ── Style constants (matching the template) ──────────────────────────────
_FONT_DESC = Font(name="B Nazanin", size=11.5, bold=False)
_FONT_LABEL = Font(name="B Nazanin", size=14, bold=False)
_FONT_LABEL_BOLD = Font(name="B Nazanin", size=14, bold=True)

_ALIGN_DESC_LABEL = Alignment(horizontal="center", vertical="center")
_ALIGN_DESC_LINE = Alignment(
    horizontal="right", vertical="center",
    readingOrder=2, wrap_text=True,
)
_ALIGN_TOTAL_LABEL = Alignment(           # "مبلغ قابل پرداخت :"
    horizontal="right", vertical="center",
    readingOrder=2,
)
_ALIGN_CENTER = Alignment(horizontal="center", vertical="center")

# Row heights
_ROW_H_DESC = 30.0     # description row with content
_ROW_H_EMPTY = 3.0     # unused description row


def _render_proforma_pdf(proforma, kind: str) -> bytes:
    if not proforma.pk:
        raise ValueError("Proforma must be saved before export.")

    model = SalesProforma if kind == "sales" else PurchaseProforma
    party_attr_main = "customer" if kind == "sales" else "supplier"
    title_text = "پیش فاکتور فروش" if kind == "sales" else "پیش فاکتور خرید"

    proforma = (
        model.objects
        .select_related(party_attr_main, "export_preset")
        .prefetch_related("lines__product")
        .get(pk=proforma.pk)
    )

    wb, ws = load_sales_proforma_template()

    # ── Title (Row 3, F:J) ───────────────────────────────────────────────
    for col in range(3, 11):
        ws.cell(row=3, column=col).value = None

    ws.merge_cells("F3:J3")
    title_cell = ws["F3"]
    title_cell.value = title_text
    title_cell.alignment = Alignment(horizontal="center", vertical="center")

    party_main = getattr(proforma, party_attr_main)
    preset = proforma.export_preset

    # ── Header ───────────────────────────────────────────────────────────
    ws["N2"].value = _to_en(proforma.serial_number)
    ws["N3"].value = _to_en(jalali_date(proforma.date))

    ws.merge_cells("A5:O5")
    ws["A5"].value = "مشخصات فروشنده" if kind == "sales" else "مشخصات خریدار"
    ws["A5"].alignment = Alignment(horizontal="center", vertical="center")

    ws.merge_cells("A14:O14")
    ws["A14"].value = "مشخصات خریدار" if kind == "sales" else "مشخصات تامین کننده"
    ws["A14"].alignment = Alignment(horizontal="center", vertical="center")

    # ── Party details ────────────────────────────────────────────────────
    ws["C16"].value = _to_en(party_name(party_main))
    ws["I16"].value = _to_en(party_national_code(party_main))
    ws["M16"].value = _to_en(getattr(party_main, "economic_code", "") or "")
    ws["C18"].value = _to_en(getattr(party_main, "postal_code", "") or "")
    ws["I18"].value = _to_en(getattr(party_main, "phone", "") or "")
    ws["C20"].value = _to_en(getattr(party_main, "address", "") or "")

    # ── Line items ───────────────────────────────────────────────────────
    start_row = 24
    subtotal = Decimal(0)

    for idx, line in enumerate(proforma.lines.all()):
        row = start_row + idx

        weight = Decimal(line.weight or 0)
        unit_price = Decimal(line.unit_price or 0)
        tax = Decimal(line.tax or 0)
        discount = Decimal(line.discount or 0)

        line_subtotal = weight * unit_price
        line_total = line_subtotal * (Decimal(1) + tax - discount)

        ws[f"B{row}"].value = _to_en(getattr(line.product, "name", "") or "")
        ws[f"F{row}"].value = weight
        ws[f"H{row}"].value = unit_price
        ws[f"K{row}"].value = tax
        ws[f"L{row}"].value = discount
        ws[f"I{row}"].value = line_subtotal
        ws[f"N{row}"].value = line_total

        for col in ("F", "H", "K", "L", "I", "N"):
            ws[f"{col}{row}"].number_format = "0.####"

        subtotal += line_total

    # ── Totals calculation ───────────────────────────────────────────────
    total_payable = (
        subtotal
        * (Decimal(1)
           - Decimal(proforma.discount or 0)
           + Decimal(proforma.tax or 0)
           + Decimal(proforma.shipping_cost or 0)
           + Decimal(proforma.commission or 0)
           + Decimal(proforma.other_cost or 0))
    )

    ws["N26"].value = Decimal(proforma.shipping_cost or 0)
    ws["N27"].value = Decimal(proforma.commission or 0)
    ws["N28"].value = Decimal(proforma.discount or 0)
    ws["N29"].value = Decimal(proforma.tax or 0)
    ws["N30"].value = Decimal(proforma.other_cost or 0)

    for c in ("N26", "N27", "N28", "N29", "N30"):
        ws[c].number_format = "0.####"

    if preset:
        ws["A27"].value = _to_en(
            f"حساب بانک {preset.bank_name}:           {preset.account_number}"
        )
        ws["H27"].value = _to_en(preset.sheba_number)


    desc_start = 29
    template_desc_rows = 4 
    extra = 0
    right_lines = []
    left_lines = []

    if preset and preset.description:
        all_lines = [l.strip() for l in preset.description.splitlines() if l.strip()]
        mid = (len(all_lines) + 1) // 2
        right_lines = all_lines[:mid]
        left_lines = all_lines[mid:]

    max_lines = max(len(right_lines), len(left_lines))
    total_desc_rows = max(max_lines, template_desc_rows)
    extra = max(total_desc_rows - template_desc_rows, 0)

    last_affected_row = 36 + extra 
# ... inside _render_proforma_pdf ...

    # 1. Update the first clear_region call (~line 205)
    # Restrict max_col to 11 to preserve columns 12-15 (L-O) where the totals sit.
    # ... inside _render_proforma_pdf ...

    # 1. Update the first clear_region call (~line 205)
    # Restrict max_col to 11 to preserve columns 12-15 (L-O) where the totals sit.
    _clear_region(ws, 29, last_affected_row + 2, max_col=11) 

    if extra > 0:
        ws.insert_rows(33, amount=extra)
        # 2. Update the second clear_region call (~line 209)
        _clear_region(ws, 33, last_affected_row + 2, max_col=11)

    desc_end = desc_start + total_desc_rows - 1

    for i in range(total_desc_rows):
        row = desc_start + i
        if i < max_lines:
            ws.row_dimensions[row].height = _ROW_H_DESC
        else:
            ws.row_dimensions[row].height = _ROW_H_EMPTY

    ws.merge_cells(
        start_row=desc_start, start_column=1,
        end_row=desc_end, end_column=2,
    )
    cell = ws.cell(row=desc_start, column=1)
    cell.value = "  :توضیحات"
    cell.alignment = _ALIGN_DESC_LABEL
    cell.font = _FONT_LABEL

    for i in range(total_desc_rows):
        row = desc_start + i

        ws.merge_cells(start_row=row, start_column=3, end_row=row, end_column=7)
        cell = ws.cell(row=row, column=3)
        cell.value = _to_en(right_lines[i]) if i < len(right_lines) else ""
        cell.alignment = _ALIGN_DESC_LINE
        cell.font = _FONT_DESC

        ws.merge_cells(start_row=row, start_column=8, end_row=row, end_column=11)
        cell = ws.cell(row=row, column=8)
        cell.value = _to_en(left_lines[i]) if i < len(left_lines) else ""
        cell.alignment = _ALIGN_DESC_LINE
        cell.font = _FONT_DESC

    for r in range(29, desc_end + 1):
        ws.merge_cells(start_row=r, start_column=12, end_row=r, end_column=13)
        ws.merge_cells(start_row=r, start_column=14, end_row=r, end_column=15)

    totals_row = 33 + extra

    ws.merge_cells(
        start_row=totals_row, start_column=1,
        end_row=totals_row, end_column=7,
    )
    cell = ws.cell(row=totals_row, column=1)
    cell.value = "مبلغ قابل پرداخت :"
    cell.alignment = _ALIGN_TOTAL_LABEL
    cell.font = _FONT_LABEL_BOLD

    ws.merge_cells(
        start_row=totals_row, start_column=8,
        end_row=totals_row, end_column=11,
    )
    cell = ws.cell(row=totals_row, column=8)
    cell.value = _to_en(rial_words(total_payable))
    cell.alignment = _ALIGN_CENTER
    cell.font = _FONT_LABEL_BOLD

    ws.merge_cells(
        start_row=totals_row, start_column=12,
        end_row=totals_row, end_column=13,
    )
    cell = ws.cell(row=totals_row, column=12)
    cell.value = "جمع کل"
    cell.alignment = _ALIGN_CENTER
    cell.font = _FONT_LABEL

    ws.merge_cells(
        start_row=totals_row, start_column=14,
        end_row=totals_row, end_column=15,
    )
    cell = ws.cell(row=totals_row, column=14)
    cell.value = total_payable
    cell.number_format = "0.####"
    cell.alignment = _ALIGN_CENTER
    cell.font = _FONT_LABEL_BOLD

    sig1 = 35 + extra
    sig2 = 36 + extra

    ws.merge_cells(start_row=sig1, start_column=4, end_row=sig1, end_column=5)
    cell = ws.cell(row=sig1, column=4)
    cell.value = "فروشنده"
    cell.alignment = _ALIGN_CENTER
    cell.font = _FONT_LABEL_BOLD

    ws.merge_cells(start_row=sig1, start_column=12, end_row=sig1, end_column=13)
    cell = ws.cell(row=sig1, column=12)
    cell.value = "خریدار"
    cell.alignment = _ALIGN_CENTER
    cell.font = _FONT_LABEL_BOLD

    ws.merge_cells(start_row=sig2, start_column=4, end_row=sig2, end_column=5)
    cell = ws.cell(row=sig2, column=4)
    cell.value = "مهر و امضا"
    cell.alignment = _ALIGN_CENTER
    cell.font = _FONT_LABEL_BOLD

    ws.merge_cells(start_row=sig2, start_column=12, end_row=sig2, end_column=13)
    cell = ws.cell(row=sig2, column=12)
    cell.value = "مهر و امضا"
    cell.alignment = _ALIGN_CENTER
    cell.font = _FONT_LABEL_BOLD

    last_row = ws.max_row
    print_area = f"A1:O{last_row}"

    return workbook_to_pdf_bytes(
        wb,
        ws,
        filename_stem=f"{kind}-proforma-{proforma.pk}",
        print_area=print_area,
    )


def render_sales_proforma_pdf(proforma: SalesProforma) -> bytes:
    return _render_proforma_pdf(proforma, "sales")


def render_purchase_proforma_pdf(proforma: PurchaseProforma) -> bytes:
    return _render_proforma_pdf(proforma, "purchase")