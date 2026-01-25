from decimal import Decimal
from openpyxl.styles import Alignment
from .models import SalesProforma, PurchaseProforma
from .utils import (
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
        model.objects.select_related(party_attr_main, "export_preset")
        .prefetch_related("lines__product")
        .get(pk=proforma.pk)
    )

    wb, ws = load_sales_proforma_template()

    # clear old C:J row 3 for title
    for col in range(3, 11):
        ws.cell(row=3, column=col).value = None

    # Merge F:J for header and center
    ws.merge_cells(start_row=3, start_column=6, end_row=3, end_column=10)
    cell = ws.cell(row=3, column=6)
    cell.value = title_text
    cell.alignment = Alignment(horizontal="center", vertical="center")

    party_main = getattr(proforma, party_attr_main)
    preset = proforma.export_preset
    preset_left, preset_right = split_two_column_text(getattr(preset, "description", "") or "")

    ws["N2"].value = proforma.serial_number
    ws["N3"].value = jalali_date(proforma.date)

    # Row 5: مشخصات فروشنده / مشخصات خریدار
    ws.merge_cells("A5:O5")
    ws["A5"].value = "مشخصات فروشنده" if kind == "sales" else "مشخصات خریدار"
    ws["A5"].alignment = Alignment(horizontal="center", vertical="center")

    # Row 14: مشخصات خریدار / مشخصات تامین کننده
    ws.merge_cells("A14:O14")
    ws["A14"].value = "مشخصات خریدار" if kind == "sales" else "مشخصات تامین کننده"
    ws["A14"].alignment = Alignment(horizontal="center", vertical="center")

    # Party info main
    ws["C16"].value = party_name(party_main)
    ws["I16"].value = party_national_code(party_main)
    ws["M16"].value = getattr(party_main, "economic_code", "") or ""
    ws["C18"].value = getattr(party_main, "postal_code", "") or ""
    ws["I18"].value = getattr(party_main, "phone", "") or ""
    ws["C20"].value = getattr(party_main, "address", "") or ""

    start_row = 24
    subtotal = Decimal(0)

    for idx, line in enumerate(proforma.lines.all()):
        row = start_row + idx
        weight = Decimal(line.weight or 0)
        unit_price = Decimal(line.unit_price or 0)
        line_subtotal = weight * unit_price
        line_total = line_subtotal * (Decimal(1) + (line.tax or 0) - (line.discount or 0))

        ws[f"B{row}"].value = getattr(line.product, "name", "") or ""
        ws[f"F{row}"].value = weight
        ws[f"H{row}"].value = unit_price
        ws[f"K{row}"].value = line.tax or Decimal(0)
        ws[f"L{row}"].value = line.discount or Decimal(0)
        ws[f"I{row}"].value = line_subtotal
        ws[f"N{row}"].value = line_total

        for col in ["F", "H", "K", "L", "I", "N"]:
            ws[f"{col}{row}"].number_format = '0.####'

        subtotal += line_total

    total_payable = subtotal * (Decimal(1) - (proforma.discount or 0)) \
                    + Decimal(proforma.tax or 0) \
                    + Decimal(proforma.shipping_cost or 0) \
                    + Decimal(proforma.commission or 0) \
                    + Decimal(proforma.other_cost or 0)

    ws["N26"].value = proforma.shipping_cost or Decimal(0)
    ws["N27"].value = proforma.commission or Decimal(0)
    ws["N28"].value = proforma.discount or Decimal(0)
    ws["N29"].value = proforma.tax or Decimal(0)
    ws["N30"].value = proforma.other_cost or Decimal(0)
    ws["N33"].value = total_payable
    for cell in ["N26", "N27", "N28", "N29", "N30", "N33"]:
        ws[cell].number_format = '0.####'


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
