import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MapPin, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReviewCardProps {
  review: {
    _id?: string;
    id?: string;
    rating: number;
    comment: string;
    createdAt: string;
    user?: {
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
    userId?: {
      _id?: string;
      id?: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
    };
    reservation?: {
      _id: string;
      resourceId: any;
    };
    resourceId?: any;
  };
  currentUserId?: string;
  onDelete?: (reviewId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, currentUserId, onDelete }) => {
  // Get resource data from either reservation or direct resourceId
  const resourceData = review.reservation?.resourceId || review.resourceId;
  const resourceName = typeof resourceData === 'object' 
    ? resourceData?.name 
    : 'Ressource';
  const resourceImage = typeof resourceData === 'object' 
    ? resourceData?.imageUrl 
    : null;
  
  // Handle both 'user' and 'userId' field names from API
  // Backend returns userId, but some places might use user
  const userData = review.user || review.userId;
  const userName = userData 
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    : 'Utilisateur anonyme';
  
  const userInitials = userData ? `${(userData.firstName?.[0] || '')}${(userData.lastName?.[0] || '')}` : '?';
  const reviewId = review._id || review.id;
  const ownerId = review.userId?._id || review.userId?.id || review.user?._id || review.user?.id;
  const isOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getImageUrl = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Resource Image or Header */}
      {resourceImage ? (
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
          <img
            src={getImageUrl(resourceImage)}
            alt={resourceName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Resource Name Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-white" />
              <h3 className="font-bold text-white text-lg truncate">{resourceName}</h3>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-white" />
            <h3 className="font-bold text-white text-lg truncate">{resourceName}</h3>
          </div>
        </div>
      )}

      <CardContent className={`${resourceImage ? 'pt-4' : 'pt-6'}`}>
        <div className="space-y-3">
          {/* User Info Header - More Prominent */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-blue-200">
                <AvatarImage
                  src={userData?.avatarUrl 
                    ? (userData.avatarUrl.startsWith('http') 
                      ? userData.avatarUrl 
                      : `http://localhost:5000${userData.avatarUrl}`)
                    : undefined
                  }
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base text-gray-800 leading-tight">{userName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(review.createdAt), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-sm font-semibold text-amber-600">{review.rating}/5</span>
            </div>
            {isOwner && onDelete && reviewId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm('Supprimer votre avis ? Cette action est irreversible.')) {
                    onDelete(reviewId);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-blue-300 pl-3">
              "{review.comment}"
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

