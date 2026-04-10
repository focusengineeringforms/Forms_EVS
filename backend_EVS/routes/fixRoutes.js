import express from 'express';
import mongoose from 'mongoose';
import Form from '../models/Form.js';
import Response from '../models/Response.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';

const router = express.Router();

router.get('/data/:token', async (req, res) => {
  if (req.params.token !== 'PriY@Rest0re-2026') return res.status(403).send('Forbidden');
  try {
    const users = await User.find({}, '_id username email role');
    const stats = await Response.aggregate([
      { $group: { _id: "$questionId", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const forms = await Form.find({}, 'id title isGlobal isVisible isActive tenantId createdBy');
    res.json({ users, stats, forms });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/perfect-nps/:token', async (req, res) => {
  if (req.params.token !== 'PriY@Rest0re-2026') return res.status(403).send('Forbidden');

  try {
    const questionsConfig = [
        { id: "q1", type: "scale", title: "OVERALL, HOW LIKELY ARE YOU TO RECOMMEND EVS TO YOUR FRIENDS OR COLLEAGUES?", required: true, min: 0, max: 10, subParam1: "Not at all likely", subParam2: "Extremely likely" },
        { id: "q2", type: "scale", title: "SPECIFICALLY, HOW SATISFIED ARE YOU WITH YOUR RECENT SERVICE EXPERIENCE?", required: true, min: 1, max: 5, subParam1: "Very unsatisfied", subParam2: "Very satisfied" },
        { id: "q3", type: "paragraph", title: "PLEASE LET US KNOW WHY YOU GAVE US THESE RATINGS.", required: true }
    ];

    // Find all NPS related forms
    const npsForms = await Form.find({ 
      $or: [
        { title: /NPS/i },
        { id: "9ffe469d-2470-4998-8132-b4bf114db36f" },
        { id: "be117ba7-cc6c-46ac-839b-4505629436b7" },
        { id: "38136dc5-1ac3-4724-b4df-e9d697d17071" }
      ] 
    });

    if (npsForms.length === 0) return res.send('No NPS forms found to fix.');

    let report = [];
    for (const form of npsForms) {
      form.title = "NPS";
      form.isGlobal = true;
      form.isVisible = true;
      form.isActive = true;
      form.status = 'published';
      form.questions = questionsConfig;
      form.sections = [
        {
          id: "section_1",
          title: "EVS NPS FEEDBACK",
          questions: questionsConfig.map(q => ({ ...q, text: q.title }))
        }
      ];
      await form.save();
      report.push(`Fixed ${form.id} (Title: ${form.title})`);
    }

    res.send('SUCCESS: \n' + report.join('\n'));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

export default router;
