import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  MapPinned, 
  Dumbbell, 
  Users, 
  Clock, 
  Search,
  Filter,
  CalendarPlus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { resourcesAPI, mediaAPI } from '@/lib/api';
import { ResourceType } from '@/types/reservation';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/utils';

const resourceTypeConfig: Record<ResourceType, { title: string; icon: React.ElementType; description: string }> = {
  terrain: {
    title: 'Terrains de sport',
    icon: MapPinned,
    description: 'Terrains de tennis, basketball, football, etc.',
  },
  salle: {
    title: 'Salles de sport',
    icon: Building2,
    description: 'Salles de sport, fitness, yoga, etc.',
  },
  equipment: {
    title: 'Équipements',
    icon: Dumbbell,
    description: 'Équipements sportifs à louer (raquettes, ballons, etc.)',
  },
};

export const ResourceListPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [priceSort, setPriceSort] = useState<string>('default');
  const [resources, setResources] = useState<any[]>([]);
  const [resourceImages, setResourceImages] = useState<Record<string, string[]>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const resourceType = useMemo(() => {
    return (type === 'terrains' ? 'terrain' : type === 'salles' ? 'salle' : 'equipment') as ResourceType;
  }, [type]);
  
  const config = resourceType ? resourceTypeConfig[resourceType] : resourceTypeConfig.terrain;
  const Icon = config?.icon || MapPinned;

  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        const response = await resourcesAPI.getAll({
          type: resourceType,
          status: 'active',
          page: 1,
          limit: 1000,
        });
        const resourcesList = response.resources || [];
        setResources(resourcesList);
        
        // Load ALL images for each resource
        const imagesMap: Record<string, string[]> = {};
        const indexMap: Record<string, number> = {};
        await Promise.all(
          resourcesList.map(async (resource: any) => {
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
          description: 'Impossible de charger les ressources.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (resourceType) {
      loadResources();
    }
  }, [resourceType, toast]);

  const filteredResources = useMemo(() => {
    let filtered = resources.filter((r: any) => r.status === 'active');

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r: any) => 
        r.name?.toLowerCase().includes(query) || 
        r.description?.toLowerCase().includes(query)
      );
    }

    // Capacity filter
    if (capacityFilter !== 'all') {
      const [min, max] = capacityFilter.split('-').map(Number);
      filtered = filtered.filter((r: any) => {
        const capacity = r.capacity || 0;
        if (max) {
          return capacity >= min && capacity <= max;
        }
        return capacity >= min;
      });
    }

    // Price sort
    if (priceSort === 'low') {
      filtered.sort((a: any, b: any) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0));
    } else if (priceSort === 'high') {
      filtered.sort((a: any, b: any) => (b.pricePerUnit || 0) - (a.pricePerUnit || 0));
    }

    return filtered;
  }, [resources, searchQuery, capacityFilter, priceSort]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{config.title}</h1>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {resourceType !== 'equipment' && (
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Capacité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes capacités</SelectItem>
                  <SelectItem value="1-5">1-5 personnes</SelectItem>
                  <SelectItem value="6-15">6-15 personnes</SelectItem>
                  <SelectItem value="16-30">16-30 personnes</SelectItem>
                  <SelectItem value="30-">30+ personnes</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={priceSort} onValueChange={setPriceSort}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <span className="text-sm font-semibold mr-2">DH</span>
                <SelectValue placeholder="Trier par prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Par défaut</SelectItem>
                <SelectItem value="low">Prix croissant</SelectItem>
                <SelectItem value="high">Prix décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resources grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredResources.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Aucune ressource trouvée</p>
              <Button variant="link" onClick={() => { setSearchQuery(''); setCapacityFilter('all'); }}>
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource: any) => (
              <div
                key={resource._id || resource.id}
                onClick={() => window.location.href = `/resources/${type}/${resource._id || resource.id}`}
                className="block cursor-pointer"
              >
              <Card className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="relative aspect-video rounded-lg bg-muted mb-3 overflow-hidden group">
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
                              {/* Thumbnail strip */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-white/50 scrollbar-track-transparent">
                                  {images.map((img: string, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedImageIndex(prev => ({ ...prev, [resourceId]: idx }));
                                      }}
                                      className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                                        idx === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
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
                  <CardTitle className="text-lg">{resource.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {resource.description || resource.shortDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {resource.features?.slice(0, 3).map((feat: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {feat}
                      </Badge>
                    ))}
                    {resource.features?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.features.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {resource.capacity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {resource.capacity} {
                            resource.type === 'terrain' ? 'joueurs' :
                            resource.type === 'salle' ? 'pers.' :
                            resource.unit === 'players' ? 'joueurs' :
                            resource.unit === 'persons' ? 'pers.' :
                            resource.unit === 'items' ? 'articles' :
                            resource.unit === 'square_meters' ? 'm²' : ''
                          }
                        </span>
                      </div>
                    )}
                    {resource.minBookingHours && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Min. {resource.minBookingHours}h</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-medium col-span-2">
                      <span className="font-bold text-amber-600">DH</span>
                      <span>{resource.pricePerUnit} DH/{resource.pricingModel === 'hourly' ? 'heure' : resource.pricingModel}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 gap-2">
                  <Button variant="outline" className="flex-1" onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/resources/${type}/${resource._id || resource.id}`;
                  }}>
                    Détails
                  </Button>
                  <Button className="flex-1" onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/reservations/new?resource=${resource._id || resource.id}`;
                  }}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Réserver
                  </Button>
                </CardFooter>
              </Card>
            </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
