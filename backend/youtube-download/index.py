'''
Business: Download YouTube videos and return download links with quality options
Args: event with httpMethod GET/POST, queryStringParameters (url, quality)
Returns: HTTP response with direct download URL
'''

import json
import yt_dlp
from typing import Dict, Any
import base64

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        video_url = body_data.get('url')
        quality = body_data.get('quality', '720p')
    else:
        params = event.get('queryStringParameters', {})
        video_url = params.get('url')
        quality = params.get('quality', '720p')
    
    if not video_url:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'URL параметр обязателен'}),
            'isBase64Encoded': False
        }
    
    quality_map = {
        '360p': '360',
        '480p': '480',
        '720p': '720',
        '1080p': '1080'
    }
    
    format_selector = quality_map.get(quality, '720')
    
    ydl_opts = {
        'format': f'best[height<={format_selector}]/bestvideo[height<={format_selector}]+bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': False,
        'nocheckcertificate': True,
        'geo_bypass': True,
        'socket_timeout': 60,
        'retries': 10,
        'fragment_retries': 10,
        'source_address': '0.0.0.0',
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'android', 'web'],
                'player_skip': ['webpage', 'configs'],
                'skip': ['hls', 'dash'],
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Sec-Fetch-Mode': 'navigate',
        }
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            if not info:
                raise Exception('Не удалось получить информацию о видео')
            
            url = info.get('url')
            formats = info.get('formats', [])
            requested_formats = info.get('requested_formats', [])
            
            video_url_result = url
            audio_url_result = None
            separate_streams = False
            
            if requested_formats and len(requested_formats) >= 1:
                if len(requested_formats) == 2:
                    video_url_result = requested_formats[0].get('url')
                    audio_url_result = requested_formats[1].get('url')
                    separate_streams = True
                else:
                    video_url_result = requested_formats[0].get('url')
            elif not url and formats:
                suitable = [
                    f for f in formats 
                    if f.get('vcodec') != 'none' 
                    and f.get('acodec') != 'none'
                    and f.get('url')
                ]
                
                if suitable:
                    best = max(suitable, key=lambda x: (x.get('height', 0), x.get('tbr', 0)))
                    video_url_result = best.get('url')
                else:
                    video_formats = [f for f in formats if f.get('vcodec') != 'none' and f.get('url')]
                    audio_formats = [f for f in formats if f.get('acodec') != 'none' and f.get('url')]
                    
                    if video_formats:
                        best_video = max(video_formats, key=lambda x: x.get('height', 0))
                        video_url_result = best_video.get('url')
                        
                        if audio_formats:
                            best_audio = max(audio_formats, key=lambda x: x.get('abr', 0))
                            audio_url_result = best_audio.get('url')
                            separate_streams = True
            
            if not video_url_result:
                raise Exception('Не удалось получить ссылку на видео')
            
            video_proxy = f"https://functions.poehali.dev/296e7429-44ee-41f6-ba5f-880dc3456b3c?url={base64.urlsafe_b64encode(video_url_result.encode()).decode()}"
            audio_proxy = None
            
            if audio_url_result:
                audio_proxy = f"https://functions.poehali.dev/296e7429-44ee-41f6-ba5f-880dc3456b3c?url={base64.urlsafe_b64encode(audio_url_result.encode()).decode()}"
            
            result = {
                'title': info.get('title', 'Unknown'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration', 0),
                'video_url': video_proxy,
                'audio_url': audio_proxy,
                'direct_video_url': video_url_result,
                'direct_audio_url': audio_url_result,
                'separate_streams': separate_streams,
                'quality': f"{info.get('height', '?')}p",
                'uploader': info.get('uploader', 'Unknown'),
                'view_count': info.get('view_count', 0),
                'description': info.get('description', ''),
                'upload_date': info.get('upload_date', ''),
                'formats': [{
                    'quality': f.get('format_note', f.get('height', '?')),
                    'height': f.get('height'),
                    'fps': f.get('fps'),
                    'url': base64.urlsafe_b64encode(f.get('url', '').encode()).decode() if f.get('url') else None
                } for f in formats if f.get('vcodec') != 'none' and f.get('url') and f.get('height')][:8]
            }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Не удалось загрузить видео. Проверьте ссылку и попробуйте снова.'}),
            'isBase64Encoded': False
        }