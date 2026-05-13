import pandas as pd
import pandas_ta as ta

def calculate_premium_indicators(bars_data):
    if not bars_data:
        return {"indicators": {}, "fibonacci": {}}

    # Convert your raw dictionary data into a pandas DataFrame
    df = pd.DataFrame([b.model_dump() if hasattr(b, 'model_dump') else (b.dict() if hasattr(b, 'dict') else b) for b in bars_data])

    if len(df) < 50:
        # Not enough data for EMA_50
        df['SMA_20'] = ta.sma(df['close'], length=20) if len(df) >= 20 else 0
        df['EMA_50'] = 0
    else:
        # Calculate a Simple Moving Average (SMA) and Exponential Moving Average (EMA)
        df['SMA_20'] = ta.sma(df['close'], length=20)
        df['EMA_50'] = ta.ema(df['close'], length=50)

    # Calculate Fibonacci Retracement levels based on the recent high/low
    recent_high = df['high'].max()
    recent_low = df['low'].min()
    diff = recent_high - recent_low

    fib_levels = {
        "0.0": recent_high,
        "0.236": recent_high - 0.236 * diff,
        "0.382": recent_high - 0.382 * diff,
        "0.5": recent_high - 0.5 * diff,
        "0.618": recent_high - 0.618 * diff,
        "1.0": recent_low
    }

    # Clean up NaN values for JSON serialization
    df = df.fillna(0)

    return {
        "indicators": {
            "sma20": [{"time": r.time, "value": r.SMA_20} for r in df.itertuples() if r.SMA_20 != 0],
            "ema50": [{"time": r.time, "value": r.EMA_50} for r in df.itertuples() if r.EMA_50 != 0],
        },
        "fibonacci": fib_levels
    }