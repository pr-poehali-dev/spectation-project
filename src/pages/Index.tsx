import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/fantasy/index.css';

interface VideoFormat {
  quality: string;
  height: number;
  fps: number;
  url: string;
}

interface VideoData {
  title: string;
  thumbnail: string;
  duration: number;
  video_url: string;
  audio_url?: string;
  direct_video_url: string;
  direct_audio_url?: string;
  separate_streams: boolean;
  quality: string;
  uploader: string;
  view_count: number;
  description: string;
  upload_date: string;
  formats: VideoFormat[];
}

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState("720p");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (videoRef.current && videoData && !playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        responsive: true,
        preload: 'auto',
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'remainingTimeDisplay',
            'playbackRateMenuButton',
            'fullscreenToggle',
          ],
        },
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
      });

      playerRef.current.on('error', () => {
        console.error('Video.js error');
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoData]);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}.${month}.${year}`;
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Успешно",
        description: "Файл начал загружаться",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать файл",
        variant: "destructive",
      });
    }
  };

  const handleLoadVideo = async () => {
    if (!videoUrl) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите ссылку на видео",
        variant: "destructive",
      });
      return;
    }

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    setLoading(true);
    setVideoData(null);

    try {
      const response = await fetch("https://functions.poehali.dev/ffd1c2de-6c6e-4542-aa4f-9b15b312a383", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
          quality: quality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при загрузке видео");
      }

      setVideoData(data);
      toast({
        title: "Успешно",
        description: `Видео "${data.title}" готово к просмотру`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось загрузить видео",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl supports-[backdrop-filter]:bg-card/80 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/70 p-2.5 rounded-xl shadow-lg">
              <Icon name="Play" size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Spectation Pro
              </h1>
              <p className="text-xs text-muted-foreground">Мощный загрузчик видео с YouTube</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:flex gap-1 items-center">
            <Icon name="Zap" size={14} />
            Работает в России
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground text-xl">
                    <Icon name="Link" size={22} />
                    Загрузить видео с YouTube
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Вставьте ссылку на любое видео - поддерживаются все форматы YouTube
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Icon name="Link2" size={16} />
                  Ссылка на YouTube видео
                </label>
                <Input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... или https://youtu.be/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-background/50 border-input text-foreground text-base h-12"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Icon name="Tv" size={16} />
                    Качество видео
                  </label>
                  <Select value={quality} onValueChange={setQuality} disabled={loading}>
                    <SelectTrigger className="bg-background/50 border-input text-foreground h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="360p">
                        <span className="flex items-center gap-2">
                          360p - Базовое качество
                        </span>
                      </SelectItem>
                      <SelectItem value="480p">
                        <span className="flex items-center gap-2">
                          480p - Стандартное
                        </span>
                      </SelectItem>
                      <SelectItem value="720p">
                        <span className="flex items-center gap-2">
                          720p - HD качество
                        </span>
                      </SelectItem>
                      <SelectItem value="1080p">
                        <span className="flex items-center gap-2">
                          1080p - Full HD
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleLoadVideo}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground h-12 mt-auto shadow-lg"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    <>
                      <Icon name="Download" size={20} className="mr-2" />
                      Загрузить
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {videoData && (
            <>
              <Card className="border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-xl">
                <div className="aspect-video w-full bg-black relative">
                  <video
                    ref={videoRef}
                    className="video-js vjs-theme-fantasy vjs-big-play-centered w-full h-full"
                    poster={videoData.thumbnail}
                  >
                    <source 
                      src={videoData.video_url} 
                      type="video/mp4" 
                    />
                  </video>
                </div>
                
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                      {videoData.title}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                        <Icon name="User" size={14} />
                        {videoData.uploader}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                        <Icon name="Eye" size={14} />
                        {formatViews(videoData.view_count)} просмотров
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                        <Icon name="Clock" size={14} />
                        {formatDuration(videoData.duration)}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                        <Icon name="Monitor" size={14} />
                        {videoData.quality}
                      </Badge>
                      {videoData.upload_date && (
                        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
                          <Icon name="Calendar" size={14} />
                          {formatDate(videoData.upload_date)}
                        </Badge>
                      )}
                    </div>

                    {videoData.description && (
                      <div className="mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDescription(!showDescription)}
                          className="text-muted-foreground hover:text-foreground p-0 h-auto"
                        >
                          <Icon name={showDescription ? "ChevronUp" : "ChevronDown"} size={16} className="mr-1" />
                          {showDescription ? "Скрыть" : "Показать"} описание
                        </Button>
                        {showDescription && (
                          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap bg-secondary/20 p-4 rounded-lg border border-border/50">
                            {videoData.description.slice(0, 500)}
                            {videoData.description.length > 500 && "..."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleDownload(videoData.direct_video_url, `${videoData.title}.mp4`)}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md"
                    >
                      <Icon name="Download" size={18} className="mr-2" />
                      Скачать видео ({videoData.quality})
                    </Button>
                    
                    {videoData.direct_audio_url && (
                      <Button
                        onClick={() => handleDownload(videoData.direct_audio_url!, `${videoData.title}.mp3`)}
                        className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-secondary-foreground shadow-md"
                      >
                        <Icon name="Music" size={18} className="mr-2" />
                        Скачать аудио
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => window.open(videoData.direct_video_url, '_blank')}
                      variant="outline"
                      className="border-border shadow-sm"
                    >
                      <Icon name="ExternalLink" size={18} className="mr-2" />
                      Открыть напрямую
                    </Button>
                  </div>

                  {videoData.formats && videoData.formats.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="List" size={16} />
                        Доступные качества
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {videoData.formats.map((format, idx) => (
                          <Badge 
                            key={idx}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => {
                              window.open(`https://functions.poehali.dev/296e7429-44ee-41f6-ba5f-880dc3456b3c?url=${format.url}`, '_blank');
                            }}
                          >
                            {format.height}p {format.fps ? `${format.fps}fps` : ''}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <Icon name="Zap" size={20} />
                  Мощные возможности
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Shield" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Работает в России</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Прокси-серверы для обхода блокировок
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Gauge" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Высокая скорость</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Оптимизированная загрузка видео
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Film" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Video.js плеер</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Профессиональный плеер с управлением скоростью
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Layers" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Все форматы</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Поддержка видео любой длительности и качества
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <Icon name="Info" size={20} />
                  Как использовать
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Скопируйте ссылку</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Любая ссылка с YouTube: обычная, shorts, плейлист
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Выберите качество</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      От 360p до 1080p Full HD
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Смотрите или скачивайте</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Мощный плеер или сохранение на устройство
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Управляйте просмотром</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Изменяйте скорость от 0.5x до 2x
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-8 bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="Rocket" size={20} className="text-primary" />
            <span className="font-semibold text-foreground">Spectation Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Профессиональный инструмент для работы с YouTube видео
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
