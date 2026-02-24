import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Mail, Bell, Check } from 'lucide-react';
import { notificationsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const AdminBroadcastNotification = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'system_alert',
    channels: ['in_app', 'email'],
    userRole: '',
  });

  const notificationTypes = [
    { value: 'system_alert', label: 'Alerte Système' },
    { value: 'maintenance_notice', label: 'Avis de Maintenance' },
    { value: 'promotional', label: 'Promotion' },
    { value: 'announcement', label: 'Annonce' },
  ];

  const channels = [
    { value: 'in_app', label: '📱 In-App' },
    { value: 'email', label: '📧 Email' },
  ];

  const userRoles = [
    { value: '', label: 'Tous les utilisateurs' },
    { value: 'user', label: 'Utilisateurs réguliers' },
    { value: 'admin', label: 'Administrateurs' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleChannel = (channel) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    if (formData.channels.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un canal',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        channels: formData.channels,
        ...(formData.userRole && { userRole: formData.userRole }),
      };

      const response = await notificationsAPI.broadcastAll(payload);

      toast({
        title: 'Succès',
        description: `Notification envoyée à ${response.count} utilisateurs`,
        variant: 'default',
      });

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'system_alert',
        channels: ['in_app', 'email'],
        userRole: '',
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Broadcast error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'envoi de la notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-blue-200 hover:bg-blue-50"
        >
          <Mail className="h-4 w-4" />
          Diffuser une notification
        </Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Envoyer une notification à tous
          </DialogTitle>
          <DialogDescription>
            Envoyez une notification à tous les utilisateurs via email et/ou l'application
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titre
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Maintenance prévue"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Entrez le contenu de la notification..."
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.message.length} caractères
            </p>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Type de notification
            </Label>
            <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channels */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Canaux d'envoi</Label>
            <div className="space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.value}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleChannel(channel.value)}
                >
                  <input
                    type="checkbox"
                    checked={formData.channels.includes(channel.value)}
                    onChange={() => {}}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-sm">{channel.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Role Filter */}
          <div className="space-y-2">
            <Label htmlFor="userRole" className="text-sm font-medium">
              Filtrer par rôle utilisateur
            </Label>
            <Select value={formData.userRole} onValueChange={(value) => setFormData((prev) => ({ ...prev, userRole: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un rôle (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Aperçu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-gray-600 mb-1">Titre:</p>
                <p className="font-semibold text-sm">{formData.title || '(Titre vide)'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Message:</p>
                <p className="text-sm line-clamp-3">{formData.message || '(Message vide)'}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {formData.channels.map((ch) => (
                  <Badge key={ch} variant="outline" className="bg-white">
                    {ch === 'in_app' ? '📱 In-App' : '📧 Email'}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Envoyer maintenant
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBroadcastNotification;
