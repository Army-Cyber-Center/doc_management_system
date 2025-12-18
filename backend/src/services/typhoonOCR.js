const fetch = require("node-fetch");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const TYPHOON_BASE_URL = "https://api.opentyphoon.ai/v1";
const API_KEY = process.env.TYPHOON_OCR_API_KEY; // ต้องตั้งค่านี้ใน env

async function callTyphoonOCR(filePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));

  const response = await fetch(`${TYPHOON_BASE_URL}/files/ocr`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: form
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OCR API error: ${errorText}`);
  }

  return await response.json();
}

module.exports = { callTyphoonOCR };
