'''
Business: Download YouTube videos, search videos, and return download links with quality options
Args: event with httpMethod GET/POST, body with action (download/search), url/query, quality
Returns: HTTP response with video data or search results
'''

import json
import yt_dlp
from typing import Dict, Any, List
import base64
import re

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
        action = body_data.get('action', 'download')
        
        if action == 'search':
            return handle_search(body_data)
        else:
            return handle_download(body_data)
    else:
        params = event.get('queryStringParameters', {})
        return handle_download({'url': params.get('url'), 'quality': params.get('quality', '720p')})

def handle_search(data: Dict[str, Any]) -> Dict[str, Any]:
    query = data.get('query')
    max_results = data.get('max_results', 20)
    
    if not query:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Поисковый запрос обязателен'}),
            'isBase64Encoded': False
        }
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'force_generic_extractor': False,
        'nocheckcertificate': True,
        'geo_bypass': True,
        'socket_timeout': 30,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            search_url = f"ytsearch{max_results}:{query}"
            search_results = ydl.extract_info(search_url, download=False)
            
            if not search_results or 'entries' not in search_results:
                raise Exception('Не удалось выполнить поиск')
            
            results = []
            for entry in search_results['entries']:
                if entry:
                    results.append({
                        'id': entry.get('id', ''),
                        'title': entry.get('title', 'Unknown'),
                        'url': entry.get('url', f"https://www.youtube.com/watch?v={entry.get('id', '')}"),
                        'thumbnail': entry.get('thumbnail', ''),
                        'duration': entry.get('duration', 0),
                        'uploader': entry.get('uploader', 'Unknown'),
                        'view_count': entry.get('view_count', 0),
                        'description': entry.get('description', '')[:200] if entry.get('description') else ''
                    })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'results': results,
                    'count': len(results),
                    'query': query
                }),
                'isBase64Encoded': False
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка поиска: {str(e)}'}),
            'isBase64Encoded': False
        }

def normalize_url(url: str) -> str:
    if not url:
        return url
    
    patterns = [
        (r'youtube\.com/shorts/([a-zA-Z0-9_-]+)', r'youtube.com/watch?v=\1'),
        (r'youtu\.be/([a-zA-Z0-9_-]+)', r'youtube.com/watch?v=\1'),
        (r'm\.youtube\.com', r'youtube.com'),
        (r'youtube\.com/embed/([a-zA-Z0-9_-]+)', r'youtube.com/watch?v=\1'),
        (r'youtube\.com/v/([a-zA-Z0-9_-]+)', r'youtube.com/watch?v=\1'),
    ]
    
    normalized = url
    for pattern, replacement in patterns:
        normalized = re.sub(pattern, replacement, normalized)
    
    if not normalized.startswith('http'):
        normalized = 'https://' + normalized
    
    return normalized

def handle_download(data: Dict[str, Any]) -> Dict[str, Any]:
    video_url = data.get('url')
    quality = data.get('quality', '720p')
    
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
    
    video_url = normalize_url(video_url)
    
    quality_map = {
        '360p': '360',
        '480p': '480',
        '720p': '720',
        '1080p': '1080',
        '1440p': '1440',
        '2160p': '2160'
    }
    
    format_selector = quality_map.get(quality, '720')
    
    ydl_opts = {
        'format': f'bestvideo[height<={format_selector}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={format_selector}]+bestaudio/best[height<={format_selector}]/best',
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': False,
        'nocheckcertificate': True,
        'geo_bypass': True,
        'socket_timeout': 90,
        'retries': 15,
        'fragment_retries': 15,
        'source_address': '0.0.0.0',
        'force_generic_extractor': False,
        'prefer_insecure': False,
        'age_limit': None,
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'android', 'web', 'mweb'],
                'player_skip': ['webpage', 'configs'],
                'skip': ['hls', 'dash'],
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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
            
            all_formats = []
            seen_heights = set()
            for f in formats:
                if f.get('vcodec') != 'none' and f.get('url') and f.get('height'):
                    height = f.get('height')
                    if height not in seen_heights:
                        seen_heights.add(height)
                        all_formats.append({
                            'quality': f.get('format_note', f'{height}p'),
                            'height': height,
                            'fps': f.get('fps'),
                            'ext': f.get('ext', 'mp4'),
                            'filesize': f.get('filesize', 0),
                            'url': base64.urlsafe_b64encode(f.get('url', '').encode()).decode() if f.get('url') else None
                        })
            
            all_formats.sort(key=lambda x: x['height'], reverse=True)
            
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
                'channel': info.get('channel', ''),
                'channel_url': info.get('channel_url', ''),
                'formats': all_formats[:15]
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
        error_msg = str(e)
        if 'unavailable' in error_msg.lower():
            error_msg = 'Видео недоступно. Возможно, оно удалено или приватное.'
        elif 'copyright' in error_msg.lower():
            error_msg = 'Видео недоступно из-за авторских прав.'
        else:
            error_msg = 'Не удалось загрузить видео. Попробуйте другую ссылку.'
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_msg}),
            'isBase64Encoded': False
        }
