// MUSA Inspiration API — server-side provider gateway.
// Only publicly documented APIs are queried. Unsplash credentials never reach browsers.
const ALLOWED = new Set(["unsplash", "met", "artic", "wikimedia", "all"]);
const asText = (value) => String(value ?? "").replace(/<[^>]*>/g, "").trim().slice(0, 220);
const validURL = (raw) => {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
};
const img = (raw) => validURL(raw);
const make = (source, record) => ({
  id: asText(record.id),
  source,
  title: asText(record.title) || "Sin título",
  creator: asText(record.creator) || "Autor no identificado",
  image: img(record.image),
  link: validURL(record.link),
  creatorUrl: validURL(record.creatorUrl),
  sourceUrl: validURL(record.sourceUrl),
  license: asText(record.license),
  downloadLocation: validURL(record.downloadLocation),
});
const timeOutFetch = async (url, headers = {}) => {
  const resp = await fetch(url, {
    headers: {"Accept": "application/json", ...headers},
    signal: AbortSignal.timeout(9000),
  });
  if (!resp.ok) throw new Error("Servicio temporalmente no disponible (" + resp.status + ")");
  return resp.json();
};
async function unsplash(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error("Unsplash no está habilitado en este entorno.");
  const data = await timeOutFetch(
    "https://api.unsplash.com/search/photos?query=" + encodeURIComponent(query) + "&per_page=12&content_filter=high",
    {Authorization: "Client-ID " + key, "Accept-Version": "v1"}
  );
  return (data.results || []).map(p => {
    const track = "utm_source=musa_creative_lab&utm_medium=referral";
    const photographer = p.user || {};
    const photographerLink = photographer.links?.html || "";
    const photoLink = p.links?.html || "https://unsplash.com";
    const add = (url) => url ? url + (url.includes("?") ? "&" : "?") + track : "";
    return make("unsplash", {
      id: p.id,
      title: p.alt_description || p.description || "Fotografía en Unsplash",
      creator: photographer.name || "Fotógrafo de Unsplash",
      image: p.urls?.small || p.urls?.regular,
      link: add(photoLink),
      creatorUrl: add(photographerLink),
      sourceUrl: "https://unsplash.com/?"+track,
      license: "Licencia Unsplash",
      downloadLocation: p.links?.download_location,
    });
  }).filter(item => item.image && item.link);
}
async function met(query) {
  const result = await timeOutFetch(
    "https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&limit=24&q=" + encodeURIComponent(query)
  );
  const ids = (result.objectIDs || []).slice(0, 22);
  const pieces = await Promise.allSettled(ids.map(id =>
    timeOutFetch("https://collectionapi.metmuseum.org/public/collection/v1/objects/" + id)
  ));
  return pieces.filter(x=>x.status === "fulfilled").map(({value:p}) =>
    make("met",{
      id: p.objectID,
      title: p.title,
      creator: p.artistDisplayName || p.culture || "The Met",
      image: p.primaryImageSmall,
      link: p.objectURL || "https://www.metmuseum.org/art/collection",
      creatorUrl: "",
      sourceUrl: "https://www.metmuseum.org",
      license: p.isPublicDomain ? "Dominio público" : "Ver derechos en The Met",
    })
  ).filter(item => item.image && item.link).slice(0,12);
}
async function artic(query) {
  const fields = "id,title,artist_title,image_id,is_public_domain";
  const data = await timeOutFetch(
    "https://api.artic.edu/api/v1/artworks/search?q=" + encodeURIComponent(query) +
    "&limit=12&fields=" + fields
  );
  return (data.data || []).map(p => make("artic", {
    id: p.id,
    title: p.title,
    creator: p.artist_title || "Art Institute of Chicago",
    image: p.image_id ? "https://www.artic.edu/iiif/2/" + encodeURIComponent(p.image_id) + "/full/600,/0/default.jpg" : "",
    link: "https://www.artic.edu/artworks/" + p.id,
    sourceUrl: "https://www.artic.edu/",
    license: p.is_public_domain ? "Dominio público" : "Ver derechos en el museo",
  })).filter(item => item.image);
}
async function wikimedia(query) {
  const url = "https://commons.wikimedia.org/w/api.php?action=query&generator=search&" +
    "gsrsearch=" + encodeURIComponent(query) + "&gsrnamespace=6&gsrlimit=16&" +
    "prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=600&format=json&formatversion=2";
  const data = await timeOutFetch(url, {
    "User-Agent": "MusaCreativeLab/1.0 (https://github.com/Santiagonavas99/musa-creative-lab)"
  });
  return (data.query?.pages || []).map(p => {
    const details = p.imageinfo?.[0] || {};
    const license = details.extmetadata?.LicenseShortName?.value || "Consultar licencia";
    const author = details.extmetadata?.Artist?.value || "Wikimedia Commons";
    return make("wikimedia", {
      id: p.pageid,
      title: p.title?.replace(/^File:/, "") || "Archivo Wikimedia",
      creator: author,
      image: details.thumburl || details.url,
      link: details.descriptionurl || "https://commons.wikimedia.org/",
      sourceUrl: "https://commons.wikimedia.org/",
      license,
    });
  }).filter(item => item.image && item.link && !/\.svg(\?|$)/i.test(item.image)).slice(0,12);
}
const SOURCES = {unsplash, met, artic, wikimedia};
module.exports = async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "s-maxage=240, stale-while-revalidate=600");
  if (req.method !== "GET") return res.status(405).json({error: "Método no permitido"});
  const query = String(req.query.q || "").trim().slice(0, 100);
  const source = String(req.query.source || "unsplash");
  if (query.length < 2) return res.status(400).json({error: "Escribe al menos dos caracteres"});
  if (!ALLOWED.has(source)) return res.status(400).json({error: "Fuente no disponible"});
  try {
    if (source === "all") {
      const entries = await Promise.allSettled(Object.entries(SOURCES).map(
        async ([key,fn]) => ({source:key,items:await fn(query)})
      ));
      const results = entries.filter(x=>x.status==="fulfilled").flatMap(x=>x.value.items.slice(0,6));
      const failed = entries.filter(x=>x.status==="rejected").length;
      if (!results.length && failed === entries.length) throw new Error("Las fuentes no respondieron. Prueba otra búsqueda.");
      return res.status(200).json({source,query,results,partial:failed>0});
    }
    const results = await SOURCES[source](query);
    return res.status(200).json({source,query,results,partial:false});
  } catch(error) {
    console.error("MUSA inspiration failure:", source, error?.message);
    return res.status(503).json({source,query,error: error?.message || "No fue posible consultar esta fuente"});
  }
};