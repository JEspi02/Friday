import sqlite3
import json

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

# Initialize DB on load
init_db()
