import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { resourcesAPI, mediaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/lib/utils';
import { Input } from '@/components/ui/input';    
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Resource {
  _id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  manager: { firstName: string; lastName: string; email: string };
  createdBy?: { firstName: string; lastName: string; email?: string };
  status: 'active' | 'inactive' | 'maintenance';
  pricePerUnit: number;
  currency: string;
  capacity?: number;
  location?: string;
  createdAt: string;
  imageUrl?: string;
}

const typeEmojis: Record<string, string> = {
  terrain: '⚽',
  salle: '🏛️',
  equipment: '📦',
  default: '📦',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-300',
  inactive: 'bg-gray-100 text-gray-800 border-gray-300',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const statusEmojis: Record<string, string> = {
  active: '✅',
  inactive: '⏸️',
  maintenance: '🔧',
};

export const AdminResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [resourceImages, setResourceImages] = useState<Record<string, string>>({});
  const [editFormData, setEditFormData] = useState({
    status: '',
    pricePerUnit: 0,
  });
  const { toast } = useToast();

  // Fetch all resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/resources?admin=true&limit=100', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch resources');
        const data = await response.json();
        const resourceList = data.resources || data || [];
        setResources(Array.isArray(resourceList) ? resourceList : []);
        
        // Load first image for each resource
        const imagesMap: Record<string, string> = {};
        await Promise.all(
          (Array.isArray(resourceList) ? resourceList : []).map(async (resource: any) => {
            try {
              const mediaRes = await mediaAPI.getByResource(resource._id || resource.id, { mediaType: 'image' });
              const images = (mediaRes.mediaAssets || [])
                .map((media: any) => getImageUrl(media.originalUrl))
                .filter((url: string) => url !== '/placeholder.svg');
              if (images.length > 0) {
                imagesMap[resource._id || resource.id] = images[0];
              }
            } catch (error) {
              // Ignore errors for individual images
            }
          })
        );
        setResourceImages(imagesMap);
      } catch (error: any) {
        console.error('Fetch error:', error);
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de charger les ressources',
          variant: 'destructive',
        });
        setResources([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [toast]);

  // Filter resources based on type, status, and search
  useEffect(() => {
    let filtered = resources;

    if (typeFilter !== 'all') {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.manager.firstName.toLowerCase().includes(query) ||
          r.manager.lastName.toLowerCase().includes(query)
      );
    }

    setFilteredResources(filtered);
  }, [resources, typeFilter, statusFilter, searchQuery]);

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setEditFormData({
      status: resource.status,
      pricePerUnit: resource.pricePerUnit,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedResource) return;

    try {
      const response = await fetch(`http://localhost:5000/api/resources/${selectedResource._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: editFormData.status,
          pricePerUnit: editFormData.pricePerUnit,
        }),
      });

      if (!response.ok) throw new Error('Failed to update resource');

      setResources((prev) =>
        prev.map((r) =>
          r._id === selectedResource._id
            ? { ...r, status: editFormData.status as any, pricePerUnit: editFormData.pricePerUnit }
            : r
        )
      );

      setIsEditDialogOpen(false);
      setSelectedResource(null);
      toast({
        title: 'Succès',
        description: 'Ressource mise à jour',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/resources/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete resource');

      setResources((prev) => prev.filter((r) => r._id !== id));
      setDeleteId(null);
      toast({
        title: 'Succès',
        description: 'Ressource supprimée',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🏛️ Gestion des Ressources
          </h1>
          <p className="text-slate-600 mt-2">Gérez toutes les ressources du système</p>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{resources.length}</p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Actives</p>
                <p className="text-2xl font-bold text-green-600">
                  {resources.filter((r) => r.status === 'active').length}
                </p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {resources.filter((r) => r.status === 'maintenance').length}
                </p>
              </div>
              <span className="text-3xl">🔧</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Inactives</p>
                <p className="text-2xl font-bold text-red-600">
                  {resources.filter((r) => r.status === 'inactive').length}
                </p>
              </div>
              <span className="text-3xl">⏸️</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <CardTitle className="text-lg">🔍 Filtres</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Type
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="terrain">⚽ Terrain de sport</SelectItem>
                  <SelectItem value="salle">🏛️ Salle de sport</SelectItem>
                  <SelectItem value="equipment">📦 Équipement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Statut
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">✅ Active</SelectItem>
                  <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                  <SelectItem value="inactive">⏸️ Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Recherche
              </label>
              <Input
                placeholder="Nom, gestionnaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-2 focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <CardTitle className="text-lg">
            📋 Ressources ({filteredResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredResources.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">Aucune ressource trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Type
                    </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Gestionnaire
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Prix
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Créée le
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.map((resource) => (
                    <tr
                      key={resource._id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                            <img
                              src={resourceImages[resource._id] || '/placeholder.svg'}
                              alt={resource.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {typeEmojis[resource.type] || typeEmojis.default} {resource.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">{resource.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="capitalize font-medium text-slate-900">
                          {resource.category || resource.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-semibold text-slate-900">
                          {(resource.createdBy?.firstName || resource.manager?.firstName || 'N/A')}{' '}
                          {(resource.createdBy?.lastName || resource.manager?.lastName || '')}
                        </div>
                        <div className="text-xs text-slate-500">{resource.createdBy?.email || resource.manager?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {resource.pricePerUnit} {resource.currency}/h
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Badge
                          variant="outline"
                          className={cn(
                            'border px-2 py-1',
                            statusColors[resource.status]
                          )}
                        >
                          {statusEmojis[resource.status]} {resource.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {format(new Date(resource.createdAt), 'dd MMM yyyy', {
                          locale: fr,
                        })}
                      </td>
                      <td className="px-4 py-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          onClick={() => handleEdit(resource)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => setDeleteId(resource._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">✏️ Modifier la ressource</DialogTitle>
            <DialogDescription>
              {selectedResource && (
                <>
                  <p className="mt-2 text-sm">
                    <strong>Ressource:</strong> {selectedResource.name}
                  </p>
                  <p className="text-sm">
                    <strong>Type:</strong> {selectedResource.type}
                  </p>
                  <p className="text-sm">
                    <strong>Gestionnaire:</strong> {selectedResource.manager?.firstName || 'N/A'} {selectedResource.manager?.lastName || ''}
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedResource && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Statut
                </label>
                <Select
                  value={editFormData.status}
                  onValueChange={(val) =>
                    setEditFormData({ ...editFormData, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">✅ Active</SelectItem>
                    <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                    <SelectItem value="inactive">⏸️ Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Prix par heure ({selectedResource.currency})
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={editFormData.pricePerUnit}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, pricePerUnit: parseFloat(e.target.value) })
                  }
                  className="border-2 focus:border-blue-500"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={handleSaveEdit}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              ⚠️ Supprimer la ressource ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La ressource sera définitivement supprimée du système.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppLayout>
  );
};
