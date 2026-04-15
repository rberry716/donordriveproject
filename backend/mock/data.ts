export const MOCK_CAMPAIGN = {
  campaignID: "demo-2025",
  name: "Dance Marathon 2025",
  goalAmount: 50000,
  totalRaisedAmount: 12750.50,
  totalDonationCount: 30,
  teamCount: 8,
  participantCount: 8,
  eventID: 1001,
  createdOn: "2025-03-01T08:00:00.000Z",
};

export const MOCK_TEAMS = [
  { teamID: 1, name: "The Miracle Workers", sumDonations: 3200.00, sumPledges: 4500.00, numDonations: 8, numParticipants: 6 },
  { teamID: 2, name: "Dancing For A Cure", sumDonations: 2450.00, sumPledges: 3200.00, numDonations: 6, numParticipants: 5 },
  { teamID: 3, name: "Hope In Motion", sumDonations: 1875.50, sumPledges: 2800.00, numDonations: 5, numParticipants: 4 },
  { teamID: 4, name: "Footloose Heroes", sumDonations: 1500.00, sumPledges: 2000.00, numDonations: 4, numParticipants: 5 },
  { teamID: 5, name: "The Night Owls", sumDonations: 1200.00, sumPledges: 1800.00, numDonations: 3, numParticipants: 3 },
  { teamID: 6, name: "Step By Step", sumDonations: 1025.00, sumPledges: 1500.00, numDonations: 2, numParticipants: 4 },
  { teamID: 7, name: "Rhythm & Reason", sumDonations: 850.00, sumPledges: 1200.00, numDonations: 1, numParticipants: 3 },
  { teamID: 8, name: "Marathon Mavericks", sumDonations: 650.00, sumPledges: 1000.00, numDonations: 1, numParticipants: 2 },
];

export const MOCK_PARTICIPANTS = [
  { participantID: 101, displayName: "Sarah Chen", teamID: 1, sumPledges: 1800.00, sumDonations: 1200.00, numDonations: 4 },
  { participantID: 102, displayName: "Marcus Johnson", teamID: 1, sumPledges: 1500.00, sumDonations: 1000.00, numDonations: 3 },
  { participantID: 103, displayName: "Emily Rodriguez", teamID: 2, sumPledges: 1400.00, sumDonations: 950.00, numDonations: 3 },
  { participantID: 104, displayName: "Jake Thompson", teamID: 3, sumPledges: 1200.00, sumDonations: 875.50, numDonations: 2 },
  { participantID: 105, displayName: "Aisha Patel", teamID: 2, sumPledges: 1100.00, sumDonations: 800.00, numDonations: 2 },
  { participantID: 106, displayName: "Ryan O'Brien", teamID: 4, sumPledges: 900.00, sumDonations: 750.00, numDonations: 2 },
  { participantID: 107, displayName: "Lily Nakamura", teamID: 5, sumPledges: 800.00, sumDonations: 600.00, numDonations: 1 },
  { participantID: 108, displayName: "David Kim", teamID: 6, sumPledges: 700.00, sumDonations: 525.00, numDonations: 1 },
];

const DONOR_NAMES = [
  "Mom & Dad", "Grandma Rose", "Uncle Mike", "The Smiths", "Anonymous",
  "Coach Williams", "Dr. Martinez", "The Garcia Family", "Aunt Lisa",
  "Best Friend Alex", "Neighbor Joe", "Teacher Mrs. Park", "Cousin Emma",
  "Work Friend Sam", "Church Group", "Family Friend", "Go Sarah!",
  "Proud of You!", "Dance Your Heart Out", "We Believe In You",
];

function randomAmount(): number {
  const ranges = [
    { min: 5, max: 25, weight: 40 },
    { min: 25, max: 100, weight: 35 },
    { min: 100, max: 500, weight: 20 },
    { min: 500, max: 2000, weight: 5 },
  ];
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const r of ranges) {
    cumulative += r.weight;
    if (roll < cumulative) {
      return Math.round((Math.random() * (r.max - r.min) + r.min) * 100) / 100;
    }
  }
  return 25;
}

function randomTimestamp(hoursAgo: number): string {
  const now = Date.now();
  const offset = Math.random() * hoursAgo * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

function buildDonation(id: number, hoursAgo: number) {
  const participant = MOCK_PARTICIPANTS[Math.floor(Math.random() * MOCK_PARTICIPANTS.length)];
  const isAnonymous = Math.random() < 0.15;
  return {
    donationID: id,
    displayName: isAnonymous ? "Anonymous" : DONOR_NAMES[Math.floor(Math.random() * DONOR_NAMES.length)],
    amount: randomAmount(),
    createdOn: randomTimestamp(hoursAgo),
    participantID: participant.participantID,
    teamID: participant.teamID,
    eventID: MOCK_CAMPAIGN.eventID,
    type: "PARTICIPANT" as const,
    nameVisibility: isAnonymous ? "NONE" as const : "ALL" as const,
    amountVisibility: "ALL" as const,
  };
}

export const MOCK_DONATIONS = Array.from({ length: 30 }, (_, i) =>
  buildDonation(i + 1, 6)
).sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());

let donationCounter = 31;

export function generateDonation(overrides?: Partial<ReturnType<typeof buildDonation>>) {
  const donation = {
    ...buildDonation(donationCounter++, 0),
    ...overrides,
  };
  return donation;
}