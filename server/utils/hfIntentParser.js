import axios from 'axios';

const HF_API_TOKEN = process.env.HF_API_TOKEN; // Add your Hugging Face token to .env
const MODEL = 'MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli'; // Confirmed router-compatible model


export async function classifyIntent(text, labels = ['book', 'cancel', 'info', 'other']) {
  const response = await axios.post(
    `https://router.huggingface.co/models/${MODEL}`,
    { inputs: text, parameters: { candidate_labels: labels } },
    { headers: { Authorization: `Bearer ${HF_API_TOKEN}` } }
  );
  return response.data;
}
