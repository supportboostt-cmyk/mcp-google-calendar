const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Listar eventos
app.get('/mcp/clinica-x/eventos', async (req, res) => {
  try {
    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.json({ eventos: data.items });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Criar evento
app.post('/mcp/clinica-x/agendar', async (req, res) => {
  try {
    const { titulo, descricao, inicio, fim, email } = req.body;
    const evento = {
      summary: titulo,
      description: descricao,
      start: { dateTime: inicio, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: fim, timeZone: 'America/Sao_Paulo' },
      attendees: email ? [{ email }] : [],
    };
    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      resource: evento,
    });
    res.json({ sucesso: true, evento: data });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Deletar evento
app.delete('/mcp/clinica-x/cancelar/:id', async (req, res) => {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: req.params.id,
    });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// SSE endpoint para MCP
app.get('/mcp/clinica-x/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('data: {"status":"connected"}\n\n');
  setInterval(() => res.write('data: {"ping":"ok"}\n\n'), 30000);
});

app.listen(PORT, () => console.log(`MCP Server rodando na porta ${PORT}`));
