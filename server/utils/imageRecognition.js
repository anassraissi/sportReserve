/**
 * Image Recognition Service
 * Uses Google Cloud Vision API to analyze sports facility images
 */

export class ImageRecognitionService {
  constructor(vision) {
    this.vision = vision;
  }

  /**
   * Analyze a facility image
   * @param {string} imagePath - Path to image file
   * @param {string} imageBase64 - Base64 encoded image data
   */
  async analyzeFacilityImage(imagePath, imageBase64) {
    try {
      const request = {
        image: {
          content: imageBase64 || require('fs').readFileSync(imagePath)
        },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'TEXT_DETECTION' },
          { type: 'SAFE_SEARCH_DETECTION' },
          { type: 'IMAGE_PROPERTIES' }
        ]
      };

      const [result] = await this.vision.annotateImage(request);
      
      return {
        labels: result.labelAnnotations || [],
        objects: result.localizedObjectAnnotations || [],
        text: result.textAnnotations || [],
        safeSearch: result.safeSearchAnnotation,
        properties: result.imagePropertiesAnnotation,
        analysis: await this.parseAnalysis(result)
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  }

  /**
   * Parse image analysis and extract facility info
   */
  async parseAnalysis(result) {
    const labels = result.labelAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];

    // Detect sport type
    const sportTypes = this.detectSportType(labels, objects);

    // Detect condition
    const condition = this.assessCondition(labels);

    // Detect equipment
    const equipment = this.detectEquipment(labels, objects);

    // Generate description
    const description = this.generateDescription(sportTypes, condition, equipment);

    return {
      detectedSportTypes: sportTypes,
      estimatedCondition: condition,
      detectedEquipment: equipment,
      generatedDescription: description,
      confidence: this.calculateConfidence(labels),
      flags: this.identifyIssues(labels)
    };
  }

  /**
   * Detect sport type from image
   */
  detectSportType(labels, objects) {
    const sportKeywords = {
      football: ['soccer', 'football', 'pitch', 'grass', 'ball', 'field'],
      tennis: ['tennis', 'court', 'racket', 'net', 'clay', 'hard court'],
      basketball: ['basketball', 'hoop', 'court', 'ball', 'rim'],
      badminton: ['badminton', 'shuttlecock', 'racket', 'court'],
      volleyball: ['volleyball', 'net', 'court', 'ball'],
      fitness: ['gym', 'fitness', 'dumbbell', 'exercise', 'weights', 'treadmill'],
      swimming: ['pool', 'water', 'swim', 'swimming'],
      yoga: ['yoga', 'mat', 'meditation', 'studio'],
      running: ['track', 'running', 'jogging', 'athletics']
    };

    const detectedTypes = {};
    
    labels.forEach(label => {
      const name = label.description.toLowerCase();
      Object.entries(sportKeywords).forEach(([sport, keywords]) => {
        if (keywords.some(kw => name.includes(kw))) {
          detectedTypes[sport] = (detectedTypes[sport] || 0) + (label.score || 0.7);
        }
      });
    });

    objects.forEach(obj => {
      const name = obj.name.toLowerCase();
      Object.entries(sportKeywords).forEach(([sport, keywords]) => {
        if (keywords.some(kw => name.includes(kw))) {
          detectedTypes[sport] = (detectedTypes[sport] || 0) + (obj.score || 0.7);
        }
      });
    });

    return Object.entries(detectedTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sport, score]) => ({ sport, confidence: (score * 100).toFixed(0) + '%' }));
  }

  /**
   * Assess facility condition
   */
  assessCondition(labels) {
    const labelDescriptions = labels.map(l => l.description.toLowerCase()).join(' ');

    const excellent = ['new', 'pristine', 'modern', 'clean', 'bright'];
    const good = ['maintained', 'tidy', 'well-kept', 'organized'];
    const fair = ['worn', 'aged', 'faded', 'needs repair'];
    const poor = ['damaged', 'broken', 'deteriorated', 'neglected'];

    let score = 0;
    excellent.forEach(word => {
      if (labelDescriptions.includes(word)) score += 3;
    });
    good.forEach(word => {
      if (labelDescriptions.includes(word)) score += 2;
    });
    fair.forEach(word => {
      if (labelDescriptions.includes(word)) score -= 2;
    });
    poor.forEach(word => {
      if (labelDescriptions.includes(word)) score -= 3;
    });

    if (score >= 3) return 'Excellent';
    if (score >= 1) return 'Good';
    if (score >= -1) return 'Fair';
    return 'Poor';
  }

  /**
   * Detect equipment in image
   */
  detectEquipment(labels, objects) {
    const equipmentKeywords = [
      'ball', 'racket', 'net', 'hoop', 'goal', 'equipment', 'bench', 'stand',
      'light', 'lighting', 'scoreboard', 'seats', 'bleachers', 'locker',
      'shower', 'toilet', 'water', 'fountain', 'barrier', 'flag', 'marker'
    ];

    const equipment = new Set();

    labels.forEach(label => {
      const name = label.description.toLowerCase();
      if (equipmentKeywords.some(eq => name.includes(eq))) {
        equipment.add(label.description);
      }
    });

    objects.forEach(obj => {
      const name = obj.name.toLowerCase();
      if (equipmentKeywords.some(eq => name.includes(eq))) {
        equipment.add(obj.name);
      }
    });

    return Array.from(equipment);
  }

  /**
   * Generate AI description from image
   */
  generateDescription(sportTypes, condition, equipment) {
    const sports = sportTypes.map(s => s.sport).join(', ');
    const equipList = equipment.slice(0, 3).join(', ');

    return `Terrain ${sports} en état ${condition}. Équipements détectés: ${equipList}. Image analysée par intelligence artificielle.`;
  }

  /**
   * Calculate overall confidence
   */
  calculateConfidence(labels) {
    if (labels.length === 0) return 0;
    const avgScore = labels.reduce((sum, l) => sum + (l.score || 0.7), 0) / labels.length;
    return (avgScore * 100).toFixed(0) + '%';
  }

  /**
   * Identify potential issues
   */
  identifyIssues(labels) {
    const issues = [];
    const labelDescriptions = labels.map(l => l.description.toLowerCase()).join(' ');

    if (labelDescriptions.includes('broken') || labelDescriptions.includes('damaged')) {
      issues.push('⚠️ Dommages détectés');
    }
    if (labelDescriptions.includes('dirty') || labelDescriptions.includes('litter')) {
      issues.push('🧹 Propreté en question');
    }
    if (labelDescriptions.includes('crowd') || labelDescriptions.includes('busy')) {
      issues.push('👥 Très occupé');
    }
    if (labelDescriptions.includes('cloudy') || labelDescriptions.includes('dark')) {
      issues.push('☁️ Mauvaise luminosité');
    }

    return issues;
  }

  /**
   * Auto-tag facility from image
   */
  async autoTagImage(imagePath) {
    try {
      const analysis = await this.analyzeFacilityImage(imagePath);
      
      return {
        tags: analysis.analysis.detectedSportTypes.map(s => s.sport),
        category: analysis.analysis.detectedSportTypes[0]?.sport || 'unknown',
        equipment: analysis.analysis.detectedEquipment,
        description: analysis.analysis.generatedDescription,
        condition: analysis.analysis.estimatedCondition,
        qualityScore: parseInt(analysis.analysis.confidence)
      };
    } catch (error) {
      console.error('Auto-tag error:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple images
   */
  async analyzeMultipleImages(imagePaths) {
    try {
      const results = await Promise.all(
        imagePaths.map(path => this.analyzeFacilityImage(path).catch(err => ({
          error: err.message,
          path
        })))
      );

      return results;
    } catch (error) {
      console.error('Batch analysis error:', error);
      throw error;
    }
  }
}

export default ImageRecognitionService;
