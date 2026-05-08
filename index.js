const express          = require('express');
const cors             = require('cors');
const { Pool }         = require('pg');
const { MongoClient }  = require('mongodb');
const swaggerJsdoc     = require('swagger-jsdoc');
const swaggerUi        = require('swagger-ui-express');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ── Supabase (PostgreSQL) ──────────────────────────────────
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── MongoDB Atlas ──────────────────────────────────────────
let mongoDb = null;
async function connectMongo() {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    mongoDb = client.db('pokeservice');
    console.log('✅ MongoDB Atlas conectado');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
  }
}
connectMongo();

// ── Swagger ────────────────────────────────────────────────
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

const swaggerSpec = swaggerJsdoc({
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'PokeService API',
      version: '2.0.0',
      description: 'Consulta Pokemon desde Supabase (PostgreSQL) y MongoDB Atlas',
    },
    servers: [{ url: SERVER_URL, description: 'Servidor en Render' }],
    components: {
      schemas: {
        Pokemon: {
          type: 'object',
          properties: {
            id:              { type: 'string',  example: '1' },
            nombre:          { type: 'string',  example: 'pikachu' },
            peso:            { type: 'string',  example: '6.0 kg' },
            altura:          { type: 'string',  example: '0.4 m' },
            imagenFrontal:   { type: 'string',  example: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
            imagenPosterior: { type: 'string',  example: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/25.png' },
            poderes:         { type: 'string',  example: 'Static,Thunder,Quick-attack' },
            fuente:          { type: 'string',  example: 'supabase' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Pokemon no encontrado' },
          },
        },
      },
    },
  },
  apis: [__filename],
});

// Exponer swagger.json con CORS abierto
app.get('/api-docs/swagger.json', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(swaggerSpec);
});

// Montar Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: `${SERVER_URL}/api-docs/swagger.json`,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    filter: true,
  },
  customCss: '.swagger-ui .topbar { display: none }',
}));

// ── ENDPOINTS ──────────────────────────────────────────────

/**
 * @swagger
 * /pokemon/{nombre}:
 *   get:
 *     summary: Buscar Pokemon en Supabase
 *     description: Consulta la base de datos PostgreSQL alojada en Supabase.
 *     tags:
 *       - Supabase - PostgreSQL
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         description: Nombre del Pokemon (pikachu, bulbasaur, charmander, squirtle, jigglypuff, meowth, psyduck, gengar, eevee, mewtwo)
 *         schema:
 *           type: string
 *           example: pikachu
 *     responses:
 *       200:
 *         description: Pokemon encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pokemon'
 *       404:
 *         description: No encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/pokemon/:nombre', async (req, res) => {
  const nombre = req.params.nombre.toLowerCase().trim();
  try {
    const result = await pgPool.query(
      'SELECT * FROM pokemon WHERE LOWER(nombre) = $1 LIMIT 1',
      [nombre]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `"${nombre}" no encontrado en Supabase.` });
    }
    return res.status(200).json({ ...result.rows[0], fuente: 'supabase' });
  } catch (err) {
    console.error('[SUPABASE ERROR]', err.message);
    return res.status(500).json({ error: 'Error al consultar Supabase.' });
  }
});

/**
 * @swagger
 * /mongo/pokemon/{nombre}:
 *   get:
 *     summary: Buscar Pokemon en MongoDB Atlas
 *     description: Consulta la base de datos NoSQL alojada en MongoDB Atlas.
 *     tags:
 *       - MongoDB Atlas
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         description: Nombre del Pokemon (snorlax, charizard, lapras, dragonite, machamp, alakazam, gyarados, arcanine, raichu, venusaur)
 *         schema:
 *           type: string
 *           example: snorlax
 *     responses:
 *       200:
 *         description: Pokemon encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pokemon'
 *       404:
 *         description: No encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/mongo/pokemon/:nombre', async (req, res) => {
  if (!mongoDb) {
    return res.status(500).json({ error: 'MongoDB no disponible. Intenta en unos segundos.' });
  }
  const nombre = req.params.nombre.toLowerCase().trim();
  try {
    const doc = await mongoDb.collection('pokemon').findOne({
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    });
    if (!doc) {
      return res.status(404).json({ error: `"${nombre}" no encontrado en MongoDB.` });
    }
    const { _id, ...rest } = doc;
    return res.status(200).json({ ...rest, id: _id.toString(), fuente: 'mongodb' });
  } catch (err) {
    console.error('[MONGO ERROR]', err.message);
    return res.status(500).json({ error: 'Error al consultar MongoDB.' });
  }
});

// ── Raiz ───────────────────────────────────────────────────
app.get('/', (_req, res) => res.redirect('/api-docs'));

// ── 404 ────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// ── Iniciar servidor ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ PokeService en ${SERVER_URL}`);
  console.log(`📄 Swagger: ${SERVER_URL}/api-docs`);
});