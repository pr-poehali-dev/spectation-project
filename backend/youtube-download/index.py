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
        '360p': 'worst',
        '480p': '480',
        '720p': '720',
        '1080p': '1080'
    }
    
    format_selector = quality_map.get(quality, '720')
    
    ydl_opts = {
        'format': f'bestvideo[height<={format_selector}]+bestaudio/best[height<={format_selector}]',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            formats = info.get('formats', [])
            video_formats = [f for f in formats if f.get('vcodec') != 'none' and f.get('acodec') != 'none']
            
            if not video_formats:
                video_only = [f for f in formats if f.get('vcodec') != 'none']
                audio_only = [f for f in formats if f.get('acodec') != 'none']
                
                if video_only and audio_only:
                    best_video = max(video_only, key=lambda x: x.get('height', 0))
                    best_audio = max(audio_only, key=lambda x: x.get('abr', 0))
                    
                    result = {
                        'title': info.get('title', 'Unknown'),
                        'thumbnail': info.get('thumbnail'),
                        'duration': info.get('duration'),
                        'video_url': best_video.get('url'),
                        'audio_url': best_audio.get('url'),
                        'separate_streams': True,
                        'quality': f"{best_video.get('height', '?')}p"
                    }
                else:
                    raise Exception('Не удалось найти подходящие форматы')
            else:
                best_format = max(video_formats, key=lambda x: x.get('height', 0))
                
                result = {
                    'title': info.get('title', 'Unknown'),
                    'thumbnail': info.get('thumbnail'),
                    'duration': info.get('duration'),
                    'video_url': best_format.get('url'),
                    'separate_streams': False,
                    'quality': f"{best_format.get('height', '?')}p"
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
            'body': json.dumps({'error': f'Ошибка при обработке видео: {str(e)}'}),
            'isBase64Encoded': False
        }
