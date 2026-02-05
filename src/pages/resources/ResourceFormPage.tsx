import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Save, Upload, Image as ImageIcon, X, Users } from 'lucide-react';
import { resourcesAPI, mediaAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/utils';

export const ResourceFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'terrain' as 'terrain' | 'salle' | 'equipment',
    description: '',
    shortDescription: '',
    capacity: '',
    unit: 'players' as 'persons' | 'items' | 'square_meters' | 'players',
    pricePerUnit: '',
    pricingModel: 'hourly' as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'package',
    currency: 'EUR',
    taxRate: '20',
    minBookingHours: '1',
    maxBookingHours: '24',
    address: '',
    features: [] as string[],
    status: 'active' as 'active' | 'maintenance' | 'inactive',
  });

  const [newFeature, setNewFeature] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (id) {
      const loadResource = async () => {
        try {
          setIsLoading(true);
          const [resourceRes, mediaRes] = await Promise.all([
            resourcesAPI.getById(id),
            mediaAPI.getByResource(id),
          ]);
          const resource = resourceRes.resource;
          setFormData({
            name: resource.name || '',
            type: resource.type || 'terrain',
            description: resource.description || '',
            shortDescription: resource.shortDescription || '',
            capacity: resource.capacity?.toString() || '',
            unit: resource.unit || 'persons',
            pricePerUnit: resource.pricePerUnit?.toString() || '',
            pricingModel: resource.pricingModel || 'hourly',
            currency: resource.currency || 'EUR',
            taxRate: resource.taxRate?.toString() || '20',
            minBookingHours: resource.minBookingHours?.toString() || '1',
            maxBookingHours: resource.maxBookingHours?.toString() || '24',
            address: resource.address || '',
            features: resource.features || [],
            status: resource.status || 'active',
          });
          setUploadedMedia(mediaRes.mediaAssets || []);
        } catch (error: any) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger la ressource.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      loadResource();
    }
  }, [id, toast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await mediaAPI.upload(file, {
          resourceId: id || undefined,
          mediaType: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
          purpose: 'gallery',
        });
        uploadedFiles.push(result.mediaAsset);
      }
      setUploadedMedia(prev => [...uploadedFiles, ...prev]);
      toast({
        title: 'Succès',
        description: `${files.length} fichier(s) uploadé(s) avec succès.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'uploader les fichiers.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await mediaAPI.delete(mediaId);
      setUploadedMedia(prev => prev.filter((m: any) => (m._id || m.id) !== mediaId));
      toast({
        title: 'Média supprimé',
        description: 'Le média a été supprimé avec succès.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le média.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.type || !formData.pricePerUnit) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs obligatoires (nom, type, prix).',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      const data = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 20,
        minBookingHours: formData.minBookingHours ? parseInt(formData.minBookingHours) : 1,
        maxBookingHours: formData.maxBookingHours ? parseInt(formData.maxBookingHours) : 24,
        managerId: user?.id, // Add manager ID
      };

      // Remove empty strings and undefined values
      Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] === undefined) {
          delete data[key];
        }
      });

      let resourceId = id;
      if (id) {
        await resourcesAPI.update(id, data);
        toast({
          title: 'Succès',
          description: 'Ressource mise à jour avec succès.',
        });
      } else {
        const result = await resourcesAPI.create(data);
        resourceId = result.resource._id || result.resource.id;
        toast({
          title: 'Succès',
          description: 'Ressource créée avec succès.',
        });
      }

      // Upload any pending media files if resource was just created
      if (!id && uploadedMedia.length > 0) {
        // Media will be uploaded after resource creation
        navigate(`/resources/${resourceId}/edit`);
      } else {
        navigate('/resources/my');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder la ressource.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  if (!user || user.role !== 'admin') {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Vous devez être administrateur pour accéder à cette page.
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
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Modifier la ressource' : 'Nouvelle ressource'}</CardTitle>
            <CardDescription>
              {id ? 'Modifiez les informations de votre ressource' : 'Créez une nouvelle ressource à louer'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="media">Médias ({uploadedMedia.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="terrain">Terrain de sport</SelectItem>
                      <SelectItem value="salle">Salle de sport</SelectItem>
                      <SelectItem value="equipment">Équipement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Description courte</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description complète</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacité {formData.type === 'terrain' && '(joueurs)'}
                    {formData.type === 'salle' && '(personnes)'}
                    {formData.type === 'equipment' && '(articles)'}
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder={formData.type === 'terrain' ? 'Ex: 10 joueurs (tennis, basketball, etc.)' : formData.type === 'salle' ? 'Ex: 20 personnes' : 'Ex: 5 articles'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unité</Label>
                  <Select value={formData.unit} onValueChange={(value: any) => setFormData(prev => ({ ...prev, unit: value }))}>
                    <SelectTrigger id="unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="players">
                        {formData.type === 'terrain' ? 'Joueurs' : 'Personnes'}
                      </SelectItem>
                      <SelectItem value="persons">Personnes</SelectItem>
                      <SelectItem value="items">Articles</SelectItem>
                      <SelectItem value="square_meters">m²</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">Prix par unité *</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    step="0.01"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricingModel">Modèle de tarification</Label>
                  <Select value={formData.pricingModel} onValueChange={(value: any) => setFormData(prev => ({ ...prev, pricingModel: value }))}>
                    <SelectTrigger id="pricingModel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">À l'heure</SelectItem>
                      <SelectItem value="daily">Par jour</SelectItem>
                      <SelectItem value="weekly">Par semaine</SelectItem>
                      <SelectItem value="monthly">Par mois</SelectItem>
                      <SelectItem value="package">Forfait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Taux de TVA (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minBookingHours">Durée min. (heures)</Label>
                  <Input
                    id="minBookingHours"
                    type="number"
                    value={formData.minBookingHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, minBookingHours: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBookingHours">Durée max. (heures)</Label>
                  <Input
                    id="maxBookingHours"
                    type="number"
                    value={formData.maxBookingHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxBookingHours: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Caractéristiques</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    placeholder="Ajouter une caractéristique"
                  />
                  <Button type="button" onClick={addFeature}>Ajouter</Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <span className="text-sm">{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {id ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Annuler
                </Button>
              </div>
            </form>
              </TabsContent>

              <TabsContent value="media" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label>Uploader des images ou vidéos</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center mt-2">
                      <input
                        type="file"
                        id="media-upload"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading || !id}
                      />
                      <label
                        htmlFor="media-upload"
                        className={`cursor-pointer flex flex-col items-center gap-2 ${(!id || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <span className="text-primary font-medium">Cliquez pour uploader</span>
                          <span className="text-muted-foreground"> ou glissez-déposez</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Images et vidéos (max 50MB par fichier)
                        </p>
                        {!id && (
                          <p className="text-xs text-amber-600 mt-2">
                            ⚠️ Sauvegardez d'abord la ressource pour uploader des médias
                          </p>
                        )}
                      </label>
                    </div>
                    {isUploading && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Upload en cours...</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {uploadedMedia.length > 0 && (
                    <div>
                      <Label>Médias uploadés ({uploadedMedia.length})</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                        {uploadedMedia.map((media: any) => (
                          <div key={media._id || media.id} className="relative group">
                            <div className="aspect-video rounded-lg bg-muted overflow-hidden">
                              {media.mediaType === 'image' ? (
                                <img
                                  src={getImageUrl(media.originalUrl)}
                                  alt={media.altText || media.originalName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteMedia(media._id || media.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {media.originalName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

