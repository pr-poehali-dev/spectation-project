import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [quality, setQuality] = useState("720p");
  const [embedUrl, setEmbedUrl] = useState("");
  const { toast } = useToast();

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleLoadVideo = () => {
    if (!videoUrl) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите ссылку на видео",
        variant: "destructive",
      });
      return;
    }

    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      toast({
        title: "Ошибка",
        description: "Неверная ссылка YouTube",
        variant: "destructive",
      });
      return;
    }

    setEmbedUrl(`https://www.youtube.com/embed/${videoId}?vq=${quality}`);
    toast({
      title: "Успешно",
      description: "Видео загружено",
    });
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
              />
              
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Качество видео
                  </label>
                  <Select value={quality} onValueChange={setQuality}>
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
                >
                  <Icon name="PlayCircle" size={20} className="mr-2" />
                  Загрузить видео
                </Button>
              </div>
            </div>
          </div>

          {embedUrl && (
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={embedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
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
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
