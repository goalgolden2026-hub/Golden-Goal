const fs = require('fs');

const raw = `Grup A
11 Haziran	Meksika - Güney Afrika	22:00
12 Haziran	Güney Kore - Çekya	05:00
18 Haziran	Çekya - Güney Afrika	19:00
20 Haziran	Meksika - Güney Kore	04:00
25 Haziran	Güney Afrika - Güney Kore	04:00
25 Haziran	Çekya - Meksika	04:00

Grup B
12 Haziran	Kanada - Bosna Hersek	22:00
13 Haziran	Katar - İsviçre	22:00
18 Haziran	İsviçre - Bosna Hersek	22:00
19 Haziran	Kanada - Katar	01:00
24 Haziran	İsviçre - Kanada	22:00
24 Haziran	Bosna Hersek - Katar	22:00

Grup C
14 Haziran	Brezilya - Fas	01:00
14 Haziran	Haiti - İskoçya	04:00
20 Haziran	İskoçya - Fas	01:00
20 Haziran	Brezilya - Haiti	03:30
25 Haziran	Fas - Haiti	01:00
25 Haziran	İskoçya - Brezilya	01:00

Grup D
13 Haziran	ABD - Paraguay	04:00
14 Haziran	Avustralya - Türkiye	07:00
19 Haziran	ABD - Avustralya	22:00
20 Haziran	Türkiye - Paraguay	06:00
26 Haziran	Türkiye - ABD	05:00
26 Haziran	Paraguay - Avustralya	05:00

Grup E
14 Haziran	Almanya - Curaçao	20:00
15 Haziran	Fildişi Sahili - Ekvador	02:00
20 Haziran	Almanya - Fildişi Sahili	23:00
21 Haziran	Ekvador - Curaçao	03:00
25 Haziran	Curaçao - Fildişi Sahili	23:00
25 Haziran	Ekvador - Almanya	23:00

Grup F
14 Haziran	Hollanda - Japonya	23:00
15 Haziran	İsveç - Tunus	05:00
20 Haziran	Hollanda - İsveç	20:00
21 Haziran	Tunus - Japonya	07:00
26 Haziran	Tunus - Hollanda	02:00
26 Haziran	Japonya - İsveç	02:00

Grup G
15 Haziran	Belçika - Mısır	22:00
16 Haziran	İran - Yeni Zelanda	04:00
21 Haziran	Belçika - İran	22:00
22 Haziran	Yeni Zelanda - Mısır	04:00
27 Haziran	Yeni Zelanda - Belçika	06:00
27 Haziran	Mısır - İran	06:00

Grup H
15 Haziran	İspanya - Cape Verde	19:00
16 Haziran	Suudi Arabistan - Uruguay	01:00
21 Haziran	İspanya - Suudi Arabistan	19:00
22 Haziran	Uruguay - Cape Verde	01:00
27 Haziran	Cape Verde - Suudi Arabistan	03:00
27 Haziran	Uruguay - İspanya	03:00

Grup I
16 Haziran	Fransa - Senegal	22:00
17 Haziran	Irak - Norveç	01:00
23 Haziran	Fransa - Irak	00:00
23 Haziran	Norveç - Senegal	03:00
26 Haziran	Norveç - Fransa	22:00
26 Haziran	Senegal - Irak	22:00

Grup J
17 Haziran	Arjantin - Cezayir	04:00
17 Haziran	Avusturya - Ürdün	07:00
22 Haziran	Arjantin - Avusturya	20:00
23 Haziran	Ürdün - Cezayir	06:00
28 Haziran	Cezayir - Avusturya	05:00
28 Haziran	Ürdün - Arjantin	05:00

Grup K
17 Haziran	Portekiz - DR Kongo	20:00
18 Haziran	Özbekistan - Kolombiya	05:00
23 Haziran	Portekiz - Özbekistan	20:00
24 Haziran	Kolombiya - DR Kongo	05:00
28 Haziran	Kolombiya - Portekiz	02:30
28 Haziran	DR Kongo - Özbekistan	02:30

Grup L
17 Haziran	İngiltere - Hırvatistan	23:00
18 Haziran	Gana - Panama	02:00
23 Haziran	İngiltere - Gana	23:00
24 Haziran	Panama - Hırvatistan	02:00
27 Haziran	Panama - İngiltere	00:00
27 Haziran	Hırvatistan - Gana	00:00`;

const lines = raw.split('\n');
let values = [];

for (const line of lines) {
    if (!line.trim() || line.startsWith('Grup')) continue;
    
    // e.g., "11 Haziran\tMeksika - Güney Afrika\t22:00"
    let [datePart, teamsPart, timePart] = line.split('\t');
    if (!timePart) {
        // Handle cases where spacing is used instead of tabs
        const parts = line.split(/\s{2,}|\t/);
        if(parts.length === 3) {
            datePart = parts[0];
            teamsPart = parts[1];
            timePart = parts[2];
        } else {
            console.error("Could not parse line: " + line);
            continue;
        }
    }
    
    const [day, monthName] = datePart.split(' ');
    // World cup is 2026. Haziran = June = 06
    const month = '06'; 
    const paddedDay = day.padStart(2, '0');
    
    // Turkish time is GMT+3. Let's just store it as the literal time string provided but in UTC so it renders identically.
    // Actually, if we store '2026-06-11T22:00:00Z', the frontend will render it as local time.
    // The user said: "Türkiye saatiyle grup fikstürü".
    // So 22:00 TRT is 19:00 UTC.
    // If we want it to display as 22:00 when the user opens the page in Turkey, we should store it in UTC properly.
    // '2026-06-11 22:00:00+03' will be correctly parsed by postgres as UTC, and then returned as a UTC string.
    
    const [teamA, teamB] = teamsPart.split(' - ');
    
    values.push(`('${teamA}', '${teamB}', '2026-${month}-${paddedDay} ${timePart}:00+03', 100)`);
}

const sqlValues = values.join(',\n            ');

const routePath = 'src/app/api/admin/reset-db/route.js';
let routeCode = fs.readFileSync(routePath, 'utf8');

const regex = /(INSERT INTO markets\s+\("teamA", "teamB", "matchDate", "pointsReward"\)\s+VALUES\s+)[\s\S]+?(';)/;
routeCode = routeCode.replace(regex, `$1\n            ${sqlValues}\n        $2`);

fs.writeFileSync(routePath, routeCode);
console.log("Updated reset-db/route.js");
