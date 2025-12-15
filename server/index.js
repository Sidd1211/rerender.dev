const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { analyze } = require('./analyze');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// --- API Endpoint Definition ---
app.post('/analyze', (req, res) => {
  const codeToAnalyze = req.body.code;

  if (!codeToAnalyze) {
    // Send a 400 Bad Request if 'code' is missing
    return res.status(400).json({
      error: 'Missing "code" parameter in the request body.',
      expectedFormat: '{"code": "..."}'
    });
  }

  // Call the imported analysis function
  const analysisResult = analyze(codeToAnalyze);

  // Return the result as JSON
  res.json(analysisResult);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});