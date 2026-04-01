const {SparqlEndpointFetcher} = require('fetch-sparql-endpoint');
const logger = require('../lib/logger');

const endpointUrl = 'https://dbpedia.org/sparql';
const fetcher = new SparqlEndpointFetcher();

let plantNamesCache = null;
let plantNamesCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const sanitizeSparql = (str) => {
  return str.replace(/[\\"]/g, '\\$&').replace(/[\n\r]/g, '');
};

const fetchPlantNames = async () => {
  if (plantNamesCache && (Date.now() - plantNamesCacheTime) < CACHE_TTL) {
    return plantNamesCache;
  }

  const sparqlQuery = `
    PREFIX dbo: <http://dbpedia.org/ontology/>

    SELECT DISTINCT ?name
    WHERE {
      ?s rdf:type dbo:Plant ;
         rdfs:label ?name .
      FILTER(lang(?name) = 'en')
      FILTER NOT EXISTS { ?s rdf:type dbo:NuclearPowerStation }
      FILTER NOT EXISTS { ?s rdf:type dbo:PowerStation }
      FILTER NOT EXISTS { ?s rdf:type dbo:Building }
      FILTER NOT EXISTS { ?s rdf:type dbo:Country }
      FILTER NOT EXISTS { ?s rdf:type dbo:MilitaryRank }
      FILTER (!REGEX(?name, '[^a-zA-Z0-9 ()]'))
    }
    ORDER BY ?name
  `;

  try {
    const bindingsStream = await fetcher.fetchBindings(endpointUrl, sparqlQuery);
    const plantNames = [];

    bindingsStream.on('data', (binding) => {
      if (binding.name) {
        plantNames.push(binding.name.value);
      }
    });

    return new Promise((resolve, reject) => {
      bindingsStream.on('end', () => {
        plantNamesCache = plantNames;
        plantNamesCacheTime = Date.now();
        resolve(plantNames);
      });
      bindingsStream.on('error', (error) => reject(error));
    });
  } catch (error) {
    logger.error({err: error}, 'Error fetching plant names from DBpedia');
    throw new Error('Failed to fetch plant names');
  }
};

/**
 * Fetch plant details from DBpedia.
 * Uses rdfs:label (name), dbo:description, dbo:thumbnail, foaf:isPrimaryTopicOf (wiki link).
 * dbo:abstract was removed from DBpedia — dbo:description is the replacement.
 */
const fetchPlantDetailsByIdentification = async (identification) => {
  const sanitized = sanitizeSparql(identification);

  const sparqlQuery = `
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?wiki_link ?image_link ?description
    WHERE {
      ?s rdf:type dbo:Plant ;
         rdfs:label "${sanitized}"@en .
      OPTIONAL { ?s foaf:isPrimaryTopicOf ?wiki_link }
      OPTIONAL { ?s dbo:thumbnail ?image_link }
      OPTIONAL { ?s dbo:description ?description . FILTER(lang(?description) = 'en') }
    }
    LIMIT 1
  `;

  try {
    const bindingsStream = await fetcher.fetchBindings(endpointUrl, sparqlQuery);
    const plantDetails = [];

    bindingsStream.on('data', (binding) => {
      plantDetails.push({
        wikiLink: binding.wiki_link?.value || '',
        imageLink: binding.image_link?.value || '',
        abstract: binding.description?.value || '',
      });
    });

    return new Promise((resolve, reject) => {
      bindingsStream.on('end', () => resolve(plantDetails));
      bindingsStream.on('error', (error) => reject(error));
    });
  } catch (error) {
    logger.error({err: error}, 'Error fetching plant details from DBpedia');
    throw new Error('Failed to fetch plant details');
  }
};

/**
 * @swagger
 * /api/dbpedia-plants:
 *   get:
 *     summary: Returns the list of all DBpedia plant names
 *     tags: [DBpedia]
 *     responses:
 *       200:
 *         description: The list of DBpedia plant names
 */
const apiGetAllDbpediaPlantNames = async (req, res) => {
  try {
    const plantNames = await fetchPlantNames();
    res.json(plantNames);
  } catch (_error) {
    res.status(500).json({error: 'Failed to fetch plant names'});
  }
};

/**
 * @swagger
 * /api/dbpedia-plants/{id}:
 *   get:
 *     summary: Get DBpedia details for a specific plant by ID
 *     tags: [DBpedia]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: The DBpedia details for the plant
 *       404:
 *         description: No details found
 */
const apiGetDbpediaPlantDetails = async (req, res) => {
  const identification = req.params.id;
  if (!identification) {
    return res.status(400).json({error: 'Identification is required'});
  }

  if (!/^[a-zA-Z0-9 ()]+$/.test(identification)) {
    return res.status(400).json({error: 'Invalid identification format'});
  }

  try {
    const plantDetails = await fetchPlantDetailsByIdentification(identification);
    res.json(plantDetails);
  } catch (_error) {
    res.status(500).json({error: 'Failed to fetch plant details'});
  }
};

module.exports = {
  apiGetAllDbpediaPlantNames,
  apiGetDbpediaPlantDetails,
};
