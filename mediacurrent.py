import asyncio
import json
import sys
from winsdk.windows.media.control import (
    GlobalSystemMediaTransportControlsSessionManager as MediaManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus
)

# Configurar la salida estándar para UTF-8
sys.stdout.reconfigure(encoding='utf-8')

async def get_media_info():
    try:
        # Obtener el administrador de sesiones de medios
        manager = await MediaManager.request_async()
        session = manager.get_current_session()

        if not session:
            return {
                "status": "no_media",
                "title": "",
                "artist": "",
                "album": "",
                "playback_status": "stopped"
            }

        # Obtener propiedades del medio
        media_properties = await session.try_get_media_properties_async()
        
        info = {
            "title": media_properties.title,
            "artist": media_properties.artist,
            "album_title": media_properties.album_title
        } if media_properties else {}

        # Obtener estado de reproducción
        playback_info = session.get_playback_info()
        status_map = {
            GlobalSystemMediaTransportControlsSessionPlaybackStatus.PLAYING: "playing",
            GlobalSystemMediaTransportControlsSessionPlaybackStatus.PAUSED: "paused",
            GlobalSystemMediaTransportControlsSessionPlaybackStatus.STOPPED: "stopped",
            GlobalSystemMediaTransportControlsSessionPlaybackStatus.CHANGING: "changing",
            GlobalSystemMediaTransportControlsSessionPlaybackStatus.CLOSED: "closed"
        }
        playback_status = status_map.get(playback_info.playback_status, "unknown")

        # Obtener información de la línea de tiempo (duración y posición)
        timeline_properties = session.get_timeline_properties()
        duration_seconds = timeline_properties.end_time.total_seconds() if timeline_properties and timeline_properties.end_time else 0
        position_seconds = timeline_properties.position.total_seconds() if timeline_properties and timeline_properties.position else 0

        return {
            "status": "success",
            "title": info.get("title", ""),
            "artist": info.get("artist", ""),
            "album": info.get("album_title", ""),
            "playback_status": playback_status,
            "duration_seconds": duration_seconds,
            "position_seconds": position_seconds
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "title": "",
            "artist": "",
            "album": "",
            "playback_status": "unknown"
        }

if __name__ == "__main__":
    result = asyncio.run(get_media_info())
    print(json.dumps(result, ensure_ascii=False))