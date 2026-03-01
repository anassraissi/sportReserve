import Review from '../models/Review.js';

/**
 * AI Review Analyzer Service
 * Analyzes reviews for sentiment, issues, and patterns
 */

export class ReviewAnalyzer {
  constructor(genAI, model) {
    this.genAI = genAI;
    this.model = model;
  }

  /**
   * Analyze sentiment of a single review
   */
  async analyzeSentiment(review) {
    const prompt = `Analyze this review and return JSON with: sentiment (positive/negative/neutral), score (1-5), keywords (array), issues (array).

Review:
"${review.comment}"
Rating: ${review.rating}/5

Return ONLY valid JSON, no other text:
{"sentiment": "positive|negative|neutral", "score": 4, "keywords": [], "issues": [], "summary": ""}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        sentiment: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral',
        score: review.rating,
        keywords: [],
        issues: [],
        summary: 'Fallback analysis'
      };
    }
  }

  /**
   * Get detailed report for a resource
   */
  async getResourceAnalysis(resourceId, options = {}) {
    try {
      const reviews = await Review.find({ 
        resourceId, 
        status: 'approved' 
      }).sort({ createdAt: -1 }).limit(options.limit || 20);

      if (reviews.length === 0) {
        return {
          resourceId,
          totalReviews: 0,
          averageRating: 0,
          sentiment: 'N/A',
          issues: [],
          recommendations: []
        };
      }

      const sentiments = await Promise.all(
        reviews.map(r => this.analyzeSentiment(r))
      );

      // Aggregate data
      const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2);
      const positiveCount = sentiments.filter(s => s.sentiment === 'positive').length;
      const negativeCount = sentiments.filter(s => s.sentiment === 'negative').length;
      const overallSentiment = positiveCount > negativeCount ? 'positive' : 
                              negativeCount > positiveCount ? 'negative' : 'neutral';

      // Extract common issues
      const allIssues = sentiments.flatMap(s => s.issues);
      const issueCounts = {};
      allIssues.forEach(issue => {
        issueCounts[issue] = (issueCounts[issue] || 0) + 1;
      });
      const commonIssues = Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, frequency: count }));

      // Extract keywords
      const allKeywords = sentiments.flatMap(s => s.keywords);
      const keywordCounts = {};
      allKeywords.forEach(kw => {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      });
      const topKeywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([kw]) => kw);

      // Generate recommendations
      const recommendations = this.generateRecommendations(commonIssues, avgRating);

      return {
        resourceId,
        totalReviews: reviews.length,
        averageRating: parseFloat(avgRating),
        sentiment: overallSentiment,
        sentimentBreakdown: {
          positive: `${((positiveCount / reviews.length) * 100).toFixed(0)}%`,
          negative: `${((negativeCount / reviews.length) * 100).toFixed(0)}%`,
          neutral: `${(((reviews.length - positiveCount - negativeCount) / reviews.length) * 100).toFixed(0)}%`
        },
        commonIssues,
        topKeywords,
        recommendations,
        recentReviews: reviews.slice(0, 3).map(r => ({
          rating: r.rating,
          comment: r.comment,
          date: r.createdAt
        }))
      };
    } catch (error) {
      console.error('Resource analysis error:', error);
      throw error;
    }
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(issues, avgRating) {
    const recommendations = [];

    if (avgRating < 3) {
      recommendations.push('⚠️ Alerter les gestionnaires - Rating faible');
    }

    if (issues.some(i => i.issue.match(/propreté|nettoyage|sale|dirty/i))) {
      recommendations.push('🧹 Améliorer la propreté et les standards d\'hygiène');
    }

    if (issues.some(i => i.issue.match(/équipement|équipement|broken|repair/i))) {
      recommendations.push('🔧 Vérifier et réparer les équipements');
    }

    if (issues.some(i => i.issue.match(/staff|personnel|accueil|service/i))) {
      recommendations.push('👥 Former le personnel au service client');
    }

    if (issues.some(i => i.issue.match(/parking|accès|transport/i))) {
      recommendations.push('🚗 Améliorer l\'accessibilité et les parkings');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Bonne note - Maintenir les standards actuels');
    }

    return recommendations;
  }

  /**
   * Detect and flag suspicious reviews
   */
  async flagSuspiciousReviews(resourceId) {
    try {
      const reviews = await Review.find({ resourceId }).populate('userId');
      const suspiciousReviews = [];

      for (const review of reviews) {
        // Check if same user reviewed multiple times in short time
        const userReviewCount = reviews.filter(r => 
          r.userId._id.toString() === review.userId._id.toString()
        ).length;

        if (userReviewCount > 2) {
          suspiciousReviews.push({
            reviewId: review._id,
            reason: 'Utilisateur a plusieurs avis (spam possible)',
            severity: 'medium'
          });
        }

        // Check for extreme ratings
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        if (Math.abs(review.rating - avgRating) > 3) {
          suspiciousReviews.push({
            reviewId: review._id,
            reason: 'Rating extrême par rapport à la moyenne',
            severity: 'low'
          });
        }

        // Check very short or very similar comments
        if (review.comment.length < 5 || review.comment === 'Bien' || review.comment === 'Pas bon') {
          suspiciousReviews.push({
            reviewId: review._id,
            reason: 'Commentaire trop court ou générique',
            severity: 'low'
          });
        }
      }

      return suspiciousReviews;
    } catch (error) {
      console.error('Suspicious review detection error:', error);
      return [];
    }
  }
}

export default ReviewAnalyzer;
