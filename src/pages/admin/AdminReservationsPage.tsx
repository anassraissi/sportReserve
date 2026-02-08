import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { bookingsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
import { Loader2, Edit2, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reservation {
  _id: string;
  userId: { firstName: string; lastName: string; email: string };
  resourceId: { name: string; category: string };
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'paid' | 'active' | 'completed' | 'cancelled' | 'no_show' | 'refunded' | 'disputed';
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-800 border-orange-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  paid: 'bg-green-100 text-green-800 border-green-300',
  active: 'bg-purple-100 text-purple-800 border-purple-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
  no_show: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  refunded: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  disputed: 'bg-pink-100 text-pink-800 border-pink-300',
};

const statusEmojis: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  paid: '💰',
  active: '🔄',
  completed: '✔️',
  cancelled: '❌',
  no_show: '👻',
  refunded: '💸',
  disputed: '⚠️',
};

export const AdminReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: '',
  });
  const { toast } = useToast();

  // Fetch all reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/bookings?admin=true&limit=100', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch reservations');
        const data = await response.json();
        const reservationList = Array.isArray(data) ? data : (data.reservations || []);
        setReservations(reservationList);
      } catch (error: any) {
        console.error('Fetch error:', error);
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de charger les réservations',
          variant: 'destructive',
        });
        setReservations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [toast]);

  // Filter reservations based on status and search
  useEffect(() => {
    let filtered = reservations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.userId.firstName.toLowerCase().includes(query) ||
          r.userId.lastName.toLowerCase().includes(query) ||
          r.userId.email.toLowerCase().includes(query) ||
          r.resourceId.name.toLowerCase().includes(query)
      );
    }

    setFilteredReservations(filtered);
  }, [reservations, statusFilter, searchQuery]);

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditFormData({
      status: reservation.status,
      notes: reservation.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReservation) return;

    try {
      await bookingsAPI.update(selectedReservation._id, {
        status: editFormData.status,
        notes: editFormData.notes,
      });

      setReservations((prev) =>
        prev.map((r) =>
          r._id === selectedReservation._id
            ? { ...r, status: editFormData.status as any, notes: editFormData.notes }
            : r
        )
      );

      setIsEditDialogOpen(false);
      setSelectedReservation(null);
      toast({
        title: 'Succès',
        description: 'Réservation mise à jour',
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
      await bookingsAPI.update(id, { status: 'cancelled' });
      setReservations((prev) => prev.filter((r) => r._id !== id));
      setDeleteId(null);
      toast({
        title: 'Succès',
        description: 'Réservation annulée',
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
            🔧 Gestion des Réservations
          </h1>
          <p className="text-slate-600 mt-2">Gérez toutes les réservations du système</p>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{reservations.length}</p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">En attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reservations.filter((r) => r.status === 'pending').length}
                </p>
              </div>
              <span className="text-3xl">⏳</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Payées</p>
                <p className="text-2xl font-bold text-green-600">
                  {reservations.filter((r) => r.status === 'paid').length}
                </p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Annulées</p>
                <p className="text-2xl font-bold text-red-600">
                  {reservations.filter((r) => r.status === 'cancelled').length}
                </p>
              </div>
              <span className="text-3xl">❌</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="pending">⏳ En attente</SelectItem>
                  <SelectItem value="confirmed">✅ Confirmée</SelectItem>
                  <SelectItem value="paid">💰 Payée</SelectItem>
                  <SelectItem value="active">🔄 Active</SelectItem>
                  <SelectItem value="completed">✔️ Complétée</SelectItem>
                  <SelectItem value="cancelled">❌ Annulée</SelectItem>
                  <SelectItem value="no_show">👻 Non présentée</SelectItem>
                  <SelectItem value="refunded">💸 Remboursée</SelectItem>
                  <SelectItem value="disputed">⚠️ Contestée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Recherche
              </label>
              <Input
                placeholder="Nom, email, ressource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-2 focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <CardTitle className="text-lg">
            📋 Réservations ({filteredReservations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredReservations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-500">Aucune réservation trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      👤 Client
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      🏷️ Ressource
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      📅 Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      ⏰ Horaire
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr
                      key={reservation._id}
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm">
                        <div className="font-semibold text-slate-900">
                          {reservation.userId?.firstName || 'N/A'} {reservation.userId?.lastName || ''}
                        </div>
                        <div className="text-xs text-slate-500">{reservation.userId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-semibold text-slate-900">
                          {reservation.resourceId?.name || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {reservation.resourceId?.category || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-900">
                        <div>
                          {reservation.startTime
                            ? format(new Date(reservation.startTime), 'EEEE dd MMM yyyy', {
                                locale: fr,
                              })
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-600">
                          {reservation.startTime
                            ? format(new Date(reservation.startTime), 'HH:mm')
                            : 'N/A'}{' '}
                          -{' '}
                          {reservation.endTime
                            ? format(new Date(reservation.endTime), 'HH:mm')
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {reservation.totalAmount.toFixed(2)} DH
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Badge
                          variant="outline"
                          className={cn(
                            'border px-2 py-1',
                            statusColors[reservation.status]
                          )}
                        >
                          {statusEmojis[reservation.status]} {reservation.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => setDeleteId(reservation._id)}
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
            <DialogTitle className="text-xl">✏️ Modifier la réservation</DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <>
                  <p className="mt-2 text-sm">
                    <strong>Client:</strong> {selectedReservation.userId?.firstName || 'N/A'}{' '}
                    {selectedReservation.userId?.lastName || ''}
                  </p>
                  <p className="text-sm">
                    <strong>Ressource:</strong> {selectedReservation.resourceId?.name || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <strong>Date:</strong>{' '}
                    {selectedReservation.startTime
                      ? format(new Date(selectedReservation.startTime), 'EEEE dd MMM yyyy', {
                          locale: fr,
                        })
                      : 'N/A'}
                  </p>
                  <p className="text-sm">
                    <strong>Horaires:</strong> {selectedReservation.startTime 
                      ? format(new Date(selectedReservation.startTime), 'HH:mm')
                      : 'N/A'} - {selectedReservation.endTime
                      ? format(new Date(selectedReservation.endTime), 'HH:mm')
                      : 'N/A'}
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
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
                    <SelectItem value="pending">⏳ En attente</SelectItem>
                    <SelectItem value="confirmed">✅ Confirmée</SelectItem>
                    <SelectItem value="paid">💰 Payée</SelectItem>
                    <SelectItem value="active">🔄 Active</SelectItem>
                    <SelectItem value="completed">✔️ Complétée</SelectItem>
                    <SelectItem value="cancelled">❌ Annulée</SelectItem>
                    <SelectItem value="no_show">👻 Non présentée</SelectItem>
                    <SelectItem value="refunded">💸 Remboursée</SelectItem>
                    <SelectItem value="disputed">⚠️ Contestée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Notes
                </label>
                <Input
                  placeholder="Ajouter des notes..."
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  className="border-2 focus:border-blue-500"
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
              ⚠️ Supprimer la réservation ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. La réservation sera marquée comme annulée.
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
