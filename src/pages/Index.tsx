import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";

interface VideoFormat {
  quality: string;
  height: number;
  fps: number;
  url: string;
  ext: string;
  filesize: number;
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
  channel: string;
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

const Index = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [quality, setQuality] = useState("720p");
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [activeTab, setActiveTab] = useState("download");
  const [dialogVideo, setDialogVideo] = useState<VideoData | null>(null);
  const [loadingDialog, setLoadingDialog] = useState(false);
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}.${month}.${year}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
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
          max_results: 20,
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

  const handleVideoClick = (url: string) => {
    setVideoUrl(url);
    setActiveTab("download");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleWatchInSearch = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingDialog(true);
    setDialogVideo(null);

    try {
      const response = await fetch("https://functions.poehali.dev/ffd1c2de-6c6e-4542-aa4f-9b15b312a383", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "download",
          url: url,
          quality: "720p",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при загрузке видео");
      }

      setDialogVideo(data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось загрузить видео",
        variant: "destructive",
      });
    } finally {
      setLoadingDialog(false);
    }
  };

  const plyrOptions = {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
    settings: ['speed', 'quality'],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="download" className="flex items-center gap-2">
                <Icon name="Download" size={18} />
                Скачать видео
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Icon name="Search" size={18} />
                Поиск видео
              </TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="space-y-6">
              <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-foreground text-xl">
                        <Icon name="Link" size={22} />
                        Загрузить видео с YouTube
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Любые ссылки: youtube.com, youtu.be, shorts, embed — все форматы поддерживаются
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
                      placeholder="https://www.youtube.com/watch?v=... или https://youtu.be/... или /shorts/..."
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
                          <SelectItem value="360p">360p - Базовое качество</SelectItem>
                          <SelectItem value="480p">480p - Стандартное</SelectItem>
                          <SelectItem value="720p">720p - HD качество</SelectItem>
                          <SelectItem value="1080p">1080p - Full HD</SelectItem>
                          <SelectItem value="1440p">1440p - 2K</SelectItem>
                          <SelectItem value="2160p">2160p - 4K</SelectItem>
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
                <Card className="border-border bg-card/80 backdrop-blur-sm overflow-hidden shadow-xl">
                  <div className="aspect-video w-full bg-black">
                    <Plyr
                      source={{
                        type: 'video',
                        sources: [
                          {
                            src: videoData.video_url,
                            type: 'video/mp4',
                          },
                        ],
                        poster: videoData.thumbnail,
                      }}
                      options={plyrOptions}
                    />
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
                          Все доступные форматы ({videoData.formats.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {videoData.formats.map((format, idx) => (
                            <Button
                              key={idx}
                              variant="secondary"
                              size="sm"
                              className="flex flex-col h-auto py-2 gap-0.5"
                              onClick={() => {
                                window.open(`https://functions.poehali.dev/296e7429-44ee-41f6-ba5f-880dc3456b3c?url=${format.url}`, '_blank');
                              }}
                            >
                              <span className="font-bold">{format.height}p</span>
                              <span className="text-xs text-muted-foreground">
                                {format.fps ? `${format.fps}fps` : format.ext}
                              </span>
                              {format.filesize > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {formatFileSize(format.filesize)}
                                </span>
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-foreground text-xl">
                    <Icon name="Search" size={22} />
                    Поиск видео на YouTube
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Введите название видео, канала или ключевые слова
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
                          Найти
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((result) => (
                    <Card 
                      key={result.id}
                      className="border-border bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all overflow-hidden group"
                    >
                      <div 
                        className="relative aspect-video w-full bg-secondary/20 cursor-pointer" 
                        onClick={(e) => handleWatchInSearch(result.url, e)}
                      >
                        <img 
                          src={result.thumbnail} 
                          alt={result.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-primary rounded-full p-4">
                            <Icon name="Play" size={32} className="text-primary-foreground" />
                          </div>
                        </div>
                        {result.duration > 0 && (
                          <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                            {formatDuration(result.duration)}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 leading-tight">
                          {result.title}
                        </h3>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Icon name="User" size={12} />
                            <span className="truncate">{result.uploader}</span>
                          </div>
                          {result.view_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Icon name="Eye" size={12} />
                              <span>{formatViews(result.view_count)} просмотров</span>
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleVideoClick(result.url)}
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        >
                          <Icon name="Download" size={14} className="mr-2" />
                          Скачать
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
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
                    <Icon name="Link2" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Любые ссылки</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      YouTube, Shorts, youtu.be, embed — все форматы
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Film" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Plyr плеер</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Современный и быстрый видеоплеер
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Search" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Просмотр прямо в поиске</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Смотрите видео без перехода на другие страницы
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <Icon name="Info" size={20} />
                  Поддерживаемые форматы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon name="Check" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Обычные видео</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      youtube.com/watch?v=...
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon name="Check" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Shorts</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      youtube.com/shorts/...
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon name="Check" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Короткие ссылки</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      youtu.be/...
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon name="Check" size={16} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">Качество до 4K</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      От 360p до 2160p (4K)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={!!dialogVideo || loadingDialog} onOpenChange={() => setDialogVideo(null)}>
        <DialogContent className="max-w-4xl p-0 bg-card">
          {loadingDialog && (
            <div className="flex items-center justify-center h-[500px]">
              <Icon name="Loader2" size={48} className="animate-spin text-primary" />
            </div>
          )}
          {dialogVideo && !loadingDialog && (
            <div>
              <div className="aspect-video w-full bg-black">
                <Plyr
                  source={{
                    type: 'video',
                    sources: [
                      {
                        src: dialogVideo.video_url,
                        type: 'video/mp4',
                      },
                    ],
                    poster: dialogVideo.thumbnail,
                  }}
                  options={plyrOptions}
                />
              </div>
              <div className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {dialogVideo.title}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <Icon name="User" size={12} />
                    {dialogVideo.uploader}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <Icon name="Eye" size={12} />
                    {formatViews(dialogVideo.view_count)} просмотров
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1.5">
                    <Icon name="Monitor" size={12} />
                    {dialogVideo.quality}
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDownload(dialogVideo.direct_video_url, `${dialogVideo.title}.mp4`)}
                    className="bg-primary text-primary-foreground"
                  >
                    <Icon name="Download" size={16} className="mr-2" />
                    Скачать видео
                  </Button>
                  {dialogVideo.direct_audio_url && (
                    <Button
                      onClick={() => handleDownload(dialogVideo.direct_audio_url!, `${dialogVideo.title}.mp3`)}
                      variant="secondary"
                    >
                      <Icon name="Music" size={16} className="mr-2" />
                      Скачать аудио
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
