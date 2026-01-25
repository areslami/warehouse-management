from decimal import Decimal
from openpyxl.styles import Alignment
from .models import SalesProforma, PurchaseProforma
from .utils import (
    en_digits,
    jalali_date,
    load_sales_proforma_template,
    party_name,
    party_national_code,
    rial_words,
    split_two_column_text,
    workbook_to_pdf_bytes,
)


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

    # ─── Title (Row 3, F:J) ─────────────────────────────────────────────
    for col in range(3, 11):
        ws.cell(row=3, column=col).value = None

    ws.merge_cells("F3:J3")
    title_cell = ws["F3"]
    title_cell.value = title_text
    title_cell.alignment = Alignment(horizontal="center", vertical="center")

    party_main = getattr(proforma, party_attr_main)
    preset = proforma.export_preset
    preset_left, preset_right = split_two_column_text(getattr(preset, "description", "") or "")

    ws["N2"].value = proforma.serial_number
    ws["N3"].value = jalali_date(proforma.date)

    ws.merge_cells("A5:O5")
    ws["A5"].value = "مشخصات فروشنده" if kind == "sales" else "مشخصات خریدار"
    ws["A5"].alignment = Alignment(horizontal="center", vertical="center")

    ws.merge_cells("A14:O14")
    ws["A14"].value = "مشخصات خریدار" if kind == "sales" else "مشخصات تامین کننده"
    ws["A14"].alignment = Alignment(horizontal="center", vertical="center")

    ws["C16"].value = en_digits(party_name(party_main))
    ws["I16"].value = en_digits(party_national_code(party_main))
    ws["M16"].value = en_digits(getattr(party_main, "economic_code", "") or "")
    ws["C18"].value = en_digits(getattr(party_main, "postal_code", "") or "")
    ws["I18"].value = en_digits(getattr(party_main, "phone", "") or "")
    ws["C20"].value = en_digits(getattr(party_main, "address", "") or "")


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

        ws[f"B{row}"].value = getattr(line.product, "name", "") or ""
        ws[f"F{row}"].value = weight
        ws[f"H{row}"].value = unit_price
        ws[f"K{row}"].value = tax
        ws[f"L{row}"].value = discount
        ws[f"I{row}"].value = line_subtotal
        ws[f"N{row}"].value = line_total

        for col in ("F", "H", "K", "L", "I", "N"):
            ws[f"{col}{row}"].number_format = "0.####"

        subtotal += line_total

    total_payable = (
        subtotal
        * (Decimal(1) - Decimal(proforma.discount or 0)
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
    ws["N33"].value = total_payable

    for c in ("N26", "N27", "N28", "N29", "N30", "N33"):
        ws[c].number_format = "0.####"

    ws.merge_cells("H33:K33")
    ws["H33"].value = rial_words(total_payable)
    ws["H33"].alignment = Alignment(horizontal="center", vertical="center")

    if preset:
        ws["A27"].value = f"حساب بانک {preset.bank_name}:           {preset.account_number}"
        ws["H27"].value = preset.sheba_number
        ws["C29"].value = preset_left
        ws["H29"].value = preset_right

    return workbook_to_pdf_bytes(
        wb,
        ws,
        filename_stem=f"{kind}-proforma-{proforma.pk}",
        print_area="A1:O36",
    )


def render_sales_proforma_pdf(proforma: SalesProforma) -> bytes:
    return _render_proforma_pdf(proforma, "sales")


def render_purchase_proforma_pdf(proforma: PurchaseProforma) -> bytes:
    return _render_proforma_pdf(proforma, "purchase")
