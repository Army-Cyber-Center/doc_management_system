const Tesseract = require('tesseract.js');
const fs = require('fs').promises;

class OCRService {
  async processImage(imagePath) {
    try {
      console.log('🤖 เริ่มประมวลผล OCR...');
      
      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'tha+eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`📊 ความคืบหน้า: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      console.log('✅ OCR เสร็จสิ้น');
      
      const extractedData = this.extractStructuredData(text);
      
      // ลบไฟล์ชั่วคราว
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('ไม่สามารถลบไฟล์ชั่วคราว:', err);
      }
      
      return extractedData;
    } catch (error) {
      console.error('❌ OCR Error:', error);
      throw error;
    }
  }

  extractStructuredData(text) {
    console.log('🔍 กำลังแยกข้อมูลตามหัวข้อ...');
    
    const data = {
      department: '',
      documentNo: '',
      date: '',
      subject: '',
      from: '',
      title: '',
      priority: 'กลาง',
      keywords: [],
      rawText: text
    };

    const cleanText = this.cleanText(text);

    data.department = this.extractDepartment(cleanText);
    data.documentNo = this.extractDocumentNumber(cleanText);
    data.date = this.extractDate(cleanText);
    data.subject = this.extractSubject(cleanText);

    data.from = data.department;
    data.title = data.subject || 'เอกสารไม่ระบุชื่อ';
    data.priority = this.analyzePriority(cleanText);
    data.keywords = this.extractKeywords(cleanText);

    console.log('✅ ข้อมูลที่แยกได้:', data);
    return data;
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\.\-\/\(\),:]/g, ' ')
      .trim();
  }

  extractDepartment(text) {
    const patterns = [
      /ส่วนราชการ[\s:]*([^\n]+)/i,
      /จาก[\s:]*([^\n]+?)(?=ที่|วันที่|เรื่อง|$)/i,
      /(?:กรม|กอง|แผนก|ฝ่าย|สำนัก|หน่วย)([^\n]+?)(?=ที่|วันที่|เรื่อง|$)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return '';
  }

  extractDocumentNumber(text) {
    const patterns = [
      /ที่[\s:]*([ก-ฮ]{1,4}[\s.]*[๐-๙0-9]+[\/\-][๐-๙0-9]+)/i,
      /ที่[\s:]*([ก-ฮ]{1,4}[\s.]*\d+[\/\-]\d+)/i,
      /([ก-ฮ]{1,4}[\s.]*[๐-๙0-9]+[\/\-][๐-๙0-9]+)/i,
      /\b([๐-๙0-9]{4}[\/\-][๐-๙0-9]{4})\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let docNo = match[1].trim();
        docNo = this.convertThaiNumberToArabic(docNo);
        return docNo;
      }
    }

    return '';
  }

  extractDate(text) {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const monthPattern = thaiMonths.join('|');
    const patterns = [
      new RegExp(`วันที่[\\s:]*([๐-๙0-9]{1,2}[\\s]*(${monthPattern})[\\s]*[๐-๙0-9]{4})`, 'i'),
      /วันที่[\s:]*([๐-๙0-9]{1,2}[\/\-][๐-๙0-9]{1,2}[\/\-][๐-๙0-9]{4})/i,
      new RegExp(`([๐-๙0-9]{1,2}[\\s]+(${monthPattern})[\\s]+[๐-๙0-9]{4})`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let date = match[1].trim();
        date = this.convertThaiNumberToArabic(date);
        return date;
      }
    }

    return '';
  }

  extractSubject(text) {
    const patterns = [
      /เรื่อง[\s:]*([^\n]+?)(?=เรียน|$)/i,
      /เรื่อง[\s:]*([\s\S]+?)(?=เรียน|ด้วย|$)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 200);
      }
    }

    return '';
  }

  convertThaiNumberToArabic(text) {
    const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    const arabicDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    let result = text;
    thaiDigits.forEach((thai, index) => {
      result = result.replace(new RegExp(thai, 'g'), arabicDigits[index]);
    });
    
    return result;
  }

  analyzePriority(text) {
    const urgentKeywords = ['ด่วนที่สุด', 'ด่วนมาก', 'เร่งด่วน', 'ด่วน'];
    
    for (const keyword of urgentKeywords) {
      if (text.includes(keyword)) {
        return 'สูง';
      }
    }
    
    return 'กลาง';
  }

  extractKeywords(text) {
    const stopWords = ['และ', 'หรือ', 'ของ', 'ที่', 'จาก', 'ถึง'];
    const words = text.match(/[ก-ฮ]{3,}/g) || [];
    const wordFreq = {};
    
    words.forEach(word => {
      if (!stopWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
}

module.exports = new OCRService();
