import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useDataSync } from '@/contexts/DataSyncContext';

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
  const { resourcesVersion } = useDataSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [priceSort, setPriceSort] = useState<string>('default');
  const [resources, setResources] = useState<any[]>([]);
  const [resourceImages, setResourceImages] = useState<Record<string, string[]>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [pausedResources, setPausedResources] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [capacityRange, setCapacityRange] = useState<[number, number]>([0, 100]);
  const [minRating, setMinRating] = useState(0);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [minBookingHours, setMinBookingHours] = useState(0);
  const thumbnailContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
  }, [resourceType, toast]); // Only reload on type change, not on version

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

    // Price range filter
    filtered = filtered.filter((r: any) => {
      const price = r.pricePerUnit || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Capacity range filter
    if (resourceType !== 'equipment') {
      filtered = filtered.filter((r: any) => {
        const capacity = r.capacity || 0;
        return capacity >= capacityRange[0] && capacity <= capacityRange[1];
      });
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter((r: any) => (r.averageRating || 0) >= minRating);
    }

    // Features filter (must have all selected features)
    if (selectedFeatures.length > 0) {
      filtered = filtered.filter((r: any) => {
        const features = r.features || [];
        return selectedFeatures.every((feat: string) => features.includes(feat));
      });
    }

    // Min booking hours filter
    if (minBookingHours > 0) {
      filtered = filtered.filter((r: any) => (r.minBookingHours || 0) <= minBookingHours);
    }

    // Price sort
    if (priceSort === 'low') {
      filtered.sort((a: any, b: any) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0));
    } else if (priceSort === 'high') {
      filtered.sort((a: any, b: any) => (b.pricePerUnit || 0) - (a.pricePerUnit || 0));
    }

    return filtered;
  }, [resources, searchQuery, priceRange, capacityRange, minRating, selectedFeatures, minBookingHours, priceSort, resourceType]);

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

          {/* Filters - Search Left, Advanced Filters Right */}
          <div className="flex flex-col gap-3">
            {/* Search and Advanced Filters Row */}
            <div className="flex gap-3 items-center">
              {/* Search on Left */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Advanced Filters Toggle on Right */}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 whitespace-nowrap"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Masquer' : 'Filtres avancés'}
                {selectedFeatures.length > 0 || minRating > 0 || minBookingHours > 0 || priceRange[0] > 0 || priceRange[1] < 1000 || capacityRange[0] > 0 || capacityRange[1] < 100 ? (
                  <Badge className="ml-1 bg-primary text-xs">
                    {[
                      selectedFeatures.length > 0 ? 1 : 0,
                      minRating > 0 ? 1 : 0,
                      minBookingHours > 0 ? 1 : 0,
                      priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0,
                      capacityRange[0] > 0 || capacityRange[1] < 100 ? 1 : 0,
                    ].reduce((a, b) => a + b)}
                  </Badge>
                ) : null}
              </Button>
            </div>

            {/* Advanced Filters Panel - Full Width Below */}
            {showFilters && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {/* Price Range */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold">Prix (DH)</label>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {priceRange[0]}-{priceRange[1]}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[0]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                        }}
                        className="w-full accent-primary h-1"
                      />
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                        }}
                        className="w-full accent-primary h-1"
                      />
                    </div>
                  </div>

                  {/* Capacity Range - Only for terrain/salle */}
                  {resourceType !== 'equipment' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold">Capacité</label>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {capacityRange[0]}-{capacityRange[1]}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="0"
                          max="500"
                          value={capacityRange[0]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val <= capacityRange[1]) setCapacityRange([val, capacityRange[1]]);
                          }}
                          className="w-full accent-primary h-1"
                        />
                        <input
                          type="range"
                          min="0"
                          max="500"
                          value={capacityRange[1]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= capacityRange[0]) setCapacityRange([capacityRange[0], val]);
                          }}
                          className="w-full accent-primary h-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Min Rating */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Note min.</label>
                    <Select value={String(minRating)} onValueChange={(val) => setMinRating(parseInt(val))}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Tous</SelectItem>
                        <SelectItem value="1">⭐ 1+</SelectItem>
                        <SelectItem value="2">⭐ 2+</SelectItem>
                        <SelectItem value="3">⭐ 3+</SelectItem>
                        <SelectItem value="4">⭐ 4+</SelectItem>
                        <SelectItem value="5">⭐ 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min Booking Hours */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Durée min.</label>
                    <Select value={String(minBookingHours)} onValueChange={(val) => setMinBookingHours(parseInt(val))}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Pas de limite</SelectItem>
                        <SelectItem value="1">Max 1h</SelectItem>
                        <SelectItem value="2">Max 2h</SelectItem>
                        <SelectItem value="4">Max 4h</SelectItem>
                        <SelectItem value="8">Max 8h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort by Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold">Trier par</label>
                    <Select value={priceSort} onValueChange={setPriceSort}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Par défaut</SelectItem>
                        <SelectItem value="low">Prix ↑</SelectItem>
                        <SelectItem value="high">Prix ↓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        setPriceRange([0, 1000]);
                        setCapacityRange([0, 100]);
                        setMinRating(0);
                        setSelectedFeatures([]);
                        setMinBookingHours(0);
                        setPriceSort('default');
                        setSearchQuery('');
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
              <p className="text-muted-foreground mb-4">Aucune ressource trouvée</p>
              <Button variant="outline" onClick={() => { 
                setSearchQuery(''); 
                setPriceRange([0, 1000]);
                setCapacityRange([0, 100]);
                setMinRating(0);
                setSelectedFeatures([]);
                setMinBookingHours(0);
                setPriceSort('default');
                setShowFilters(false);
              }}>
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
