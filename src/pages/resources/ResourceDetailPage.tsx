import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  TreePine, 
  Package, 
  Users, 
  Clock, 
  Euro,
  CalendarPlus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  MessageCircle,
} from 'lucide-react';
import { resourcesAPI, mediaAPI, reviewsAPI } from '@/lib/api';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ResourceType } from '@/types/reservation';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

const resourceTypeConfig: Record<ResourceType, { icon: React.ElementType }> = {
  terrain: { icon: TreePine },
  salle: { icon: Building2 },
  equipment: { icon: Package },
};

export const ResourceDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resource, setResource] = useState<any>(null);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });

  useEffect(() => {
    const loadResource = async () => {
      try {
        setIsLoading(true);
        const [resourceRes, mediaRes, reviewsRes] = await Promise.all([
          resourcesAPI.getById(id!),
          mediaAPI.getByResource(id!, { mediaType: 'image' }).catch(() => ({ mediaAssets: [] })),
          reviewsAPI.getAll({ resourceId: id, page: 1, limit: 100 }).catch(() => ({ reviews: [] })),
        ]);
        setResource(resourceRes.resource);
        setMediaAssets(mediaRes.mediaAssets || []);
        
        // Load and process reviews
        const resourceReviews = reviewsRes.reviews || [];
        setReviews(resourceReviews);
        
        if (resourceReviews.length > 0) {
          const avgRating = (resourceReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / resourceReviews.length).toFixed(1);
          setReviewStats({
            averageRating: parseFloat(avgRating),
            totalReviews: resourceReviews.length,
          });
        }
      } catch (error: any) {
        console.error('Error loading resource:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la ressource.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadResource();
    }
  }, [id, toast]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!resource) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Ressource non trouvée</h2>
          <p className="text-muted-foreground mb-4">
            Cette ressource n'existe pas ou a été supprimée.
          </p>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </AppLayout>
    );
  }

  const Icon = resourceTypeConfig[resource.type as ResourceType]?.icon || Building2;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {mediaAssets.length > 0 ? (
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-video rounded-lg bg-muted overflow-hidden group">
                  <img
                    src={getImageUrl(mediaAssets[selectedImageIndex]?.originalUrl)}
                    alt={resource.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  {/* Navigation arrows */}
                  {mediaAssets.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : mediaAssets.length - 1))}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedImageIndex((prev) => (prev < mediaAssets.length - 1 ? prev + 1 : 0))}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Gallery */}
                {mediaAssets.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
                    {mediaAssets.map((media: any, index: number) => (
                      <button
                        key={media._id || media.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getImageUrl(media.originalUrl)}
                          alt={media.altText || media.originalName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                <img
                  src="/placeholder.svg"
                  alt={resource.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{resource.name}</CardTitle>
                    <CardDescription>
                      {resource.type === 'salle' && 'Salle de sport'}
                      {resource.type === 'terrain' && 'Terrain de sport'}
                      {resource.type === 'equipment' && 'Équipement'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{resource.description || resource.shortDescription}</p>
                
                {(resource.features && resource.features.length > 0) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Caractéristiques</h4>
                      <div className="flex flex-wrap gap-2">
                        {resource.features.map((feat: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {feat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {resource.requirements && Object.keys(resource.requirements).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Exigences</h4>
                      <ul className="space-y-2">
                        {Object.entries(resource.requirements).map(([key, value]: [string, any], i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Booking card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Réserver</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {resource.capacity && (
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">{resource.capacity}</p>
                      <p className="text-xs text-muted-foreground">
                        {resource.type === 'terrain' ? 'joueurs' :
                         resource.type === 'salle' ? 'personnes' :
                         resource.unit === 'persons' ? 'personnes' :
                         resource.unit === 'items' ? 'articles' :
                         resource.unit === 'square_meters' ? 'm²' : 'unités'}
                      </p>
                    </div>
                  )}
                  {resource.minBookingHours && (
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">{resource.minBookingHours}h</p>
                      <p className="text-xs text-muted-foreground">minimum</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prix</span>
                  <span className="text-2xl font-bold">{resource.pricePerUnit}€/{resource.pricingModel === 'hourly' ? 'heure' : resource.pricingModel}</span>
                </div>

                <Button className="w-full" size="lg" asChild>
                  <Link to={`/reservations/new?resource=${resource._id || resource.id}`}>
                    <CalendarPlus className="h-5 w-5 mr-2" />
                    Réserver maintenant
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {resource.minBookingHours && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée min.</span>
                    <span className="font-medium">{resource.minBookingHours} h</span>
                  </div>
                )}
                {resource.maxBookingHours && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée max.</span>
                    <span className="font-medium">{resource.maxBookingHours} h</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge variant={resource.status === 'active' ? 'default' : 'secondary'}>
                    {resource.status === 'active' ? 'Disponible' : resource.status === 'maintenance' ? 'Maintenance' : 'Indisponible'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      <CardTitle>Avis & Commentaires</CardTitle>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-400">{reviewStats.averageRating}</p>
                        <p className="text-xs text-muted-foreground">{reviewStats.totalReviews} avis</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {reviews.slice(0, 5).map((review) => (
                      <ReviewCard key={review._id || review.id} review={review} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
