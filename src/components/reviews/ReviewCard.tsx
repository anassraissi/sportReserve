import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle } from 'lucide-react';
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
    reservation?: {
      _id: string;
      resourceId: any;
    };
  };
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const resourceName = typeof review.reservation?.resourceId === 'object' 
    ? review.reservation?.resourceId?.name 
    : 'Ressource';
  
  // Handle both 'user' and 'userId' field names from API
  const userData = review.user || (review as any).userId;
  const userName = userData 
    ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
    : 'Utilisateur anonyme';
  
  const userInitials = userData ? `${(userData.firstName?.[0] || '')}${(userData.lastName?.[0] || '')}` : '?';
  
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

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={userData?.avatarUrl 
                    ? (userData.avatarUrl.startsWith('http') 
                      ? userData.avatarUrl 
                      : `http://localhost:5000${userData.avatarUrl}`)
                    : undefined
                  }
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(review.createdAt), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            {renderStars(review.rating)}
          </div>

          {/* Resource info */}
          {review.reservation?.resourceId && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                📍 {resourceName}
              </Badge>
            </div>
          )}

          {/* Rating and comment */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
              <span>{review.rating}/5 ⭐</span>
            </div>
            {review.comment && (
              <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-blue-300 pl-3">
                "{review.comment}"
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
