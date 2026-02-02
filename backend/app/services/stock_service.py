"""
Stock price service for fetching real-time stock prices using yfinance.
Includes Redis caching to reduce API calls and exchange suffix mapping.
"""
import logging
from typing import Dict, List, Optional, Tuple
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
import yfinance as yf
import redis
import json
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# Redis connection for caching
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True, db=0)

# Cache TTL in seconds (15 minutes)
CACHE_TTL = 900

# Exchange suffix mapping based on currency
EXCHANGE_SUFFIX_MAP = {
    "USD": "",  # US markets (NYSE, NASDAQ) - no suffix needed
    "INR": ".NS",  # National Stock Exchange of India
    "GBP": ".L",  # London Stock Exchange
    "EUR": ".PA",  # Euronext Paris (can be customized per user preference)
    "JPY": ".T",  # Tokyo Stock Exchange
    "HKD": ".HK",  # Hong Kong Stock Exchange
    "AUD": ".AX",  # Australian Securities Exchange
    "CAD": ".TO",  # Toronto Stock Exchange
}

# Alternative exchanges for some currencies
ALTERNATIVE_EXCHANGES = {
    "INR": [".NS", ".BO"],  # NSE, BSE
    "EUR": [".PA", ".DE", ".AS"],  # Paris, Frankfurt, Amsterdam
}


def get_exchange_suffix(currency: str) -> str:
    """
    Get the stock exchange suffix for a given currency.
    
    Args:
        currency: Currency code (e.g., USD, INR, GBP)
        
    Returns:
        Exchange suffix (e.g., .NS, .L) or empty string for USD
    """
    return EXCHANGE_SUFFIX_MAP.get(currency.upper(), "")


def get_alternative_exchanges(currency: str) -> List[str]:
    """
    Get alternative exchange suffixes for a currency.
    
    Args:
        currency: Currency code
        
    Returns:
        List of exchange suffixes
    """
    return ALTERNATIVE_EXCHANGES.get(currency.upper(), [get_exchange_suffix(currency)])


def _get_cache_key(symbol: str) -> str:
    """Generate Redis cache key for a stock symbol."""
    return f"stock_price:{symbol.upper()}"


def _get_cached_price(symbol: str) -> Optional[Decimal]:
    """
    Get cached stock price from Redis.
    
    Args:
        symbol: Stock symbol
        
    Returns:
        Cached price or None if not found/expired
    """
    try:
        cache_key = _get_cache_key(symbol)
        cached_data = redis_client.get(cache_key)
        if cached_data:
            data = json.loads(cached_data)
            return Decimal(str(data['price']))
    except Exception as e:
        logger.warning(f"Error reading cache for {symbol}: {e}")
    return None


def _cache_price(symbol: str, price: Decimal):
    """
    Cache stock price in Redis.
    
    Args:
        symbol: Stock symbol
        price: Stock price to cache
    """
    try:
        cache_key = _get_cache_key(symbol)
        cache_data = {
            'price': float(price),
            'timestamp': datetime.utcnow().isoformat()
        }
        redis_client.setex(cache_key, CACHE_TTL, json.dumps(cache_data))
    except Exception as e:
        logger.warning(f"Error caching price for {symbol}: {e}")


def get_stock_price(symbol: str, currency: str = "USD", bypass_cache: bool = False) -> Optional[Decimal]:
    """
    Fetch current stock price for a symbol with caching.
    
    Args:
        symbol: Stock symbol (e.g., AAPL, RELIANCE.NS)
        currency: Currency code for exchange mapping if symbol has no suffix
        
    Returns:
        Current stock price or None if failed
    """
    # Check cache first
    if not bypass_cache:
        cached_price = _get_cached_price(symbol)
        if cached_price is not None:
            logger.info(f"Using cached price for {symbol}: {cached_price}")
            return cached_price
    
    try:
        # Add exchange suffix if not present
        full_symbol = symbol
        if '.' not in symbol and currency != "USD":
            suffix = get_exchange_suffix(currency)
            full_symbol = f"{symbol}{suffix}"
        
        logger.info(f"Fetching price for {full_symbol}")
        
        # Fetch from yfinance
        ticker = yf.Ticker(full_symbol)
        info = ticker.info
        
        # Try different price fields in order of preference
        price = None
        for field in ['currentPrice', 'regularMarketPrice', 'previousClose']:
            if field in info and info[field]:
                price = Decimal(str(info[field])).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                break
        
        if price is None:
            logger.error(f"No price data found for {full_symbol}")
            return None
        
        # Cache the price
        _cache_price(symbol, price)
        
        logger.info(f"Fetched price for {full_symbol}: {price}")
        return price
        
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {e}")
        return None


def get_stock_prices_batch(symbols: List[str], bypass_cache: bool = False) -> Dict[str, Optional[Decimal]]:
    """
    Fetch prices for multiple stocks in a single batch.
    Uses cache when available and only fetches uncached symbols.
    
    Args:
        symbols: List of stock symbols
        
    Returns:
        Dictionary mapping symbol to price (None if failed)
    """
    result = {}
    uncached_symbols = []
    
    # Check cache for each symbol
    for symbol in symbols:
        cached_price = None if bypass_cache else _get_cached_price(symbol)
        if cached_price is not None:
            result[symbol] = cached_price
            logger.info(f"Using cached price for {symbol}: {cached_price}")
        else:
            uncached_symbols.append(symbol)
    
    # Fetch uncached symbols
    if uncached_symbols:
        try:
            # Download all at once
            symbols_str = " ".join(uncached_symbols)
            tickers = yf.download(symbols_str, period="1d", progress=False)
            
            for symbol in uncached_symbols:
                try:
                    if len(uncached_symbols) == 1:
                        # Single ticker - different data structure
                        price_data = tickers['Close']
                    else:
                        # Multiple tickers
                        price_data = tickers['Close'][symbol]
                    
                    val = price_data.iloc[-1] if not price_data.empty else None
                    if val is not None and not pd.isna(val) and not (isinstance(val, float) and np.isinf(val)):
                        price = Decimal(str(val)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                        result[symbol] = price
                        _cache_price(symbol, price)
                        logger.info(f"Fetched price for {symbol}: {price}")
                    else:
                        # Fallback to single fetch for this specific symbol
                        logger.info(f"Batch fetch failed or returned NaN for {symbol}, falling back to single fetch")
                        price = get_stock_price(symbol, bypass_cache=bypass_cache)
                        result[symbol] = price
                        
                except Exception as e:
                    logger.error(f"Error processing price for {symbol}: {e}")
                    result[symbol] = None
                    
        except Exception as e:
            logger.error(f"Error batch fetching prices: {e}")
            # Mark all uncached as failed
            for symbol in uncached_symbols:
                if symbol not in result:
                    result[symbol] = None
    
    return result


def search_stock_symbols(query: str, currency: str = "USD", limit: int = 10) -> List[Dict[str, str]]:
    """
    Search for stock symbols matching a query.
    
    Args:
        query: Search query (symbol or company name)
        currency: Currency code to filter by exchange
        limit: Maximum number of results
        
    Returns:
        List of dicts with 'symbol', 'name', 'exchange' fields
    """
    try:
        # Add exchange suffix if needed
        exchange_suffix = get_exchange_suffix(currency)
        search_query = query.upper()
        
        # Try to get ticker info
        ticker = yf.Ticker(f"{search_query}{exchange_suffix}")
        info = ticker.info
        
        # If we found valid data, return it
        if info and 'symbol' in info:
            return [{
                'symbol': info.get('symbol', search_query),
                'name': info.get('longName') or info.get('shortName', 'Unknown'),
                'exchange': info.get('exchange', exchange_suffix.replace('.', ''))
            }]
        
        # Fallback: return the query itself as a suggestion
        return [{
            'symbol': f"{search_query}{exchange_suffix}",
            'name': f"{search_query} (Search on exchange)",
            'exchange': exchange_suffix.replace('.', '') or 'NYSE/NASDAQ'
        }]
        
    except Exception as e:
        logger.error(f"Error searching for {query}: {e}")
        return []
