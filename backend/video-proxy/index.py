'''
Business: Proxy video streaming to bypass CORS restrictions
Args: event with httpMethod GET, queryStringParameters (url)
Returns: Video stream with proper headers
'''

import requests
import base64
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Range',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {})
    video_url = params.get('url')
    
    if not video_url:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': '{"error": "URL parameter required"}',
            'isBase64Encoded': False
        }
    
    try:
        video_url = base64.urlsafe_b64decode(video_url.encode()).decode()
    except:
        pass
    
    headers = {}
    range_header = event.get('headers', {}).get('Range') or event.get('headers', {}).get('range')
    if range_header:
        headers['Range'] = range_header
    
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    
    try:
        response = requests.get(video_url, headers=headers, stream=True, timeout=30)
        
        response_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
            'Content-Type': response.headers.get('Content-Type', 'video/mp4'),
        }
        
        if 'Content-Length' in response.headers:
            response_headers['Content-Length'] = response.headers['Content-Length']
        
        if 'Content-Range' in response.headers:
            response_headers['Content-Range'] = response.headers['Content-Range']
            response_headers['Accept-Ranges'] = 'bytes'
        
        content = response.content
        
        return {
            'statusCode': response.status_code,
            'headers': response_headers,
            'body': content.decode('latin1') if len(content) < 1000000 else '',
            'isBase64Encoded': True if len(content) < 1000000 else False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': f'{{"error": "Proxy error: {str(e)}"}}',
            'isBase64Encoded': False
        }