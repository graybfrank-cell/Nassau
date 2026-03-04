const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'nassau-knowledge-base.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const newDestinations = [
  {
    id: "coeur-dalene-id",
    name: "Coeur d'Alene, ID",
    state: "ID",
    region: "Pacific Northwest",
    description: "Home to the famous floating green, Coeur d'Alene offers stunning lakeside golf in the Idaho panhandle.",
    courses: ["Coeur d'Alene Resort Golf Course", "Circling Raven Golf Club", "The Idaho Club", "Gozzer Ranch"],
    bestTimeToVisit: "June - September",
    averageGreenFee: 200,
    nearestAirport: "SFF",
    highlights: ["Floating green", "Lake views", "Mountain scenery", "Resort amenities"]
  },
  {
    id: "bend-or",
    name: "Bend, OR",
    state: "OR",
    region: "Pacific Northwest",
    description: "High-desert golf in Central Oregon with Cascade Mountain views, volcanic terrain, and crisp mountain air.",
    courses: ["Pronghorn Resort", "Tetherow Golf Club", "Crosswater Club", "Brasada Canyons"],
    bestTimeToVisit: "June - September",
    averageGreenFee: 150,
    nearestAirport: "RDM",
    highlights: ["Cascade views", "Craft beer capital", "Volcanic terrain", "Outdoor adventure"]
  },
  {
    id: "french-lick-in",
    name: "French Lick, IN",
    state: "IN",
    region: "Midwest",
    description: "A historic resort destination in the Indiana hills featuring Pete Dye and Donald Ross designs with dramatic ridge-top golf.",
    courses: ["Pete Dye Course at French Lick", "Donald Ross Course", "Sultan's Run Golf Club"],
    bestTimeToVisit: "May - October",
    averageGreenFee: 175,
    nearestAirport: "SDF",
    highlights: ["Pete Dye masterpiece", "Historic resort", "Ridge-top views", "Casino entertainment"]
  },
  {
    id: "traverse-city-mi",
    name: "Traverse City, MI",
    state: "MI",
    region: "Midwest",
    description: "Northern Michigan's crown jewel with cherry orchards, Grand Traverse Bay views, and world-class resort golf.",
    courses: ["Arcadia Bluffs", "The Bear at Grand Traverse Resort", "A-Ga-Ming Golf Resort", "Manitou Passage"],
    bestTimeToVisit: "June - September",
    averageGreenFee: 125,
    nearestAirport: "TVC",
    highlights: ["Arcadia Bluffs cliffs", "Wine country", "Cherry orchards", "Bay views"]
  },
  {
    id: "santa-fe-nm",
    name: "Santa Fe, NM",
    state: "NM",
    region: "Southwest",
    description: "High-desert golf at 7,000 feet with rich art culture, adobe architecture, and stunning Sangre de Cristo Mountain views.",
    courses: ["Black Mesa Golf Club", "Towa Golf Resort", "Marty Sanchez Links de Santa Fe", "Cochiti Golf Club"],
    bestTimeToVisit: "April - October",
    averageGreenFee: 75,
    nearestAirport: "SAF",
    highlights: ["High-altitude golf", "Art galleries", "Adobe architecture", "Southwestern cuisine"]
  },
  {
    id: "williamsburg-va",
    name: "Williamsburg, VA",
    state: "VA",
    region: "Southeast",
    description: "Colonial history meets championship golf with courses woven through Virginia's tidewater forests and historic landmarks.",
    courses: ["Kingsmill Resort", "Colonial Williamsburg Golden Horseshoe", "Williamsburg National", "Ford's Colony"],
    bestTimeToVisit: "April - June, September - November",
    averageGreenFee: 100,
    nearestAirport: "PHF",
    highlights: ["Colonial history", "Kingsmill Resort", "Busch Gardens nearby", "Fall foliage"]
  },
  {
    id: "pawleys-island-sc",
    name: "Pawleys Island, SC",
    state: "SC",
    region: "Southeast",
    description: "A laid-back Lowcountry golf haven south of Myrtle Beach with acclaimed courses among live oaks and salt marshes.",
    courses: ["Caledonia Golf & Fish Club", "True Blue Golf Club", "Pawleys Plantation", "Litchfield Country Club"],
    bestTimeToVisit: "March - May, September - November",
    averageGreenFee: 110,
    nearestAirport: "MYR",
    highlights: ["Caledonia plantation setting", "Lowcountry charm", "Less crowded", "Fresh seafood"]
  },
  {
    id: "reynolds-lake-oconee-ga",
    name: "Reynolds Lake Oconee, GA",
    state: "GA",
    region: "Southeast",
    description: "A premier lakeside golf community east of Atlanta with six championship courses on the shores of Lake Oconee.",
    courses: ["Great Waters", "The Oconee", "The National", "Reynolds Landing", "The Creek Club", "The Preserve"],
    bestTimeToVisit: "April - October",
    averageGreenFee: 200,
    nearestAirport: "ATL",
    highlights: ["Six courses", "Lakefront setting", "Ritz-Carlton Lodge", "Water recreation"]
  },
  {
    id: "robert-trent-jones-trail-al",
    name: "Robert Trent Jones Trail, AL",
    state: "AL",
    region: "Southeast",
    description: "A 468-hole collection spanning 11 sites across Alabama, designed by Robert Trent Jones Sr. as one of the greatest public golf experiences in the world.",
    courses: ["Ross Bridge", "Capitol Hill", "Grand National", "Oxmoor Valley", "Magnolia Grove"],
    bestTimeToVisit: "March - May, September - November",
    averageGreenFee: 65,
    nearestAirport: "BHM",
    highlights: ["468 holes statewide", "Incredible value", "RTJ Sr. designs", "Southern hospitality"]
  }
];

console.log(`Current destination count: ${data.destinations.length}`);

// Check for duplicates before adding
const existingIds = new Set(data.destinations.map(d => d.id));
let added = 0;

for (const dest of newDestinations) {
  if (existingIds.has(dest.id)) {
    console.log(`Skipping duplicate: ${dest.name} (${dest.id})`);
    continue;
  }
  data.destinations.push(dest);
  added++;
  console.log(`Added: ${dest.name}`);
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

console.log(`\nAdded ${added} new destinations.`);
console.log(`Total destinations: ${data.destinations.length}`);
