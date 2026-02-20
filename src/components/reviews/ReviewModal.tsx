import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface ReviewModalProps {
  reservation: any;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: { rating: number; comment: string }) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment });
      onClose();
      setRating(5);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Donner votre avis</DialogTitle>
          <DialogDescription>
            Partagez votre expérience pour aider à améliorer nos services
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Section */}
          <div className="space-y-2">
            <Label>Note</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-all ${
                      star <= rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-lg font-semibold">{rating}/5</span>
            </div>
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              placeholder="Décrivez votre expérience (équipement, personnel, propreté...)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Review Tips */}
          <div className="rounded-lg bg-blue-50 p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              💡 Conseils pour un bon avis :
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Mentionnez la qualité du service</li>
              <li>• Notez l'état des équipements</li>
              <li>• Partagez votre expérience globale</li>
              <li>• Soyez constructif dans vos retours</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? 'Envoi en cours...' : 'Publier mon avis'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};