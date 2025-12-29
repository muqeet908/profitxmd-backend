const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL);

const User = mongoose.model("User", {
  email: String,
  balance: { type: Number, default: 0 }
});

const Deposit = mongoose.model("Deposit", {
  email: String,
  plan: Number,
  amount: Number,
  method: String,
  proof: String,
  status: { type: String, default: "Pending" }
});

const Withdraw = mongoose.model("Withdraw", {
  email: String,
  amount: Number,
  method: String,
  account: String,
  status: { type: String, default: "Pending" }
});

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) =>
    cb(null, Date.now() + file.originalname)
});
const upload = multer({ storage });

/* -------- PLANS -------- */
app.get("/plans", (req, res) => {
  res.json([
    {price:80,daily:25,total:2000},
    {price:200,daily:60,total:4800},
    {price:500,daily:150,total:12000},
    {price:1000,daily:300,total:24000},
    {price:2000,daily:600,total:48000},
    {price:3000,daily:900,total:72000},
    {price:5000,daily:1500,total:120000},
    {price:8000,daily:2400,total:192000},
    {price:10000,daily:3000,total:240000},
    {price:20000,daily:6000,total:480000},
    {price:30000,daily:9000,total:720000},
    {price:50000,daily:15000,total:1200000}
  ]);
});

/* -------- DEPOSIT -------- */
app.post("/deposit", upload.single("proof"), async (req, res) => {
  await Deposit.create({
    email: req.body.email,
    plan: req.body.plan,
    amount: req.body.amount,
    method: req.body.method,
    proof: req.file.filename
  });
  res.json({msg:"Deposit request sent"});
});

/* -------- ADMIN APPROVE DEPOSIT -------- */
app.post("/admin/deposit/approve", async (req, res) => {
  const d = await Deposit.findById(req.body.id);
  if(d.status === "Pending"){
    d.status = "Approved";
    await d.save();
    await User.updateOne(
      { email: d.email },
      { $inc: { balance: d.amount } },
      { upsert: true }
    );
  }
  res.json({msg:"Approved"});
});

/* -------- WITHDRAW -------- */
app.post("/withdraw", async (req, res) => {
  await Withdraw.create(req.body);
  res.json({msg:"Withdraw request sent"});
});

app.listen(3000);
  
