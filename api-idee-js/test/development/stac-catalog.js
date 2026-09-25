import { map as Mmap } from 'IDEE/api-idee';
import Catalog from 'IDEE/stac/Catalog';
import GeoJSON from 'IDEE/layer/GeoJSON';
import GeoTIFF from 'IDEE/layer/GeoTIFF';
import { transformExtent } from 'ol/proj';

window.catalog = null;
let layerCounter = 0;
let stacLayers = [];
let stacTiffs = [];
let links = [];

const resultsEl = document.getElementById('results');
const catalogUrlInput = document.getElementById('catalog-url');
const authUrlInput = document.getElementById('auth-url');
const collectionsUrlInput = document.getElementById('collections-url');
const publicInput = document.getElementById('public');
const collectionIdInput = document.getElementById('collection-id');
const itemIdInput = document.getElementById('item-id');
const tokenUserInput = document.getElementById('token-user');
const tokenPasswordInput = document.getElementById('token-password');
const queryFiltersInput = document.getElementById('query-filters');
const queryLimitInput = document.getElementById('query-limit');
const filterFormatSelect = document.getElementById('filter-format');
const filterBodyInput = document.getElementById('filter-body');
const spatialFilterInput = document.getElementById('spatial-filter');

const runHandler = (label, handler, addsToMap = false) => async () => {
	resetResults();
	try {
		log(`>>> ${label}`);
		const result = await handler();
		log(`<<< ${label}`, result);
		if (addsToMap) {
			const layer = addItemsToMap(label, result);
			if (layer) {
				log('Capa GeoJSON añadida al mapa', { name: layer.name, features: layer.source?.features?.length });
			}
		}
	} catch (err) {
		logError(`<<< ${label} ERROR`, err);
	}
};

const log = (message, data) => {
	const timestamp = new Date().toLocaleTimeString();
	const line = data !== undefined
		? `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}`
		: `[${timestamp}] ${message}`;
	resultsEl.textContent = resultsEl.textContent
		? `${resultsEl.textContent}\n\n${line}`
		: line;
	console.log(message, data !== undefined ? data : '');
};

const logError = (message, err) => {
	console.error(err);
	log(message, { message: err.message });
};

const getQueryLimit = () => {
	const value = parseInt(queryLimitInput.value, 10);
	return value;
};

const parseJsonInput = (value, fieldName) => {
	if (!value || !value.trim()) {
		return {};
	}
	try {
		return JSON.parse(value);
	} catch (err) {
		throw new Error(`${fieldName} no es un JSON válido`);
	}
};

const getCollectionId = () => {
	const collectionId = collectionIdInput.value.trim();
	if (collectionId && collectionId.includes(',')) {
		return collectionId.split(',');
	}
	return collectionId;
};

const getFilterConfig = () => ({
	format: filterFormatSelect.value,
	filter: parseJsonInput(filterBodyInput.value, 'filtro POST'),
	limit: getQueryLimit(),
});

const removeStacLayers = () => {
	if (stacLayers.length === 0) {
		return;
	}
	mapa.removeLayers(stacLayers);
	mapa.removeLayers(stacTiffs);
	stacLayers = [];
	stacTiffs = [];
	layerCounter = 0;
};

const clearResults = () => {
	resultsEl.textContent = 'Pulsa un botón para ejecutar una función de Catalog.';
	removeStacLayers();
};

const getItemId = () => {
	const itemId = itemIdInput.value.trim();
	return itemId;
};

const resetResults = () => {
	resultsEl.textContent = '';
};

const toFeatureCollection = (result) => {
	if (!result) {
		return null;
	}

	if (result.type === 'FeatureCollection' && Array.isArray(result.features)) {
		return result;
	}

	if (result.type === 'Feature') {
		return {
			type: 'FeatureCollection',
			features: [result],
		};
	}

	return null;
};

const addItemsToMap = (label, result) => {
	if (result.links) {
		links = result.links;
	}
	const source = toFeatureCollection(result);
	if (!source || source.features.length === 0) {
		log('Sin geometrías para añadir al mapa');
		return null;
	}

	layerCounter += 1;
	const layerName = `${label} (${layerCounter})`;
	const layer = new GeoJSON({
		name: layerName,
		legend: layerName,
		source,
		extract: true,
	});
	layer.on('load', () => {
		mapa.setBbox(layer.getFeaturesExtent());
	});
	mapa.addLayers(layer);
	stacLayers.push(layer);
	addGeotiffToMap(source);
	return layer;
};

const addGeotiffToMap = (geojson) => {
	const features = geojson.features;
	const tiffs = [];
	for (let feature of features) {
		const assets = feature.assets;
		const tiffsKeys = Object.keys(assets);
		for (let key of tiffsKeys) {
			const type = assets[key].type;
			if (type.includes('image/tif')) {
				const geotiff = new GeoTIFF({
					url: assets[key].href,
				});
				tiffs.push(geotiff);
				stacTiffs.push(geotiff);
				break;
			}
		}
	}
	mapa.addLayers(tiffs);
}


document.getElementById('btn-constructor').addEventListener('click', runHandler('constructor(url, authUrl, public)', () => {
	const url = catalogUrlInput.value.trim();
	const authUrl = authUrlInput.value.trim();
	const collectionsUrl = collectionsUrlInput.value.trim();
	const publicCatalog = publicInput.checked;

	catalog = new Catalog({ url, authUrl, collectionsUrl, public: publicCatalog });
	window.catalog = catalog;
	return { url, authUrl, collectionsUrl, public: publicCatalog };
}));

document.getElementById('btn-authenticate').addEventListener('click', runHandler('authenticate(user, password)', () => {
	const user = tokenUserInput.value.trim();
	const password = tokenPasswordInput.value.trim();
	catalog.authenticate(user, password);
	return { user, password };
}));

document.getElementById('btn-getCollections').addEventListener('click', runHandler('getCollections()', () => {
	return catalog.getCollections();
}));

document.getElementById('btn-getQueryableFields').addEventListener('click', runHandler('getQueryableFields(collectionId)', () => {
	return catalog.getQueryableFields(getCollectionId());
}));

document.getElementById('btn-getItems').addEventListener('click', runHandler('getItems(collectionId)', () => {
	return catalog.getItems(getCollectionId(), getQueryLimit());
}, true));

document.getElementById('btn-getItem').addEventListener('click', runHandler('getItem(collectionId, itemId)', () => {
	return catalog.getItem(getCollectionId(), getItemId());
}, true));

document.getElementById('btn-getFilteredItems').addEventListener('click', runHandler('getFilteredItems(collectionId, filters)', () => {
	const filters = {
		...parseJsonInput(queryFiltersInput.value, 'filtros GET'),
		limit: getQueryLimit(),
	};
	return catalog.getFilteredItems(getCollectionId(), filters);
}, true));

document.getElementById('btn-getFilteredItemsAdvanced').addEventListener('click', runHandler('getFilteredItemsAdvanced(collectionId, filter)', () => {
	const filter = getFilterConfig();
	let bbox = null;
	if (spatialFilterInput.checked) {
		bbox = mapa.getBbox();
		bbox = transformExtent(
			[bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max],
			mapa.getProjection().code,
			'EPSG:4326',
		);
	}
	return catalog.getFilteredItemsAdvanced(getCollectionId(), filter, bbox);
}, true));



document.getElementById('btn-getFilteredItemsAdvancedByLinks').addEventListener('click', runHandler('getFilteredItemsAdvancedByLinks(links, rel, collectionId, filter, bbox)', () => {
	const rel = 'next';
	return catalog.getFilteredItemsAdvancedByLinks(links, rel);
}, true));

document.getElementById('btn-getItemsByLinks').addEventListener('click', runHandler('getItemsByLinks(links, rel)', () => {
	const rel = 'next';
	return catalog.getItemsByLinks(links, rel);
}, true));

document.getElementById('btn-clear').addEventListener('click', clearResults);


const mapa = Mmap({
	container: 'map',
	getfeatureinfo: 'plain',
	projection: 'EPSG:4326',
	layers: ['OSM'],
});

window.map = mapa;