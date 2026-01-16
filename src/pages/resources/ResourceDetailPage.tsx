import React from 'react';
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
} from 'lucide-react';
import { mockResources } from '@/data/mockData';
import { ResourceType } from '@/types/reservation';

const resourceTypeConfig: Record<ResourceType, { icon: React.ElementType }> = {
  room: { icon: Building2 },
  field: { icon: TreePine },
  equipment: { icon: Package },
};

export const ResourceDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const resource = mockResources.find(r => r.id === id);

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

  const Icon = resourceTypeConfig[resource.type].icon;

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
            {/* Image */}
            <div className="aspect-video rounded-lg bg-muted overflow-hidden">
              <img
                src={resource.images[0] || '/placeholder.svg'}
                alt={resource.name}
                className="w-full h-full object-cover"
              />
            </div>

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
                      {resource.type === 'room' && 'Salle'}
                      {resource.type === 'field' && 'Terrain'}
                      {resource.type === 'equipment' && 'Matériel'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{resource.description}</p>
                
                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Équipements inclus</h4>
                  <div className="flex flex-wrap gap-2">
                    {resource.equipment.map((eq, i) => (
                      <Badge key={i} variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Règles d'utilisation</h4>
                  <ul className="space-y-2">
                    {resource.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
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
                      <p className="text-xs text-muted-foreground">personnes</p>
                    </div>
                  )}
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{resource.minDuration}min</p>
                    <p className="text-xs text-muted-foreground">minimum</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prix horaire</span>
                  <span className="text-2xl font-bold">{resource.pricePerHour}€</span>
                </div>

                <Button className="w-full" size="lg" asChild>
                  <Link to={`/reservations/new?resource=${resource.id}`}>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée min.</span>
                  <span className="font-medium">{resource.minDuration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée max.</span>
                  <span className="font-medium">{resource.maxDuration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge variant={resource.isActive ? 'default' : 'secondary'}>
                    {resource.isActive ? 'Disponible' : 'Indisponible'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
