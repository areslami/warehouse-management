import re
from typing import Optional

import jdatetime
from django.utils import timezone

TOKEN_PATTERN = re.compile(r"\{\{([A-Z0-9_]+)\}\}")

MONTH_NAMES = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
]


def _pad(value: int, length: int) -> str:
    return str(value).zfill(length)


def render_indicator_template(
    template: Optional[str],
    counter_value: Optional[int] = None,
    ref_datetime=None,
) -> str:
    """
    Render the indicator template by replacing known tokens with runtime values.

    :param template: Template string containing indicator tokens.
    :param counter_value: Base counter that will be padded depending on the token.
    :param ref_datetime: Datetime used to derive Jalali date parts. Defaults to now().
    :return: Rendered template with tokens replaced. Unknown tokens are preserved.
    """

    if not template:
        return ""

    counter_value = max(1, int(counter_value or 1))
    ref_datetime = ref_datetime or timezone.now()
    jalali_now = jdatetime.datetime.fromgregorian(datetime=ref_datetime)
    month_index = max(0, min(jalali_now.month - 1, len(MONTH_NAMES) - 1))
    month_name = MONTH_NAMES[month_index]

    replacements = {
        "COUNTER": str(counter_value),
        "COUNTER2": _pad(counter_value, 2),
        "COUNTER3": _pad(counter_value, 3),
        "COUNTER4": _pad(counter_value, 4),
        "COUNTER5": _pad(counter_value, 5),
        "COUNTER6": _pad(counter_value, 6),
        "COUNTER7": _pad(counter_value, 7),
        "JYEAR4": _pad(jalali_now.year, 4),
        "JYEAR3": _pad(jalali_now.year, 3)[-3:],
        "JYEAR2": _pad(jalali_now.year, 2)[-2:],
        "JMONTH2": _pad(jalali_now.month, 2),
        "JMONTH_SHORT": month_name[:2],
        "JMONTH_LONG": month_name,
        "JDAY2": _pad(jalali_now.day, 2),
        "JDAY1": str(jalali_now.day),
    }

    def replace(match: re.Match) -> str:
        token = match.group(1)
        return replacements.get(token, match.group(0))

    return TOKEN_PATTERN.sub(replace, template)

