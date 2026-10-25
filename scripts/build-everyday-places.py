#!/usr/bin/env python3
"""Offline, reproducible OSM node catalogue. Requires osmium, Python stdlib only.
Usage: python3 scripts/build-everyday-places.py /path/thailand-261024.osm.pbf
Raw source is deliberately outside the repository. No visitor API dependency.
"""
import collections, datetime, hashlib, json, math, pathlib, subprocess, sys, tempfile
import xml.etree.ElementTree as ET

SOURCE = 'https://download.geofabrik.de/asia/thailand-261024.osm.pbf'
EXPECTED_MD5 = '215e1ff30fe4d4adef2db3d664dab9da'
AS_OF = '2026-10-24T20:20:51Z'
BOUNDS = [100.30, 13.45, 100.95, 14.10]  # supported pin centres, not city boundary
EXTRACT = [100.28, 13.43, 100.97, 14.12]  # >800 m search buffer at every edge
GROUPS = {
 'amenity': {'restaurant':'food','cafe':'food','fast_food':'food','food_court':'food',
 'marketplace':'markets','pharmacy':'health','clinic':'health','hospital':'health',
 'doctors':'health','dentist':'health'},
 'shop': dict.fromkeys(['supermarket','convenience','greengrocer','bakery','butcher','seafood'], 'groceries'),
 'leisure': dict.fromkeys(['fitness_centre','sports_centre'], 'fitness'),
 'tourism': dict.fromkeys(['museum','gallery'], 'culture')}

def classify(tags):
    if tags.get('access') in ('private','no') or tags.get('opening_hours') == 'closed' or any(tags.get(k) in ('yes','true','1') for k in ('closed','disused','abandoned','demolished')):
        return None
    for key, rules in GROUPS.items():
        if tags.get(key) in rules and not any(f'{prefix}:{key}' in tags for prefix in ('disused','abandoned','demolished','removed')):
            return rules[tags[key]], tags[key]
    return None

def build(source, output):
    hashes = {name: hashlib.new(name) for name in ('md5','sha256')}
    with source.open('rb') as f:
        while chunk := f.read(1024*1024):
            for h in hashes.values(): h.update(chunk)
    if hashes['md5'].hexdigest() != EXPECTED_MD5:
        raise ValueError('Source checksum differs; review and pin a new source contract before refresh')
    header = json.loads(subprocess.check_output(['osmium','fileinfo','-j',str(source)]))
    if header['header']['option']['timestamp'] != AS_OF: raise ValueError('Unexpected source timestamp')
    cells, counts = collections.defaultdict(list), collections.Counter()
    excluded = 0
    with tempfile.TemporaryDirectory() as tmp:
        filtered, clipped, xml = [str(pathlib.Path(tmp)/n) for n in ('filtered.pbf','clipped.pbf','places.osm')]
        subprocess.run(['osmium','tags-filter',str(source),*[f'n/{k}='+','.join(v) for k,v in GROUPS.items()],'-R','-o',filtered,'--no-progress'],check=True)
        subprocess.run(['osmium','extract',filtered,'--bbox',','.join(map(str,EXTRACT)),'-s','simple','-o',clipped,'--no-progress'],check=True)
        subprocess.run(['osmium','cat',clipped,'-f','osm','-o',xml,'--no-progress'],check=True)
        for _, node in ET.iterparse(xml,events=('end',)):
            if node.tag != 'node': continue
            tags = {t.attrib['k']:t.attrib['v'] for t in node.findall('tag')}
            match = classify(tags)
            if match is None: excluded += 1; node.clear(); continue
            lat, lng = round(float(node.attrib['lat']),4), round(float(node.attrib['lon']),4)
            group, kind = match
            name = (tags.get('name:en') or tags.get('name') or tags.get('brand') or '').strip()[:200]
            # Unnamed mapped amenities remain explicit; never invent a business name.
            point = {'id':node.attrib['id'],'name':name,'category':group,'kind':kind,
                     'lat':lat,'lng':lng,'editedAt':node.attrib.get('timestamp','')}
            cells[f'{math.floor(lat*20)}-{math.floor(lng*20)}'].append(point)
            counts[group] += 1; node.clear()
    output.mkdir(parents=True,exist_ok=True)
    files = {}
    for cell, rows in sorted(cells.items()):
        raw = json.dumps({'version':1,'sourceAsOf':AS_OF,'cell':cell,'places':sorted(rows,key=lambda p:int(p['id']))},ensure_ascii=False,separators=(',',':')).encode()+b'\n'
        if len(raw)>500_000: raise ValueError('Cell exceeds browser budget')
        digest = hashlib.sha256(raw).hexdigest()
        name = f'{cell}-{digest[:12]}.json'
        (output/name).write_bytes(raw)
        files[cell] = {'file':name,'count':len(rows),'bytes':len(raw),'sha256':digest}
    manifest = {'version':1,'source':SOURCE,'sourceAsOf':AS_OF,'sourceMd5':EXPECTED_MD5,'retrievedOn':'2026-10-25',
      'sourceSha256':hashes['sha256'].hexdigest(),'licence':'ODbL-1.0',
      'licenceUrl':'https://opendatacommons.org/licenses/odbl/1-0/',
      'attribution':'© OpenStreetMap contributors','attributionUrl':'https://www.openstreetmap.org/copyright',
      'crs':'EPSG:4326','precisionDecimals':4,'geometry':'node points only; no simplification or offsets',
      'bounds':BOUNDS,'extractBounds':EXTRACT,'cellDegrees':0.05,'categories':dict(sorted(counts.items())),
      'excludedExplicitlyUnavailable':excluded,'coverage':'Unknown completeness. Ways and relations excluded. Edit dates are not observation dates. Opening, access, walking routes and demand unverified.',
      'files':files}
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'categories':dict(counts),'cells':len(files),'maxBytes':max(v['bytes'] for v in files.values()),'sourceSha256':manifest['sourceSha256']}))

if __name__ == '__main__':
    build(pathlib.Path(sys.argv[1]),pathlib.Path(__file__).resolve().parents[1]/'public/data/places/everyday')
