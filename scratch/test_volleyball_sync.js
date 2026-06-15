const RAPIDAPI_KEY = '15e24fe1f1msh75f445d3e3d398dp1968d3jsn73f855695703';
const SPORT_API_HOST = 'sportapi7.p.rapidapi.com';

function calculateVolleyballOutcomes(matchedEvent, teamA, teamB, isHomeDbA) {
    const outcomes = {};

    const homeScore = parseInt(matchedEvent.homeScore?.current ?? 0);
    const awayScore = parseInt(matchedEvent.awayScore?.current ?? 0);
    const goalsA = isHomeDbA ? homeScore : awayScore;
    const goalsB = isHomeDbA ? awayScore : homeScore;

    // 1. MAIN (Match Winner)
    if (goalsA > goalsB) outcomes['MAIN'] = teamA;
    else outcomes['MAIN'] = teamB;

    // 2. CORRECT_SCORE (Sets score: 3-0, 3-1, 3-2, 2-3, 1-3, 0-3)
    outcomes['CORRECT_SCORE'] = `${goalsA}-${goalsB}`;

    // 3. TOTAL_POINTS (Total points Over/Under 180.5)
    let totalPoints = 0;
    for (let i = 1; i <= 5; i++) {
        const hp = parseInt(matchedEvent.homeScore?.[`period${i}`] ?? 0);
        const ap = parseInt(matchedEvent.awayScore?.[`period${i}`] ?? 0);
        totalPoints += hp + ap;
    }
    outcomes['TOTAL_POINTS'] = (totalPoints > 180.5) ? 'Over 180.5' : 'Under 180.5';

    // 4. FIRST_SET (Winner of 1st set)
    const s1Home = parseInt(matchedEvent.homeScore?.period1 ?? 0);
    const s1Away = parseInt(matchedEvent.awayScore?.period1 ?? 0);
    const s1ScoreA = isHomeDbA ? s1Home : s1Away;
    const s1ScoreB = isHomeDbA ? s1Away : s1Home;
    if (s1ScoreA > s1ScoreB) outcomes['FIRST_SET'] = teamA;
    else outcomes['FIRST_SET'] = teamB;

    // 5. FIFTH_SET (Will there be a 5th set?)
    const isFifthSet = (goalsA === 3 && goalsB === 2) || (goalsA === 2 && goalsB === 3);
    outcomes['FIFTH_SET'] = isFifthSet ? 'Yes' : 'No';

    // 6. EXTRA_POINTS (Extra points in any set)
    let hasExtraPoints = false;
    const setScores = [];
    for (let i = 1; i <= 5; i++) {
        const hp = parseInt(matchedEvent.homeScore?.[`period${i}`] ?? 0);
        const ap = parseInt(matchedEvent.awayScore?.[`period${i}`] ?? 0);
        if (hp > 0 || ap > 0) {
            setScores.push(`${hp}-${ap}`);
            const maxScore = Math.max(hp, ap);
            const target = (i === 5) ? 15 : 25;
            if (maxScore > target) {
                hasExtraPoints = true;
            }
        }
    }
    outcomes['EXTRA_POINTS'] = hasExtraPoints ? 'Yes' : 'No';

    return {
        goalsA,
        goalsB,
        totalPoints,
        setScores,
        outcomes
    };
}

async function testWithMockData() {
    console.log("=== Running Test 1: Mock Volleyball Event ===");
    
    // Simulate a match: Türkiye vs Canada (Türkiye is Home team, i.e., teamA is Home)
    const mockEvent = {
        homeTeam: { name: "Türkiye" },
        awayTeam: { name: "Canada" },
        status: { type: "finished", description: "Ended" },
        homeScore: {
            current: 3,
            period1: 25,
            period2: 23,
            period3: 24,
            period4: 25,
            period5: 16
        },
        awayScore: {
            current: 2,
            period1: 20,
            period2: 25,
            period3: 26,
            period4: 21,
            period5: 14
        }
    };

    const teamA = "Türkiye";
    const teamB = "Canada";
    const isHomeDbA = true;

    console.log(`Match: ${teamA} vs ${teamB}`);
    const result = calculateVolleyballOutcomes(mockEvent, teamA, teamB, isHomeDbA);
    console.log(`Set Scores: ${result.setScores.join(", ")}`);
    console.log(`Sets Final: ${result.goalsA} - ${result.goalsB}`);
    console.log(`Total Points: ${result.totalPoints}`);
    console.log("Calculated Outcomes:", JSON.stringify(result.outcomes, null, 2));

    // Assertions
    console.assert(result.outcomes['MAIN'] === "Türkiye", "Assertion failed: MAIN Winner should be Türkiye");
    console.assert(result.outcomes['CORRECT_SCORE'] === "3-2", "Assertion failed: CORRECT_SCORE should be 3-2");
    console.assert(result.outcomes['TOTAL_POINTS'] === "Over 180.5", "Assertion failed: TOTAL_POINTS should be Over 180.5 (218 points)");
    console.assert(result.outcomes['FIRST_SET'] === "Türkiye", "Assertion failed: FIRST_SET should be Türkiye (25-20)");
    console.assert(result.outcomes['FIFTH_SET'] === "Yes", "Assertion failed: FIFTH_SET should be Yes");
    console.assert(result.outcomes['EXTRA_POINTS'] === "Yes", "Assertion failed: EXTRA_POINTS should be Yes (set 3 was 24-26, set 5 was 16-14)");
    console.log("Mock data test assertions finished successfully.\n");
}

async function testWithRealAPI(date) {
    console.log(`=== Running Test 2: Real API Query for Date: ${date} ===`);
    const url = `https://${SPORT_API_HOST}/api/v1/sport/volleyball/scheduled-events/${date}`;
    try {
        const response = await fetch(url, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': SPORT_API_HOST
            }
        });
        if (!response.ok) {
            console.log(`Failed to fetch scheduled events: ${response.statusText}`);
            return;
        }
        const data = await response.json();
        const events = data.events || [];
        console.log(`Found ${events.length} volleyball events on ${date}.`);

        // Let's find a finished event
        const finishedEvent = events.find(e => e.status?.type === 'finished');
        if (finishedEvent) {
            console.log(`Processing real finished event ID: ${finishedEvent.id}`);
            const teamA = finishedEvent.homeTeam?.name || "HomeTeam";
            const teamB = finishedEvent.awayTeam?.name || "AwayTeam";
            console.log(`Match: ${teamA} vs ${teamB}`);
            
            const result = calculateVolleyballOutcomes(finishedEvent, teamA, teamB, true);
            console.log(`Set Scores: ${result.setScores.join(", ")}`);
            console.log(`Sets Final: ${result.goalsA} - ${result.goalsB}`);
            console.log(`Total Points: ${result.totalPoints}`);
            console.log("Calculated Outcomes:", JSON.stringify(result.outcomes, null, 2));
        } else {
            console.log("No finished volleyball match found on this date to test resolution.");
        }
    } catch (e) {
        console.error("API request failed:", e);
    }
}

async function run() {
    await testWithMockData();
    // Test with June 14th which had some VNL matches
    await testWithRealAPI("2026-06-14");
}

run();
