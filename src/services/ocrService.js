import apiService from './api'

const ocrService = {
  // Process document with OCR
  processDocument: async (file) => {
    try {
      if (!file) {
        throw new Error('File is required')
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type must be PDF, JPG, or PNG')
      }

      const result = await apiService.processOCR(file)
      return result
    } catch (error) {
      console.error('OCR Service Error:', error)
      throw error
    }
  },

  // Extract text from file
  extractText: async (file) => {
    try {
      const result = await ocrService.processDocument(file)
      return result.text || ''
    } catch (error) {
      console.error('Error extracting text:', error)
      throw error
    }
  },

  // Extract metadata
  extractMetadata: async (file) => {
    try {
      const result = await ocrService.processDocument(file)
      return {
        title: result.title || '',
        documentNo: result.documentNo || '',
        date: result.date || '',
        from: result.from || '',
        to: result.to || '',
        subject: result.subject || '',
        keywords: result.keywords || [],
        priority: result.priority || 'กลาง',
        confidence: result.confidence || 0,
      }
    } catch (error) {
      console.error('Error extracting metadata:', error)
      throw error
    }
  },

  // Validate extracted data
  validateExtractedData: (data) => {
    const errors = []

    if (!data.title || data.title.trim() === '') {
      errors.push('Title could not be extracted')
    }

    if (data.confidence && data.confidence < 0.5) {
      errors.push('Low confidence in extraction')
    }

    return {
      valid: errors.length === 0,
      errors,
      data,
    }
  },

  // Parse document number
  parseDocumentNumber: (text) => {
    // Common Thai document number patterns
    const patterns = [
      /ลำดับที่\s*[:：]\s*(\S+)/,
      /เลขที่\s*[:：]\s*(\S+)/,
      /Doc\s*No\s*[:：]\s*(\S+)/,
      /(\w+\s*\/\s*\d+)/,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) return match[1]
    }

    return null
  },

  // Parse date
  parseDate: (text) => {
    const thaiMonths = {
      'ม.ค.': '01',
      'ก.พ.': '02',
      'มี.ค.': '03',
      'เม.ย.': '04',
      'พ.ค.': '05',
      'มิ.ย.': '06',
      'ก.ค.': '07',
      'ส.ค.': '08',
      'ก.ย.': '09',
      'ต.ค.': '10',
      'พ.ย.': '11',
      'ธ.ค.': '12',
    }

    const patterns = [
      /(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{4})/,
      /(\d{4})-(\d{2})-(\d{2})/,
      /(\d{2})\/(\d{2})\/(\d{4})/,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        try {
          if (match[2]) {
            const month = thaiMonths[match[2]] || match[2]
            return `${match[3]}-${month}-${match[1]}`
          } else {
            return `${match[3]}-${match[2]}-${match[1]}`
          }
        } catch (e) {
          continue
        }
      }
    }

    return null
  },

  // Analyze document priority
  analyzePriority: (text) => {
    const highPriorityKeywords = ['ด่วน', 'ฉุกเฉิน', 'เร่งด่วน', 'urgent', 'critical']
    const lowPriorityKeywords = ['ข้อมูล', 'สารสนเทศ', 'general', 'info']

    const lowerText = text.toLowerCase()

    if (highPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'สูง'
    }

    if (lowPriorityKeywords.some(keyword => lowerText.includes(keyword))) {
      return 'ต่ำ'
    }

    return 'กลาง'
  },

  // Extract keywords
  extractKeywords: (text, limit = 5) => {
    // Simple keyword extraction (in production, use a proper NLP library)
    const words = text
      .split(/[\s,;.!?]+/)
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase())

    const freq = {}
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1
    })

    const keywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(entry => entry[0])

    return keywords
  },
}

export default ocrService