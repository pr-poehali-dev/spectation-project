import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

interface VideoData {
  title: string;
  thumbnail: string;
  duration: number;
  video_url: string;
  audio_url?: string;
  separate_streams: boolean;
  quality: string;
}

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState("720p");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        description: `Видео "${data.title}" загружено`,
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
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Icon name="Play" size={32} className="text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Spectation</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <Icon name="Link" size={24} />
              Вставьте ссылку на YouTube видео
            </h2>
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-background border-input text-foreground"
                disabled={loading}
              />
              
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Качество видео
                  </label>
                  <Select value={quality} onValueChange={setQuality} disabled={loading}>
                    <SelectTrigger className="bg-background border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="360p">360p</SelectItem>
                      <SelectItem value="480p">480p</SelectItem>
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleLoadVideo}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground mt-6"
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
                      <Icon name="PlayCircle" size={20} className="mr-2" />
                      Загрузить видео
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {videoData && (
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-foreground mb-2">{videoData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Качество: {videoData.quality} | Длительность: {Math.floor(videoData.duration / 60)}:{(videoData.duration % 60).toString().padStart(2, '0')}
                </p>
              </div>
              
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <video
                  controls
                  autoPlay
                  className="w-full h-full"
                  poster={videoData.thumbnail}
                  crossOrigin="anonymous"
                  preload="metadata"
                >
                  <source 
                    src={`https://functions.poehali.dev/296e7429-44ee-41f6-ba5f-880dc3456b3c?url=${encodeURIComponent(videoData.video_url)}`} 
                    type="video/mp4" 
                  />
                  Ваш браузер не поддерживает воспроизведение видео.
                </video>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => window.open(videoData.video_url, '_blank')}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                >
                  <Icon name="Download" size={18} className="mr-2" />
                  Скачать видео
                </Button>
                {videoData.audio_url && (
                  <Button
                    onClick={() => window.open(videoData.audio_url, '_blank')}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    <Icon name="Music" size={18} className="mr-2" />
                    Скачать аудио
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
              <Icon name="Info" size={20} />
              Как использовать
            </h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={18} className="text-primary mt-0.5" />
                <span>Скопируйте ссылку на YouTube видео</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={18} className="text-primary mt-0.5" />
                <span>Вставьте ссылку в поле выше</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={18} className="text-primary mt-0.5" />
                <span>Выберите желаемое качество видео</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={18} className="text-primary mt-0.5" />
                <span>Нажмите "Загрузить видео" и наслаждайтесь просмотром</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle2" size={18} className="text-primary mt-0.5" />
                <span>Скачайте видео или аудио на устройство при необходимости</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;