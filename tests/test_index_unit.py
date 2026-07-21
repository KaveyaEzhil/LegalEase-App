import io
import os
import sys
import unittest
from unittest.mock import patch

# Allow imports from web directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../web')))
import web.index as index

class IndexUnitTests(unittest.TestCase):
    def test_clean_ai_text_removes_terminal_and_model_markers(self):
        dirty_text = "\x1b[31mHello\x1b[0m [1A] [B world"
        cleaned = index.clean_ai_text(dirty_text)
        self.assertEqual(cleaned, "Hello ]  world")

    def test_deterministic_fallback_contains_expected_sections(self):
        fallback = index.get_deterministic_fallback("Hindi")
        self.assertIn("ENGLISH SUMMARY:", fallback)
        self.assertIn("HINDI SUMMARY:", fallback)
        self.assertIn("हिन्दी", fallback)

    def test_process_without_file_returns_validation_error(self):
        client = index.app.test_client()
        response = client.post("/process", data={"language": "Tamil"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {"error": "No file caught in pipeline"},
        )

    @patch("web.index.pytesseract.image_to_string", return_value="   ")
    @patch("web.index.Image.open")
    def test_process_blank_ocr_returns_readable_error(self, mock_open, _mock_ocr):
        mock_open.return_value = object()
        client = index.app.test_client()
        response = client.post(
            "/process",
            data={
                "language": "Tamil",
                "file": (io.BytesIO(b"not-a-real-image"), "blank.png"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json(),
            {
                "summary": (
                    "OCR Failed: The text image is too blurry to extract "
                    "letters properly."
                )
            },
        )

    @patch("web.index.ollama.generate", side_effect=RuntimeError("ollama offline"))
    def test_ollama_response_uses_fallback_on_error(self, _mock_generate):
        response = index.get_ollama_response("sample legal text", "Tamil")
        self.assertIn("ENGLISH SUMMARY:", response)
        self.assertIn("TAMIL SUMMARY:", response)


if __name__ == "__main__":
    unittest.main()
