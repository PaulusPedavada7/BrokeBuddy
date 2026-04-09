from datetime import date, timedelta
import calendar

def compute_next_due(due_day: int) -> str:
    today = date.today()
    last_day = calendar.monthrange(today.year, today.month)[1]
    clamped = min(due_day, last_day)
    candidate = today.replace(day=clamped)

    if candidate < today:
        if today.month == 12:
            next_year, next_month = today.year + 1, 1
        else:
            next_year, next_month = today.year, today.month + 1
        last_day_next = calendar.monthrange(next_year, next_month)[1]
        candidate = date(next_year, next_month, min(due_day, last_day_next))

    return candidate.isoformat()
