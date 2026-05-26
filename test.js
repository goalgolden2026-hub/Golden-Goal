const fs = require('fs');
const routeCode = fs.readFileSync('src/app/api/admin/reset-db/route.js', 'utf8');
const match = routeCode.match(/INSERT INTO markets\s+\("teamA", "teamB", "matchDate", "pointsReward"\)\s+VALUES\s+([\s\S]+?);/);
console.log(match[1]);
