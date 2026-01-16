import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  TreePine, 
  Package, 
  Users, 
  Clock, 
  Euro,
  Search,
  Filter,
  CalendarPlus,
} from 'lucide-react';
import { mockResources } from '@/data/mockData';
import { ResourceType } from '@/types/reservation';

const resourceTypeConfig: Record<ResourceType, { title: string; icon: React.ElementType; description: string }> = {
  room: {
    title: 'Salles',
    icon: Building2,
    description: 'Salles de réunion, conférence et formation',
  },
  field: {
    title: 'Terrains',
    icon: TreePine,
    description: 'Terrains de sport et espaces extérieurs',
  },
  equipment: {
    title: 'Matériel',
    icon: Package,
    description: 'Équipements et matériel disponible à la location',
  },
};

export const ResourceListPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [priceSort, setPriceSort] = useState<string>('default');

  const resourceType = (type === 'rooms' ? 'room' : type === 'fields' ? 'field' : 'equipment') as ResourceType;
  const config = resourceTypeConfig[resourceType];
  const Icon = config.icon;

  const filteredResources = useMemo(() => {
    let resources = mockResources.filter(r => r.type === resourceType && r.isActive);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      resources = resources.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query)
      );
    }

    // Capacity filter
    if (capacityFilter !== 'all') {
      const [min, max] = capacityFilter.split('-').map(Number);
      resources = resources.filter(r => {
        const capacity = r.capacity || 0;
        if (max) {
          return capacity >= min && capacity <= max;
        }
        return capacity >= min;
      });
    }

    // Price sort
    if (priceSort === 'low') {
      resources.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (priceSort === 'high') {
      resources.sort((a, b) => b.pricePerHour - a.pricePerHour);
    }

    return resources;
  }, [resourceType, searchQuery, capacityFilter, priceSort]);

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
                <Euro className="h-4 w-4 mr-2" />
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
        {filteredResources.length === 0 ? (
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
            {filteredResources.map((resource) => (
              <Card key={resource.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="aspect-video rounded-lg bg-muted mb-3 overflow-hidden">
                    <img
                      src={resource.images[0] || '/placeholder.svg'}
                      alt={resource.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-lg">{resource.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {resource.equipment.slice(0, 3).map((eq, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                    {resource.equipment.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{resource.equipment.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {resource.capacity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{resource.capacity} pers.</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Min. {resource.minDuration}min</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium col-span-2">
                      <Euro className="h-4 w-4" />
                      <span>{resource.pricePerHour}€/heure</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link to={`/resources/${type}/${resource.id}`}>
                      Détails
                    </Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link to={`/reservations/new?resource=${resource.id}`}>
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Réserver
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
