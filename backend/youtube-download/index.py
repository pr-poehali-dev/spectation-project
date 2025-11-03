'''
Business: Download YouTube videos and return stream URLs with quality options
Args: event with httpMethod GET/POST, queryStringParameters (url, quality)
Returns: HTTP response with video stream URL or download link
'''

import json
import yt_dlp
from typing import Dict, Any

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
        'format': f'bestvideo[height<={format_selector}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={format_selector}]+bestaudio/best[height<={format_selector}]/best',
        'quiet': False,
        'no_warnings': False,
        'extract_flat': False,
        'nocheckcertificate': True,
        'geo_bypass': True,
        'age_limit': None,
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
                'skip': ['hls', 'dash']
            }
        },
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
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
            
            if requested_formats and len(requested_formats) == 2:
                video_url_result = requested_formats[0].get('url')
                audio_url_result = requested_formats[1].get('url')
                separate_streams = True
            elif not url and formats:
                suitable_formats = [
                    f for f in formats 
                    if f.get('vcodec') != 'none' 
                    and f.get('acodec') != 'none'
                    and f.get('ext') == 'mp4'
                ]
                
                if suitable_formats:
                    best = max(suitable_formats, key=lambda x: x.get('height', 0))
                    video_url_result = best.get('url')
                else:
                    video_only = [f for f in formats if f.get('vcodec') != 'none' and f.get('ext') == 'mp4']
                    audio_only = [f for f in formats if f.get('acodec') != 'none']
                    
                    if video_only and audio_only:
                        best_video = max(video_only, key=lambda x: x.get('height', 0))
                        best_audio = max(audio_only, key=lambda x: x.get('abr', 0))
                        video_url_result = best_video.get('url')
                        audio_url_result = best_audio.get('url')
                        separate_streams = True
            
            if not video_url_result:
                raise Exception('Не удалось получить ссылку на видео')
            
            result = {
                'title': info.get('title', 'Unknown'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration', 0),
                'video_url': video_url_result,
                'audio_url': audio_url_result,
                'separate_streams': separate_streams,
                'quality': f"{info.get('height', '?')}p"
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
            
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        if 'unavailable' in error_msg.lower():
            error_msg = 'Видео недоступно или приватное. Попробуйте другое видео.'
        elif 'age' in error_msg.lower():
            error_msg = 'Видео имеет возрастные ограничения и не может быть загружено.'
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_msg}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Ошибка при обработке видео: {str(e)}'}),
            'isBase64Encoded': False
        }