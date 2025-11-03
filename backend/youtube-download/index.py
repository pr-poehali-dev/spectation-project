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
        'format': f'best[height<={format_selector}]/bestvideo[height<={format_selector}]+bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'nocheckcertificate': True,
        'geo_bypass': True,
        'ignoreerrors': False,
        'no_check_certificate': True,
        'prefer_insecure': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'ios', 'web'],
                'player_skip': ['webpage', 'configs'],
            }
        },
        'http_headers': {
            'User-Agent': 'com.google.android.youtube/17.36.4 (Linux; U; Android 12; US) gzip',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
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
                mp4_formats = [f for f in formats if f.get('ext') == 'mp4' and f.get('vcodec') != 'none']
                
                if mp4_formats:
                    combined = [f for f in mp4_formats if f.get('acodec') != 'none']
                    if combined:
                        best = max(combined, key=lambda x: (x.get('height', 0), x.get('tbr', 0)))
                        video_url_result = best.get('url')
                    else:
                        video_only = [f for f in mp4_formats if f.get('vcodec') != 'none']
                        audio_formats = [f for f in formats if f.get('acodec') != 'none']
                        
                        if video_only and audio_formats:
                            best_video = max(video_only, key=lambda x: x.get('height', 0))
                            best_audio = max(audio_formats, key=lambda x: x.get('abr', 0))
                            video_url_result = best_video.get('url')
                            audio_url_result = best_audio.get('url')
                            separate_streams = True
                        elif video_only:
                            video_url_result = video_only[0].get('url')
                else:
                    all_video = [f for f in formats if f.get('vcodec') != 'none']
                    if all_video:
                        best = max(all_video, key=lambda x: x.get('height', 0))
                        video_url_result = best.get('url')
                        audio_formats = [f for f in formats if f.get('acodec') != 'none']
                        if audio_formats:
                            audio_url_result = max(audio_formats, key=lambda x: x.get('abr', 0)).get('url')
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