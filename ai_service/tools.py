import os
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

NODE_API_URL = os.getenv("NODE_API_URL", "http://localhost:3000/api")

def get_availability(city: str = None, check_in: str = None, check_out: str = None, capacity: int = None):
    params = {}
    if city: params['city'] = city
    if check_in: params['checkIn'] = check_in
    if check_out: params['checkOut'] = check_out
    if capacity: params['capacity'] = capacity
    
    try:
        response = requests.get(f"{NODE_API_URL}/hotel", params=params)
        data = response.json()
        if 'hotels' not in data or len(data['hotels']) == 0:
            return "No se encontraron hoteles disponibles con esos criterios."
        
        results = []
        for h in data['hotels']:
            desc = h.get('description', '')
            desc_short = desc[:100] + '...' if len(desc) > 100 else desc
            price = f"desde {h['startingPrice']}€" if h.get('startingPrice') is not None else "sin habitaciones disponibles actualmente"
            results.append(f"Hotel: {h['name']}, Ubicación: {h['city']}, {h['country']}, Estrellas: {h['stars']}⭐, Precio: {price}. Descripción: {desc_short}")
        return "\n".join(results)
    except Exception as e:
        return f"Error al buscar disponibilidad: {str(e)}"

def get_my_bookings(token: str):
    if not token:
        return "Debes iniciar sesión para ver tus reservas."
    
    try:
        headers = {"Authorization": token}
        response = requests.get(f"{NODE_API_URL}/booking", headers=headers)
        if response.status_code != 200:
            return "Error de autenticación o al obtener las reservas."
            
        data = response.json()
        if 'bookings' not in data or len(data['bookings']) == 0:
            return "No tienes ninguna reserva actualmente."
            
        results = []
        for b in data['bookings']:
            try:
                checkin_dt = datetime.strptime(b['checkIn'].split("T")[0], "%Y-%m-%d")
                checkin_str = checkin_dt.strftime("%d-%m-%Y")
                checkout_dt = datetime.strptime(b['checkOut'].split("T")[0], "%Y-%m-%d")
                checkout_str = checkout_dt.strftime("%d-%m-%Y")
            except Exception:
                checkin_str = b['checkIn']
                checkout_str = b['checkOut']
                
            results.append(
                f"- Reserva en Hotel {b.get('hotelName', 'Desconocido')} (Habitación {b.get('roomType', '')} #{b.get('roomNumber', '')})\n"
                f"  Estado: {b.get('status', 'PENDING')}\n"
                f"  Fechas: {checkin_str} al {checkout_str}\n"
                f"  Precio total: {b.get('totalPrice', 0)}€\n"
            )
        return "\n".join(results)
    except Exception as e:
        return f"Error al buscar tus reservas: {str(e)}"
