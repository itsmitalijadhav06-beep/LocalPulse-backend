from typing import Dict, Any
from app.utils.distance import calculate_haversine_distance

def is_within_radius(
    center_lat: float,
    center_lon: float,
    target_lat: float,
    target_lon: float,
    radius_km: float
) -> bool:
    """
    Check if a target location is within a specific radius from a center location.
    """
    distance = calculate_haversine_distance(center_lat, center_lon, target_lat, target_lon)
    return distance <= radius_km

def build_mongo_geo_query(
    lat: float, 
    lon: float, 
    radius_km: float
) -> Dict[str, Any]:
    """
    Build a MongoDB GeoJSON geospatial query placeholder ($near or $geoWithin).
    Returns a query dictionary structure ready for pymongo/motor.
    """
    # Earth radius in radians for $centerSphere query
    earth_radius_km = 6371.0
    radius_radians = radius_km / earth_radius_km
    
    return {
        "location": {
            "$geoWithin": {
                "$centerSphere": [[lon, lat], radius_radians]
            }
        }
    }
