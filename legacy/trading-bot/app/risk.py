from .config import settings

def within_exposure(current_exposure_value: float, new_value: float):
    max_exposure = settings.BASE_CAPITAL * settings.MAX_PORTFOLIO_EXPOSURE_PCT
    return (current_exposure_value + new_value) <= max_exposure + 1e-6
