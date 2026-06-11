from google import genai

# Your working API key
client = genai.Client(api_key="AIzaSyD3nCh_9RhV8-h3TuiJ00Y3g6PXApOTPk8")

# The prompt for LegalEase
prompt_text = "Explain this legal sentence for a farmer in simple words: 'The lessee shall be liable for all utilities and maintenance.'"

print("Contacting LegalEase AI...")

try:
    # We are using gemini-2.5-flash from your specific list
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt_text
    )

    print("-" * 30)
    print("LEGALESE OUTPUT:")
    print(response.text)
    print("-" * 30)

except Exception as e:
    print(f"An error occurred: {e}")