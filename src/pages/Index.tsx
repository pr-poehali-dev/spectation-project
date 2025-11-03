import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

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
}

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState("720p");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Icon name="Video" size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Spectation</h1>
              <p className="text-xs text-muted-foreground">Скачивайте видео с YouTube</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Icon name="Link" size={24} />
                Загрузить видео с YouTube
              </CardTitle>
              <CardDescription>
                Вставьте ссылку на видео и выберите качество для скачивания
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Ссылка на YouTube видео
                </label>
                <Input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-background/50 border-input text-foreground text-base"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Качество видео
                  </label>
                  <Select value={quality} onValueChange={setQuality} disabled={loading}>
                    <SelectTrigger className="bg-background/50 border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="360p">360p - Базовое</SelectItem>
                      <SelectItem value="480p">480p - Стандартное</SelectItem>
                      <SelectItem value="720p">720p - HD</SelectItem>
                      <SelectItem value="1080p">1080p - Full HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleLoadVideo}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-[42px] mt-auto"
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
              <Card className="border-border bg-card/50 backdrop-blur overflow-hidden">
                <div className="aspect-video w-full bg-black relative">
                  <video
                    controls
                    className="w-full h-full"
                    poster={videoData.thumbnail}
                    crossOrigin="anonymous"
                    preload="metadata"
                  >
                    <source 
                      src={videoData.video_url} 
                      type="video/mp4" 
                    />
                    Ваш браузер не поддерживает воспроизведение видео.
                  </video>
                </div>
                
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">{videoData.title}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="User" size={16} />
                        {videoData.uploader}
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Eye" size={16} />
                        {formatViews(videoData.view_count)} просмотров
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={16} />
                        {formatDuration(videoData.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Tv" size={16} />
                        {videoData.quality}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleDownload(videoData.direct_video_url, `${videoData.title}.mp4`)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Icon name="Download" size={18} className="mr-2" />
                      Скачать видео
                    </Button>
                    
                    {videoData.direct_audio_url && (
                      <Button
                        onClick={() => handleDownload(videoData.direct_audio_url!, `${videoData.title}.mp3`)}
                        className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      >
                        <Icon name="Music" size={18} className="mr-2" />
                        Скачать аудио
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => window.open(videoData.direct_video_url, '_blank')}
                      variant="outline"
                      className="border-border"
                    >
                      <Icon name="ExternalLink" size={18} className="mr-2" />
                      Открыть в новой вкладке
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Icon name="Info" size={20} />
                Как использовать Spectation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Скопируйте ссылку</h4>
                    <p className="text-sm text-muted-foreground">
                      Найдите нужное видео на YouTube и скопируйте его URL-адрес
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Выберите качество</h4>
                    <p className="text-sm text-muted-foreground">
                      Укажите желаемое качество видео (от 360p до 1080p)
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Смотрите или скачивайте</h4>
                    <p className="text-sm text-muted-foreground">
                      Просматривайте видео прямо на сайте или сохраняйте на устройство
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Spectation — скачивайте видео с YouTube без ограничений</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
