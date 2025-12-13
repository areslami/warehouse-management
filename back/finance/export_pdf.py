from decimal import Decimal

from .models import SalesProforma
from .proforma_pdf_utils import (
    jalali_date,
    load_sales_proforma_template,
    party_name,
    party_national_code,
    rial_words,
    split_two_column_text,
    workbook_to_pdf_bytes,
)


def render_sales_proforma_pdf(proforma: SalesProforma) -> bytes:
    if not proforma.pk:
        raise ValueError("Proforma must be saved before export.")

    proforma = (
        SalesProforma.objects.select_related("customer", "export_preset")
        .prefetch_related("lines__product")
        .get(pk=proforma.pk)
    )
    lines = list(proforma.lines.all())
    if len(lines) != 1:
        raise ValueError("This template supports exactly 1 proforma line.")

    line = lines[0]
    weight = int(line.weight or 0)
    unit_price = int(line.unit_price or 0)
    subtotal = Decimal(line.weight or 0) * Decimal(line.unit_price or 0)
    total_payable = (
        subtotal
        + Decimal(proforma.shipping_cost or 0)
        + Decimal(proforma.commission or 0)
        + Decimal(proforma.other_cost or 0)
        + Decimal(proforma.tax or 0)
        - Decimal(proforma.discount or 0)
    )

    wb, ws = load_sales_proforma_template()

    customer = proforma.customer
    preset = proforma.export_preset
    preset_left, preset_right = split_two_column_text(getattr(preset, "description", "") or "")
    product_name = getattr(line.product, "name", "") or ""

    cells = {
        "N2": proforma.serial_number,
        "N3": jalali_date(proforma.date),
        "C16": party_name(customer),
        "I16": party_national_code(customer),
        "M16": getattr(customer, "economic_code", "") or "",
        "C18": getattr(customer, "postal_code", "") or "",
        "I18": getattr(customer, "phone", "") or "",
        "C20": getattr(customer, "address", "") or "",
        "B24": product_name,
        "F24": weight,
        "H24": unit_price,
        "K24": 0,
        "L24": 0,
        "I24": int(subtotal),
        "N24": int(subtotal),
        "F25": weight,
        "I25": int(subtotal),
        "K25": 0,
        "L25": 0,
        "N25": int(subtotal),
        "N26": int(proforma.shipping_cost or 0),
        "N27": int(proforma.commission or 0),
        "N28": int(proforma.discount or 0),
        "N29": int(proforma.tax or 0),
        "N30": int(proforma.other_cost or 0),
        "N33": int(total_payable),
        "H33": rial_words(total_payable),
    }

    if preset:
        cells.update(
            {
                "A27": f"حساب بانک {preset.bank_name}:           {preset.account_number}",
                "H27": preset.sheba_number,
                "C29": preset_left,
                "H29": preset_right,
            }
        )

    for addr, value in cells.items():
        ws[addr].value = value

    return workbook_to_pdf_bytes(
        wb, ws, filename_stem=f"sales-proforma-{proforma.pk}", print_area="A1:O36"
    )

