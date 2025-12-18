const db = require('../config/db'); // การเชื่อมต่อ DB ของคุณ

const getOcrResults = async (req, res) => {
  try {
    // ดึงข้อมูลโดยตรงจากตาราง ocr_results
    const [rows] = await db.execute(
      'SELECT id, extracted_text, created_at FROM ocr_results ORDER BY created_at DESC'
    );

    // ส่งข้อมูลกลับไป ( rows จะเป็น Array ของ Object ที่มีฟิลด์ extracted_text )
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = { getOcrResults };