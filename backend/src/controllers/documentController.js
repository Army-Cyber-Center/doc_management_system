// Mock data (จะเปลี่ยนเป็น Database ในภายหลัง)
let documents = [
  { id: 1, title: 'หนังสือขออนุมัติงบประมาณ', from: 'กองคลัง', date: '2025-10-19', status: 'รับแล้ว', priority: 'สูง', type: 'incoming', dueDate: '2025-10-25' },
  { id: 2, title: 'บันทึกข้อความ เรื่อง การประชุม', from: 'ฝ่ายบริหาร', date: '2025-10-18', status: 'รอดำเนินการ', priority: 'กลาง', type: 'incoming', dueDate: '2025-10-22' },
  { id: 3, title: 'แบบฟอร์มขอลาพักร้อน', from: 'ฝ่ายทรัพยากรบุคคล', date: '2025-10-17', status: 'เสร็จสิ้น', priority: 'ต่ำ', type: 'incoming', dueDate: '2025-10-20' },
  { id: 4, title: 'หนังสือตอบกลับงบประมาณ', to: 'กองคลัง', date: '2025-10-19', status: 'ส่งแล้ว', priority: 'สูง', type: 'outgoing' },
  { id: 5, title: 'บันทึกข้อความภายใน', to: 'ฝ่ายปฏิบัติการ', date: '2025-10-18', status: 'รอส่ง', priority: 'กลาง', type: 'outgoing' },
];

// Get all documents
exports.getAllDocuments = async (req, res) => {
  try {
    const { type, status, priority, search } = req.query;
    let filtered = documents;

    if (type && type !== 'all') {
      filtered = filtered.filter(doc => doc.type === type);
    }
    if (status) {
      filtered = filtered.filter(doc => doc.status === status);
    }
    if (priority) {
      filtered = filtered.filter(doc => doc.priority === priority);
    }
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        (doc.from && doc.from.toLowerCase().includes(query)) ||
        (doc.to && doc.to.toLowerCase().includes(query))
      );
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

// Get document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const document = documents.find(doc => doc.id === parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document', error: error.message });
  }
};

// Create new document
exports.createDocument = async (req, res) => {
  try {
    const { title, type, from, to, priority, status, department, documentNo, date, subject } = req.body;
    
    const newDocument = {
      id: documents.length + 1,
      title,
      type: type || 'incoming',
      from,
      to,
      priority: priority || 'กลาง',
      status: status || 'รับแล้ว',
      department,
      documentNo,
      date: date || new Date().toISOString().split('T')[0],
      subject,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null
    };

    documents.push(newDocument);

    res.status(201).json({
      message: 'Document created successfully',
      document: newDocument
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating document', error: error.message });
  }
};

// Update document
exports.updateDocument = async (req, res) => {
  try {
    const docIndex = documents.findIndex(doc => doc.id === parseInt(req.params.id));
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    documents[docIndex] = { ...documents[docIndex], ...req.body };

    res.json({
      message: 'Document updated successfully',
      document: documents[docIndex]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating document', error: error.message });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const docIndex = documents.findIndex(doc => doc.id === parseInt(req.params.id));
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    documents.splice(docIndex, 1);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};

// Get statistics
exports.getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const stats = {
      incoming: documents.filter(doc => doc.type === 'incoming' && doc.date === today).length,
      outgoing: documents.filter(doc => doc.type === 'outgoing' && doc.date === today).length,
      pending: documents.filter(doc => doc.status === 'รอดำเนินการ').length,
      completed: documents.filter(doc => doc.status === 'เสร็จสิ้น').length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// Search documents
exports.searchDocuments = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const query = q.toLowerCase();
    const results = documents.filter(doc =>
      doc.title.toLowerCase().includes(query) ||
      (doc.from && doc.from.toLowerCase().includes(query)) ||
      (doc.to && doc.to.toLowerCase().includes(query))
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error searching documents', error: error.message });
  }
};
