import sqlite3
import json
import uuid
from datetime import datetime

DB_PATH = 'friday.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    # Enable Write-Ahead Logging
    cursor.execute('PRAGMA journal_mode=WAL;')

    # Create portfolios table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS portfolios (
            id TEXT PRIMARY KEY,
            symbols TEXT NOT NULL
        )
    ''')

    # Create watchlists table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS watchlists (
            id TEXT PRIMARY KEY,
            symbols TEXT NOT NULL
        )
    ''')

    # Create ohlcv table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ohlcv (
            symbol TEXT,
            interval TEXT,
            timestamp INTEGER,
            open REAL,
            high REAL,
            low REAL,
            close REAL,
            volume REAL,
            UNIQUE(symbol, interval, timestamp)
        )
    ''')

    # Create drawings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drawings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            ticker TEXT NOT NULL,
            shape_type TEXT NOT NULL,
            points TEXT NOT NULL,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()

def save_portfolio(user_id: str, symbols: list):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO portfolios (id, symbols) VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET symbols=excluded.symbols
    ''', (user_id, json.dumps(symbols)))
    conn.commit()
    conn.close()

def get_portfolio(user_id: str) -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT symbols FROM portfolios WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row['symbols'])
    return ['AAPL', 'NVDA', 'SPY', 'AMD'] # Default fallback as in state.js

def save_watchlist(user_id: str, symbols: list):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO watchlists (id, symbols) VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET symbols=excluded.symbols
    ''', (user_id, json.dumps(symbols)))
    conn.commit()
    conn.close()

def get_watchlist(user_id: str) -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT symbols FROM watchlists WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return json.loads(row['symbols'])
    return []

def get_cached_ohlcv(symbol: str, interval: str) -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT timestamp as time, open, high, low, close, volume
        FROM ohlcv
        WHERE symbol = ? AND interval = ?
        ORDER BY timestamp ASC
    ''', (symbol, interval))
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def save_ohlcv_batch(symbol: str, interval: str, bars: list):
    if not bars:
        return

    conn = get_db()
    cursor = conn.cursor()

    records = [
        (symbol, interval, bar['time'], bar['open'], bar['high'], bar['low'], bar['close'], bar['volume'])
        for bar in bars
    ]

    cursor.executemany('''
        INSERT OR IGNORE INTO ohlcv (symbol, interval, timestamp, open, high, low, close, volume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', records)

    conn.commit()
    conn.close()

def save_drawing(user_id: str, ticker: str, drawing_data: dict) -> dict:
    conn = get_db()
    cursor = conn.cursor()
    drawing_id = str(uuid.uuid4())

    cursor.execute('''
        INSERT INTO drawings (id, user_id, ticker, shape_type, points, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        drawing_id,
        user_id,
        ticker,
        drawing_data['shape_type'],
        json.dumps(drawing_data['points']),
        json.dumps(drawing_data.get('metadata')) if drawing_data.get('metadata') else None
    ))
    conn.commit()

    cursor.execute('SELECT * FROM drawings WHERE id = ?', (drawing_id,))
    row = cursor.fetchone()
    conn.close()

    return {
        "id": row['id'],
        "ticker": row['ticker'],
        "shape_type": row['shape_type'],
        "points": json.loads(row['points']),
        "metadata": json.loads(row['metadata']) if row['metadata'] else None,
        "created_at": row['created_at']
    }

def get_drawings(user_id: str, ticker: str) -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM drawings WHERE user_id = ? AND ticker = ? ORDER BY created_at ASC
    ''', (user_id, ticker))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append({
            "id": row['id'],
            "ticker": row['ticker'],
            "shape_type": row['shape_type'],
            "points": json.loads(row['points']),
            "metadata": json.loads(row['metadata']) if row['metadata'] else None,
            "created_at": row['created_at']
        })
    return result

def delete_drawings(user_id: str, ticker: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM drawings WHERE user_id = ? AND ticker = ?', (user_id, ticker))
    conn.commit()
    conn.close()

# Initialize DB on load
init_db()
