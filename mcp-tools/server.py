from fastmcp import FastMCP
from typing import Any, Dict, Optional, Tuple
import json
import urllib.request
import urllib.error
import urllib.parse


mcp = FastMCP("experimental-mcp-tools")


def _fetch_json(url: str, timeout: float = 10.0) -> Dict[str, Any]:
    """GET a URL and return parsed JSON.
    Keeps logic minimal and reusable.
    """
    req = urllib.request.Request(url, headers={"User-Agent": "mcp-tools/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))

def _geocode_city(name: str, timeout: float = 10.0) -> Optional[Tuple[float, float]]:
    """Resolve city name to (lat, lon) using Open-Meteo geocoding."""
    q = urllib.parse.quote(name.strip())
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={q}&count=1"
    data = _fetch_json(url, timeout)
    results = data.get("results") or []
    if not results:
        return None
    r = results[0]
    return float(r["latitude"]), float(r["longitude"])


def _forecast_url(lat: float, lon: float) -> str:
    """Build forecast URL for current weather."""
    return (
        "https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&current_weather=true"
    )


def _structured_weather_details(city: str, current: Dict[str, Any]) -> str:
    """Format a concise weather string for a city."""
    temp = current.get("temperature")
    wind = current.get("windspeed")
    wdir = current.get("winddirection")
    time = current.get("time")
    if temp is None:
        return f"Weather unavailable right now for {city}."
    return {
        "temperature": temp,
        "wind": wind,
        "windDirection": wdir,
        "time": time
    }


@mcp.tool
def current_weather(city: str) -> dict:
    """Get current weather for a city. Response formatted as JSON"""
    try:
        coords = _geocode_city(city)
        if not coords:
            return f"Could not find city '{city}'."
        lat, lon = coords
        data = _fetch_json(_forecast_url(lat, lon))
        current = data.get("current_weather") or {}
        return _structured_weather_details(city, current)
    except urllib.error.URLError as e:
        return f"Weather API error: {e.reason}"
    except Exception as e:
        return f"Weather fetch failed: {e}"

@mcp.tool
def how_are_you() -> str:
    "Responds briefly to a wellbeing check."
    return "Im doing so so fine, how are you?"


if __name__ == "__main__":
    # default runs an MCP server over stdio
    mcp.run()
