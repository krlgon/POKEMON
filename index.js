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
    info: { title: 'PokeService API', version: '2.0.0',
            description: 'Pokémon desde Supabase y MongoDB Atlas' },
    servers: [{ url: SERVER_URL }],
  },
  apis: [__filename],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Pokemon:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         nombre:
 *           type: string
 *         peso:
 *           type: string
 *         altura:
 *           type: string
 *         imagenFrontal:
 *           type: string
 *         imagenPosterior:
 *           type: string
 *         poderes:
 *           type: string
 *         fuente:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /pokemon/{nombre}:
 *   get:
 *     summary: Buscar Pokémon en Supabase (PostgreSQL)
 *     tags: [Supabase - PostgreSQL]
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *           example: pikachu
 *     responses:
 *       200:
 *         description: Pokémon encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pokemon'
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error del servidor
 */
app.get('/pokemon/:nombre', async (req, res) => {
  const nombre = req.params.nombre.toLowerCase().trim();
  try {
    const result = await pgPool.query(
      'SELECT * FROM pokemon WHERE LOWER(nombre) = $1 LIMIT 1', [nombre]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: `"${nombre}" no encontrado en Supabase.` });
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
 *     summary: Buscar Pokémon en MongoDB Atlas
 *     tags: [MongoDB Atlas]
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *           example: snorlax
 *     responses:
 *       200:
 *         description: Pokémon encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pokemon'
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error del servidor
 */
app.get('/mongo/pokemon/:nombre', async (req, res) => {
  if (!mongoDb)
    return res.status(500).json({ error: 'MongoDB no disponible. Intenta en unos segundos.' });
  const nombre = req.params.nombre.toLowerCase().trim();
  try {
    const doc = await mongoDb.collection('pokemon').findOne({
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
    });
    if (!doc)
      return res.status(404).json({ error: `"${nombre}" no encontrado en MongoDB.` });
    const { _id, ...rest } = doc;
    return res.status(200).json({ ...rest, id: _id.toString(), fuente: 'mongodb' });
  } catch (err) {
    console.error('[MONGO ERROR]', err.message);
    return res.status(500).json({ error: 'Error al consultar MongoDB.' });
  }
});

app.get('/', (_req, res) => res.redirect('/api-docs'));
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

app.listen(PORT, () => {
  console.log(`✅ PokeService en ${SERVER_URL}`);
  console.log(`📄 Swagger: ${SERVER_URL}/api-docs`);
});