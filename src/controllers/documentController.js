import api from '../services/api';

class DocumentController {
  constructor() {
    this.apiUrl = '/documents';
  }

  async getDocuments(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`${this.apiUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error in getDocuments:', error);
      return this.getMockDocuments(filters);
    }
  }

  async getDocumentById(id) {
    try {
      const response = await api.get(`${this.apiUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in getDocumentById:', error);
      throw error;
    }
  }

  async createDocument(documentData) {
    try {
      const formData = new FormData();
      
      Object.keys(documentData).forEach(key => {
        if (key === 'file' && documentData[key]) {
          formData.append('file', documentData[key]);
        } else if (key === 'keywords' && Array.isArray(documentData[key])) {
          formData.append('keywords', JSON.stringify(documentData[key]));
        } else if (documentData[key] !== null && documentData[key] !== undefined) {
          formData.append(key, documentData[key]);
        }
      });

      const response = await api.post(this.apiUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in createDocument:', error);
      throw error;
    }
  }

  async updateDocument(id, updates) {
    try {
      const response = await api.put(`${this.apiUrl}/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error in updateDocument:', error);
      throw error;
    }
  }

  async deleteDocument(id) {
    try {
      const response = await api.delete(`${this.apiUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }

  async getStatistics() {
    try {
      const response = await api.get(`${this.apiUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error in getStatistics:', error);
      return {
        incoming: 8,
        outgoing: 5,
        pending: 12,
        completed: 45
      };
    }
  }

  async searchDocuments(query) {
    try {
      const response = await api.get(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error in searchDocuments:', error);
      return [];
    }
  }

  getMockDocuments(filters) {
    const mockData = [
      { id: 1, title: 'หนังสือขออนุมัติงบประมาณ', from: 'ธรก', date: '2025-10-19', status: 'รับแล้ว', priority: 'ด่วนที่สุด', type: 'incoming', dueDate: '2025-10-25' },
      { id: 2, title: 'บันทึกข้อความ เรื่อง การประชุม', from: 'กง', date: '2025-10-18', status: 'รอดำเนินการ', priority: 'ด่วนมาก', type: 'incoming', dueDate: '2025-10-22' },
      { id: 3, title: 'แบบฟอร์มขอลาพักร้อน', from: 'งป', date: '2025-10-17', status: 'เสร็จสิ้น', priority: 'ปกติ', type: 'incoming', dueDate: '2025-10-20' },
      { id: 4, title: 'หนังสือตอบกลับงบประมาณ', to: 'กสข', date: '2025-10-19', status: 'ส่งแล้ว', priority: 'ปกติ', type: 'outgoing' },
      { id: 5, title: 'บันทึกข้อความภายใน', to: 'กปซ', date: '2025-10-18', status: 'รอส่ง', priority: 'ด่วนที่สุด', type: 'outgoing' },
    ];

    let filtered = mockData;

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(doc => doc.type === filters.type);
    }
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(doc => doc.priority === filters.priority);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        (doc.from && doc.from.toLowerCase().includes(query)) ||
        (doc.to && doc.to.toLowerCase().includes(query))
      );
    }

    return filtered;
  }
}

const documentController = new DocumentController();
export default documentController;
