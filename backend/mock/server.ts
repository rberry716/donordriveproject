import "dotenv/config";
import express from "express";
import {
  MOCK_CAMPAIGN,
  MOCK_TEAMS,
  MOCK_PARTICIPANTS,
  MOCK_DONATIONS,
  generateDonation,
} from "./data";

const app = express();
app.use(express.json());

let campaign = JSON.parse(JSON.stringify(MOCK_CAMPAIGN));
let teams = JSON.parse(JSON.stringify(MOCK_TEAMS));
let participants = JSON.parse(JSON.stringify(MOCK_PARTICIPANTS));
let donations = JSON.parse(JSON.stringify(MOCK_DONATIONS));

function simulateDonation() {
  const newDonation = generateDonation();
  donations.unshift(newDonation);
  campaign.totalRaisedAmount += newDonation.amount;
  campaign.totalDonationCount++;
  const team = teams.find((t: any) => t.teamID === newDonation.teamID);
  const participant = participants.find((p: any) => p.participantID === newDonation.participantID);
  if (team) {
    team.sumDonations += newDonation.amount;
    team.numDonations++;
  }
  if (participant) {
    participant.sumDonations += newDonation.amount;
    participant.numDonations++;
  }
  console.log(`New donation: $${newDonation.amount} from ${newDonation.displayName}`);
  return newDonation;
}

app.get("/api/events/:id", (req, res) => {
  res.json(campaign);
});

app.get("/api/events/:id/donations", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || donations.length;
  res.json(donations.slice(0, limit));
});

app.get("/api/events/:id/teams", (req, res) => {
  res.json([...teams].sort((a: any, b: any) => b.sumDonations - a.sumDonations));
});

app.get("/api/events/:id/participants", (req, res) => {
  res.json([...participants].sort((a: any, b: any) => b.sumDonations - a.sumDonations));
});

app.post("/simulate/donation", (req, res) => {
  const donation = simulateDonation();
  res.json(donation);
});

app.post("/simulate/reset", (req, res) => {
  campaign = JSON.parse(JSON.stringify(MOCK_CAMPAIGN));
  teams = JSON.parse(JSON.stringify(MOCK_TEAMS));
  participants = JSON.parse(JSON.stringify(MOCK_PARTICIPANTS));
  donations = JSON.parse(JSON.stringify(MOCK_DONATIONS));
  res.json({ message: "Reset complete" });
});

app.get("/status", (req, res) => {
  res.json({
    donationCount: campaign.totalDonationCount,
    totalRaisedAmount: campaign.totalRaisedAmount,
  });
});

if (process.env.AUTO_SIMULATE !== "false") {
  setInterval(simulateDonation, 20000);
}

const PORT = parseInt(process.env.MOCK_PORT || "4001", 10);
app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});