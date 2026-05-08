const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://pokeuser:W6gZ45HInFM4xNqI@pokeservice.otil1gy.mongodb.net/pokeservice?retryWrites=true&w=majority&appName=pokeservice';

const pokemones = [
  { nombre:'snorlax',   peso:'460.0 kg', altura:'2.1 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/143.png',
    poderes:'Immunity,Thick-fat,Gluttony,Rest,Body-slam,Snore' },
  { nombre:'charizard', peso:'90.5 kg',  altura:'1.7 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/6.png',
    poderes:'Blaze,Solar-power,Flamethrower,Dragon-claw,Air-slash' },
  { nombre:'lapras',    peso:'220.0 kg', altura:'2.5 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/131.png',
    poderes:'Water-absorb,Shell-armor,Hydration,Surf,Ice-beam,Sing' },
  { nombre:'dragonite', peso:'210.0 kg', altura:'2.2 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/149.png',
    poderes:'Inner-focus,Multiscale,Dragon-rush,Hyper-beam,Thunder-wave' },
  { nombre:'machamp',   peso:'130.0 kg', altura:'1.6 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/68.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/68.png',
    poderes:'Guts,No-guard,Steadfast,Cross-chop,Dynamic-punch,Bulk-up' },
  { nombre:'alakazam',  peso:'48.0 kg',  altura:'1.5 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/65.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/65.png',
    poderes:'Synchronize,Inner-focus,Magic-guard,Psychic,Shadow-ball,Focus-blast' },
  { nombre:'gyarados',  peso:'235.0 kg', altura:'6.5 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/130.png',
    poderes:'Intimidate,Moxie,Hyper-beam,Dragon-dance,Waterfall,Ice-fang' },
  { nombre:'arcanine',  peso:'155.0 kg', altura:'1.9 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/59.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/59.png',
    poderes:'Intimidate,Flash-fire,Justified,Flare-blitz,Extreme-speed,Wild-charge' },
  { nombre:'raichu',    peso:'30.0 kg',  altura:'0.8 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/26.png',
    poderes:'Static,Lightning-rod,Thunderbolt,Thunder,Volt-tackle,Agility' },
  { nombre:'venusaur',  peso:'100.0 kg', altura:'2.0 m',
    imagenFrontal:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png',
    imagenPosterior:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/3.png',
    poderes:'Overgrow,Chlorophyll,Petal-dance,Solar-beam,Earthquake,Synthesis' },
];

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log('✅ Conectado a MongoDB Atlas');
  const col = client.db('pokeservice').collection('pokemon');
  await col.deleteMany({});
  const r = await col.insertMany(pokemones);
  console.log(`✅ ${r.insertedCount} Pokémon insertados`);
  await client.close();
}
main().catch(console.error);