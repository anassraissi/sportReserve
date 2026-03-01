import React, { useState, useEffect } from 'react';
import { BarChart3, AlertTriangle, TrendingDown, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReviewAnalysis {
  resourceId: string;
  totalReviews: number;
  averageRating: number;
  sentiment: string;
  sentimentBreakdown: {
    positive: string;
    negative: string;
    neutral: string;
  };
  commonIssues: Array<{ issue: string; frequency: number }>;
  topKeywords: string[];
  recommendations: string[];
}

interface Props {
  resourceId: string;
}

export const ReviewAnalyzerPanel: React.FC<Props> = ({ resourceId }) => {
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [suspicious, setSuspicious] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalysis();
  }, [resourceId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);

      // Fetch main analysis
      const analysisRes = await fetch(`/api/ai/reviews/analyze/${resourceId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setAnalysis(data.data);
      }

      // Fetch suspicious reviews
      const suspiciousRes = await fetch(`/api/ai/reviews/suspicious/${resourceId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (suspiciousRes.ok) {
        const data = await suspiciousRes.json();
        setSuspicious(data.suspicious_reviews);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analysis) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="text-center">Analyse des avis en cours...</div>
        </CardContent>
      </Card>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Analyse des Avis
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAnalysis}
            className="text-xs"
          >
            Actualiser
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="issues">Problèmes</TabsTrigger>
            <TabsTrigger value="suspicious">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Suspects ({suspicious.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalReviews}</div>
                <div className="text-xs text-gray-600">Avis totaux</div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{analysis.averageRating.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Note moyenne</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xl" role="img">
                  {getSentimentIcon(analysis.sentiment)}
                </div>
                <div className={`text-xs font-semibold ${getSentimentColor(analysis.sentiment)}`}>
                  {analysis.sentiment.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommandations</h4>
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-lg">{rec.charAt(0)}</span>
                  <span className="text-gray-700">{rec.slice(2)}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Positif</span>
                  <span className="text-sm font-semibold text-green-600">
                    {analysis.sentimentBreakdown.positive}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: analysis.sentimentBreakdown.positive }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Neutre</span>
                  <span className="text-sm font-semibold text-gray-600">
                    {analysis.sentimentBreakdown.neutral}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: analysis.sentimentBreakdown.neutral }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Négatif</span>
                  <span className="text-sm font-semibold text-red-600">
                    {analysis.sentimentBreakdown.negative}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: analysis.sentimentBreakdown.negative }}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-3">
            {analysis.commonIssues.length > 0 ? (
              analysis.commonIssues.map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm">{issue.issue}</span>
                  </div>
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded">
                    {issue.frequency}x
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Aucun problème majeur détecté ✓</p>
            )}
          </TabsContent>

          <TabsContent value="suspicious" className="space-y-3">
            {suspicious.length > 0 ? (
              suspicious.map((review: any, idx) => (
                <div key={idx} className="border-l-4 border-yellow-500 bg-yellow-50 p-3 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{review.reason}</p>
                        <p className="text-xs text-gray-600">Sévérité: {review.severity}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Aucun avis suspect détecté ✓</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReviewAnalyzerPanel;
