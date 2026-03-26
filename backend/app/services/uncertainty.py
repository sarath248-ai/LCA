def calculate_uncertainty(mean_value, percentage=0.10):
    """
    Calculate confidence bounds for ML predictions
    Default: ±10%
    """

    lower = mean_value * (1 - percentage)
    upper = mean_value * (1 + percentage)

    return {
        "mean": round(mean_value, 2),
        "lower_bound": round(lower, 2),
        "upper_bound": round(upper, 2),
    }
