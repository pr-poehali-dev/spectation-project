import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

interface SearchResult {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  view_count: number;
  description: string;
}

interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
  uploader: string;
}

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [quality, setQuality] = useState("720p");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("download");
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
          action: "download",
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

  const handleSearch = async () => {
    if (!searchQuery) {
      toast({
        title: "Ошибка",
        description: "Введите поисковый запрос",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearchResults([]);

    try {
      const response = await fetch("https://functions.poehali.dev/ffd1c2de-6c6e-4542-aa4f-9b15b312a383", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "search",
          query: searchQuery,
          max_results: 12,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка поиска");
      }

      setSearchResults(data.results);
      toast({
        title: "Успешно",
        description: `Найдено ${data.count} видео`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось выполнить поиск",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadPlaylist = async () => {
    if (!playlistUrl) {
      toast({
        title: "Ошибка",
        description: "Введите ссылку на плейлист",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setPlaylistVideos([]);
    setPlaylistTitle("");

    try {
      const response = await fetch("https://functions.poehali.dev/ffd1c2de-6c6e-4542-aa4f-9b15b312a383", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "playlist",
          url: playlistUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки плейлиста");
      }

      setPlaylistVideos(data.videos);
      setPlaylistTitle(data.playlist_title);
      toast({
        title: "Успешно",
        description: `Загружено ${data.count} видео из плейлиста`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось загрузить плейлист",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (url: string) => {
    setVideoUrl(url);
    setActiveTab("download");
    setTimeout(() => handleLoadVideo(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="bg-gradient-to-br from-primary to-primary/60 p-2.5 rounded-xl shadow-lg animate-pulse-glow">
              <Icon name="Video" size={28} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Spectation Pro
              </h1>
              <p className="text-xs text-muted-foreground">Мощный инструмент для работы с YouTube</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden md:flex gap-1">
            <Icon name="Sparkles" size={14} />
            Premium
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="download" className="gap-2">
                <Icon name="Download" size={18} />
                Скачать
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-2">
                <Icon name="Search" size={18} />
                Поиск
              </TabsTrigger>
              <TabsTrigger value="playlist" className="gap-2">
                <Icon name="ListVideo" size={18} />
                Плейлист
              </TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="space-y-6 animate-fade-in">
              <Card className="border-border bg-card/60 backdrop-blur shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Icon name="Link" size={24} />
                    Скачать видео с YouTube
                  </CardTitle>
                  <CardDescription>
                    Вставьте ссылку на видео и выберите качество
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
                      className="bg-background/50 border-input text-foreground text-base h-12"
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-sm font-medium text-foreground">
                        Качество видео
                      </label>
                      <Select value={quality} onValueChange={setQuality} disabled={loading}>
                        <SelectTrigger className="bg-background/50 border-input text-foreground h-12">
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
                <Card className="border-border bg-card/60 backdrop-blur overflow-hidden shadow-lg animate-fade-in">
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
                        <Badge variant="secondary" className="gap-1">
                          <Icon name="Tv" size={14} />
                          {videoData.quality}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleDownload(videoData.direct_video_url, `${videoData.title}.mp4`)}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md"
                      >
                        <Icon name="Download" size={18} className="mr-2" />
                        Скачать видео
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
                        Открыть в новой вкладке
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-6 animate-fade-in">
              <Card className="border-border bg-card/60 backdrop-blur shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Icon name="Search" size={24} />
                    Поиск видео на YouTube
                  </CardTitle>
                  <CardDescription>
                    Найдите нужное видео без открытия YouTube
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="Введите поисковый запрос..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-background/50 border-input text-foreground text-base h-12"
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button 
                      onClick={handleSearch}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground h-12 shadow-lg px-8"
                      disabled={loading}
                    >
                      {loading ? (
                        <Icon name="Loader2" size={20} className="animate-spin" />
                      ) : (
                        <>
                          <Icon name="Search" size={20} className="mr-2" />
                          Поиск
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                  {searchResults.map((video) => (
                    <Card 
                      key={video.id} 
                      className="border-border bg-card/60 backdrop-blur overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                      onClick={() => handleVideoClick(video.url)}
                    >
                      <div className="relative aspect-video bg-black">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 text-sm">
                          {video.title}
                        </h3>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Icon name="User" size={12} />
                            {video.uploader}
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon name="Eye" size={12} />
                            {formatViews(video.view_count)} просмотров
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlist" className="space-y-6 animate-fade-in">
              <Card className="border-border bg-card/60 backdrop-blur shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Icon name="ListVideo" size={24} />
                    Загрузить плейлист
                  </CardTitle>
                  <CardDescription>
                    Получите список всех видео из плейлиста
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="https://www.youtube.com/playlist?list=..."
                      value={playlistUrl}
                      onChange={(e) => setPlaylistUrl(e.target.value)}
                      className="bg-background/50 border-input text-foreground text-base h-12"
                      disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleLoadPlaylist()}
                    />
                    <Button 
                      onClick={handleLoadPlaylist}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground h-12 shadow-lg px-8"
                      disabled={loading}
                    >
                      {loading ? (
                        <Icon name="Loader2" size={20} className="animate-spin" />
                      ) : (
                        <>
                          <Icon name="ListVideo" size={20} className="mr-2" />
                          Загрузить
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {playlistVideos.length > 0 && (
                <>
                  <Card className="border-border bg-card/60 backdrop-blur shadow-lg animate-fade-in">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="ListVideo" size={20} />
                        {playlistTitle}
                      </CardTitle>
                      <CardDescription>
                        {playlistVideos.length} видео в плейлисте
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                    {playlistVideos.map((video) => (
                      <Card 
                        key={video.id} 
                        className="border-border bg-card/60 backdrop-blur overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                        onClick={() => handleVideoClick(video.url)}
                      >
                        <div className="relative aspect-video bg-black">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-foreground line-clamp-2 mb-2 text-sm">
                            {video.title}
                          </h3>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Icon name="User" size={12} />
                            {video.uploader}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <Card className="border-border bg-card/60 backdrop-blur shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Icon name="Zap" size={20} />
                Возможности Spectation Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="Download" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Скачивание видео</h4>
                    <p className="text-sm text-muted-foreground">
                      Загружайте видео в любом качестве от 360p до 1080p
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="Search" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Умный поиск</h4>
                    <p className="text-sm text-muted-foreground">
                      Находите нужные видео без открытия YouTube
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="ListVideo" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Работа с плейлистами</h4>
                    <p className="text-sm text-muted-foreground">
                      Загружайте все видео из плейлиста одним кликом
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="Music" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Извлечение аудио</h4>
                    <p className="text-sm text-muted-foreground">
                      Скачивайте только аудиодорожку из видео
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-8 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Spectation Pro — мощный инструмент для работы с YouTube
          </p>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="Zap" size={12} />
              Быстрая загрузка
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Shield" size={12} />
              Безопасно
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Sparkles" size={12} />
              Без ограничений
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
