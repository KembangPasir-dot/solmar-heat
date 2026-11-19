// SOLMAR HEAT — Story & Dialogue Data

export const STORY_DATA = {
  protagonist: {
    name: 'Jax Moreno',
    nickname: 'Reef',
    role: 'Getaway Driver'
  },
  fixer: {
    name: 'Marisol Vega',
    location: 'Old Town Garage',
    role: 'Local Fixer'
  },
  rival: {
    name: 'The Coral Kings',
    leader: 'Rico Delgado',
    role: 'Rival Crime Syndicate'
  },
  city: {
    name: 'Solmar Bay',
    tagline: 'Sun-soaked coastal heat and fast asphalt'
  },
  introBriefing: {
    title: 'WELCOME TO SOLMAR BAY',
    text: 'Jax "Reef" Moreno rolled into Solmar Bay looking for a fresh start behind the wheel. Marisol Vega runs Old Town from her garage, and the Coral Kings are muscling in on every corner. Time to prove your worth.'
  },
  missions: [
    {
      id: 1,
      title: 'Wheels for Marisol',
      briefingTitle: 'MISSION 1: WHEELS FOR MARISOL',
      briefingText: 'Marisol needs a reliable set of wheels delivered to her Old Town garage to kick things off. Steal any car on the street and drive it to the marked garage waypoint.',
      objectiveText: 'Steal a car and drive it to Marisol\'s garage in Old Town.',
      payout: 300,
      targetLocation: { x: 250, y: -300 }
    },
    {
      id: 2,
      title: 'Marina Delivery',
      briefingTitle: 'MISSION 2: MARINA DELIVERY',
      briefingText: 'Marisol: "Reef, I got a package of contraband that needs to reach the docks before the harbor patrol wakes up. Step on it."',
      objectiveText: 'Deliver the package to the Marina drop point before time runs out.',
      payout: 500,
      targetLocation: { x: -450, y: 550 },
      timeLimit: 90
    },
    {
      id: 3,
      title: 'Cooling Down',
      briefingTitle: 'MISSION 3: COOLING DOWN',
      briefingText: 'Marisol: "The Coral Kings ratted you out to the Solmar PD. Lose the heat and get back to the safehouse without getting busted."',
      objectiveText: 'Lose your 2-star wanted level, then reach the Old Town safehouse.',
      payout: 750,
      targetLocation: { x: 100, y: -200 }
    },
    {
      id: 4,
      title: 'Kings in the Alley',
      briefingTitle: 'MISSION 4: KINGS IN THE ALLEY',
      briefingText: 'Marisol: "Coral Kings thugs are shaking down our merchants in the North District. Grab your piece and clear them out on foot."',
      objectiveText: 'Eliminate the rival Coral Kings crew members at the marked alley.',
      payout: 1000,
      targetLocation: { x: 350, y: 400 }
    },
    {
      id: 5,
      title: 'Downtown Ledger Heist',
      briefingTitle: 'MISSION 5: DOWNTOWN LEDGER',
      briefingText: 'Marisol: "Time to hit the Kings where it hurts. Grab their financial ledger from the Downtown tower and escape before they flood the block with sirens."',
      objectiveText: 'Grab the ledger at the Downtown tower and escape with 3-star wanted level to the safehouse.',
      payout: 1500,
      targetLocation: { x: -200, y: -500 }
    },
    {
      id: 6,
      title: 'Dawn at Solmar Bay',
      briefingTitle: 'MISSION 6: DAWN AT SOLMAR BAY',
      briefingText: 'Marisol: "This is it, Reef. Rico Delgado and the Kings are making a run for the coastal highway. Chase them down, finish the job, and claim Solmar Bay."',
      objectiveText: 'Chase down the Coral Kings boss, survive the shootout, and reach the finish line at the lighthouse.',
      payout: 2500,
      targetLocation: { x: 600, y: 100 }
    },
    {
      id: 7,
      title: 'Sunset Run',
      briefingTitle: 'MISSION 7: SUNSET RUN',
      briefingText: 'Marisol: "One last job, Reef. The Kings seized cash is sitting at the Marina impound — grab it and bring it home before the harbor patrol wakes up. Step on it."',
      objectiveText: 'Grab the seized cash at the Marina and deliver to Marisol garage before time runs out.',
      payout: 3000,
      targetLocation: { x: -450, y: 550 },
      timeLimit: 90
    }
  ]
};
