import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Users,
  Dumbbell,
  Building2,
  MapPinned,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { resourcesAPI, mediaAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/lib/utils';

export const MyResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const { resourcesVersion, triggerRefresh, checkForUpdates } = useDataSync();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [resources, setResources] = useState<any[]>([]);
  const [resourceImages, setResourceImages] = useState<Record<string, string[]>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [pausedResources, setPausedResources] = useState<Record<string, boolean>>({});
  const thumbnailContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        const params: any = { page: 1, limit: 1000 };
        if (user?.role === 'admin' && user?.id) {
          params.managerId = user.id;
        }
        const response = await resourcesAPI.getAll(params);
        const myResources = response.resources || [];
        setResources(myResources);
        
        // Load ALL images for each resource
        const imagesMap: Record<string, string[]> = {};
        const indexMap: Record<string, number> = {};
        await Promise.all(
          myResources.map(async (resource: any) => {
            try {
              const mediaRes = await mediaAPI.getByResource(resource._id || resource.id, { mediaType: 'image' });
              const images = (mediaRes.mediaAssets || [])
                .map((media: any) => getImageUrl(media.originalUrl))
                .filter((url: string) => url !== '/placeholder.svg');
              if (images.length > 0) {
                imagesMap[resource._id || resource.id] = images;
                indexMap[resource._id || resource.id] = 0;
              }
            } catch (error) {
              // Ignore errors for individual images
            }
          })
        );
        setResourceImages(imagesMap);
        setSelectedImageIndex(indexMap);
      } catch (error: any) {
        console.error('Error loading resources:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger vos ressources.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      loadResources();
    }
  }, [user, toast]); // Only reload on mount, not on version changes

  // Auto-scroll to selected thumbnail (only when manually changed, not during auto-play)
  useEffect(() => {
    Object.entries(selectedImageIndex).forEach(([resourceId, currentIndex]) => {
      const container = thumbnailContainerRefs.current[resourceId];
      if (container && container.children[currentIndex]) {
        const selectedThumb = container.children[currentIndex] as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const thumbRect = selectedThumb.getBoundingClientRect();
        
        // Only scroll if thumbnail is not fully visible in container
        const isVisible = 
          thumbRect.left >= containerRect.left &&
          thumbRect.right <= containerRect.right;
        
        if (!isVisible) {
          // Use scrollLeft instead of scrollIntoView to avoid page scroll issues
          const scrollLeft = selectedThumb.offsetLeft - (container.offsetWidth / 2) + (selectedThumb.offsetWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    });
  }, [selectedImageIndex]);

  // Auto-play images every 1 second
  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {};

    resources.forEach((resource: any) => {
      const resourceId = resource._id || resource.id;
      const images = resourceImages[resourceId] || [];
      const isPaused = pausedResources[resourceId];

      if (images.length > 1 && !isPaused) {
        intervals[resourceId] = setInterval(() => {
          setSelectedImageIndex((prev) => {
            const currentIndex = prev[resourceId] || 0;
            const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
            return { ...prev, [resourceId]: nextIndex };
          });
        }, 1000); // Change image every 1 second
      }
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [resources, resourceImages, pausedResources]);

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
      return;
    }

    try {
      await resourcesAPI.delete(id);
      setResources(prev => prev.filter((r: any) => (r._id || r.id) !== id));
      
      // Trigger immediate data sync
      triggerRefresh('resources');
      await checkForUpdates();
      
      toast({
        title: 'Ressource supprimée',
        description: 'La ressource a été supprimée avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la ressource.',
        variant: 'destructive',
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'salle': return <Building2 className="h-4 w-4" />;
      case 'terrain': return <MapPinned className="h-4 w-4" />;
      case 'equipment': return <Dumbbell className="h-4 w-4" />;
      default: return <Dumbbell className="h-4 w-4" />;
    }
  };

  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Vous devez être propriétaire pour accéder à cette page.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mes ressources</h1>
            <p className="text-muted-foreground">
              Gérez vos ressources, fixez les prix et recevez des réservations
            </p>
          </div>
          <Button asChild>
            <Link to="/resources/new">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ressource
            </Link>
          </Button>
        </div>

        {resources.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucune ressource</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter votre première ressource à louer.
              </p>
              <Button asChild>
                <Link to="/resources/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ressource
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource: any) => (
              <Card key={resource._id || resource.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div 
                    className="relative aspect-video rounded-lg bg-muted mb-3 overflow-hidden group"
                    onMouseEnter={() => setPausedResources(prev => ({ ...prev, [resource._id || resource.id]: true }))}
                    onMouseLeave={() => setPausedResources(prev => ({ ...prev, [resource._id || resource.id]: false }))}
                  >
                    {(() => {
                      const resourceId = resource._id || resource.id;
                      const images = resourceImages[resourceId] || [];
                      const currentIndex = selectedImageIndex[resourceId] || 0;
                      const currentImage = images[currentIndex] || '/placeholder.svg';
                      
                      return (
                        <>
                          <img
                            src={currentImage}
                            alt={resource.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          {/* Navigation arrows if multiple images */}
                          {images.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                                  setSelectedImageIndex(prev => ({ ...prev, [resourceId]: newIndex }));
                                }}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                                  setSelectedImageIndex(prev => ({ ...prev, [resourceId]: newIndex }));
                                }}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              {/* Image counter */}
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {currentIndex + 1} / {images.length}
                              </div>
                              {/* Thumbnail strip - Always visible with scrolling */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div 
                                  className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-thin scrollbar-thumb-white/70 scrollbar-track-white/20 hover:scrollbar-thumb-white pb-2"
                                  style={{ scrollbarWidth: 'thin' }}
                                  ref={(el) => {
                                    thumbnailContainerRefs.current[resourceId] = el;
                                  }}
                                >
                                  {images.map((img: string, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedImageIndex(prev => ({ ...prev, [resourceId]: idx }));
                                      }}
                                      className={`flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all transform ${
                                        idx === currentIndex 
                                          ? 'border-white shadow-lg scale-110' 
                                          : 'border-white/30 opacity-70 hover:opacity-100 hover:border-white/60 hover:scale-105'
                                      }`}
                                    >
                                      <img
                                        src={img}
                                        alt={`${resource.name} ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                                        }}
                                      />
                                    </button>
                                  ))}
                                </div>
                                {/* Scroll indicator */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white/60 text-xs flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                  <span>Scroll</span>
                                </div>
                              </div>
                            </>
                          )}
                          {/* Image count badge */}
                          {images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {images.length}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{resource.name}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {resource.description || resource.shortDescription}
                      </CardDescription>
                    </div>
                    <Badge variant={resource.status === 'active' ? 'default' : 'secondary'}>
                      {resource.status === 'active' ? 'Active' : resource.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getResourceIcon(resource.type)}
                      <span className="capitalize">{resource.type}</span>
                    </div>
                    {resource.capacity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{resource.capacity}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-medium">
                      <span className="font-bold text-amber-600">DH</span>
                      <span>{resource.pricePerUnit} DH/{resource.pricingModel === 'hourly' ? 'h' : resource.pricingModel}</span>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={() => navigate(`/resources/${resource._id || resource.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/resources/${resource._id || resource.id}/media`)}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Médias
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => handleDelete(resource._id || resource.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

