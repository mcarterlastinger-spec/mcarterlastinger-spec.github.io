/* =====================================================================
   Sales Intelligence Lab — scenario & scoring data
   ---------------------------------------------------------------------
   Everything a designer would want to edit lives in this file:
   the scenario, stakeholders, questions, capabilities, objections,
   feedback copy, and every scoring rule. app.js only reads from it.

   All companies, people, and products are fictional.
   ===================================================================== */

window.LAB_DATA = {
  meta: {
    title: "Sales Intelligence Lab",
    subtitle: "The Enterprise Discovery Challenge",
    vendor: "Aperion",
    product: "Aperion Data Cloud",
    disclaimer:
      "Fictional scenario for practice. Scores reflect only the decisions you make in this simulation; they are not a validated measure of real-world sales performance."
  },

  /* ------------------------------------------------------------------
     Scenario brief (intro screen)
     ------------------------------------------------------------------ */
  scenario: {
    customer: "Halvorsen Therapeutics",
    profile:
      "A mid-size specialty pharmaceutical company with three divisions (Biologics, Diagnostics, and Hospital Solutions) selling in 14 markets, including several in the European Union.",
    situation:
      "Customer data lives in four systems that were never designed to talk to each other. The same hospital can appear under different names, IDs, and addresses in each one. Halvorsen's IT team asked for a first conversation after a data-quality issue delayed a rebate payment to a key account.",
    yourRole:
      "You are an Account Executive at Aperion. Aperion Data Cloud is a cloud master-data platform that creates one governed record for each customer and keeps connected systems in sync.",
    goal:
      "Run discovery, read the buying group, build a customer-specific value proposition, and handle the objections that come up in the follow-up meeting.",
    systems: [
      // recordId: the fictional ID each system uses for the same hospital (shown on the data-landscape diagram)
      { id: "crm", label: "CRM", note: "Field calls and marketing", recordId: "CRM-1042" },
      { id: "erp", label: "ERP", note: "Orders and direct sales", recordId: "ERP-7821" },
      { id: "reb", label: "Rebates", note: "Contracts and chargebacks", recordId: "REB-3098" },
      { id: "dwh", label: "Warehouse", note: "Indirect sales reporting", recordId: "WH-5516" }
    ],
    // Explanation shown above the data-landscape diagram on the brief
    landscapeNote: {
      headline: "One hospital. Four systems. Four different customer IDs.",
      body: "Each system maintains its own identifier for the same hospital, making it difficult to establish a consistent, trusted customer record."
    },
    stats: [
      { value: "4", label: "systems hold customer records" },
      { value: "23", label: "point-to-point interfaces between them" },
      { value: "14", label: "markets in scope" }
    ]
  },

  /* ------------------------------------------------------------------
     STAGE 1 — Customer Discovery
     The learner can ask `questionBudget` questions out of the list.
     points: contribution to the Discovery competency.
     trust:  change to the customer trust meter (narrative consequence,
             shown in the Deal room; derived from the same choices).
     insight: id of the insight revealed (or null).
     ------------------------------------------------------------------ */
  discovery: {
    questionBudget: 5,
    trustStart: 50,
    maxPoints: 15, // five strongest questions × 3
    // Order the questions appear on screen (mixes strong and weak options).
    displayOrder: ["q7", "q1", "q8", "q2", "q4", "q9", "q3", "q10", "q5", "q6"],
    intro:
      "Your first call is with Dana Okafor (CIO) and Priya Raman (Director of Data Governance). You have time for five questions. Choose them carefully: the answers you gather here become the evidence you can use later.",
    insights: {
      dupes: {
        title: "One customer, many records",
        detail:
          "The same hospital system appears up to four times across CRM, ERP, and Rebates under different IDs. Reps sometimes call on accounts that were merged last year."
      },
      launch: {
        title: "Launch deadline in 9 months",
        detail:
          "A new biologic launches in 9 months across all 14 markets. Commercial leadership needs one trusted list of target accounts before launch planning locks."
      },
      cost: {
        title: "Cost of doing nothing",
        detail:
          "About six full-time people reconcile customer records by hand each month, and duplicate accounts caused two rebate disputes last quarter."
      },
      buyers: {
        title: "How the decision gets made",
        detail:
          "Dana signs off on platform spend. Priya's team runs the technical evaluation. Marcus Feld (VP Commercial Operations) can delay anything that touches launch readiness."
      },
      history: {
        title: "A previous attempt stalled",
        detail:
          "A 2022 in-house customer hub stalled after 14 months on integration work, and field reps pushed back on a new screen they were asked to use."
      },
      residency: {
        title: "Data must stay in region",
        detail:
          "Customer data from EU markets must be hosted in the EU, and access to it must be auditable."
      }
    },
    questions: [
      {
        id: "q1",
        text: "Walk me through what happens today when a new customer record is created. Who touches it, and in which systems?",
        type: "Open process question",
        quality: "strong",
        points: 3,
        trust: 8,
        insight: "dupes",
        response:
          "Priya: \"Honestly, it depends who gets there first. A rep creates the account in CRM, finance creates it again in ERP, and contracts sets it up a third time in Rebates. Nobody owns the master. We found one health system listed four different ways.\"",
        feedback:
          "Strong. An open, process-focused question gets the customer describing the problem in their own words, and you learn where the pain actually sits."
      },
      {
        id: "q2",
        text: "What's making this a priority now rather than next year?",
        type: "Urgency question",
        quality: "strong",
        points: 3,
        trust: 6,
        insight: "launch",
        response:
          "Dana: \"We launch a new biologic in nine months, in all 14 markets. Commercial needs one clean target list before launch planning locks. If we miss that window, we're stuck with what we have for another year.\"",
        feedback:
          "Strong. Asking \"why now\" separates the perceived priority (cleaner data) from the real one (a launch deadline). Real priorities drive timelines and budgets."
      },
      {
        id: "q3",
        text: "If nothing changed over the next 12 months, what would that cost the business?",
        type: "Impact question",
        quality: "strong",
        points: 3,
        trust: 6,
        insight: "cost",
        response:
          "Priya: \"Roughly six people spend most of their month reconciling records by hand. And last quarter, duplicate accounts caused two rebate disputes with major customers. One of those is why we're talking to you.\"",
        feedback:
          "Strong. Quantifying the cost of inaction gives the customer their own business case. You'll need these numbers when ROI comes up."
      },
      {
        id: "q4",
        text: "Who else will be involved in evaluating and approving a decision like this?",
        type: "Buying-group question",
        quality: "strong",
        points: 3,
        trust: 4,
        insight: "buyers",
        response:
          "Dana: \"I approve platform spend. Priya's team will run the evaluation. And you'll need Marcus Feld in Commercial Ops on side. He's blocked two projects this year because they threatened launch readiness.\"",
        feedback:
          "Strong. Mapping the buying group early tells you who holds budget, who influences, and who can block. In enterprise deals, missing one stakeholder can stall everything."
      },
      {
        id: "q5",
        text: "What have you tried before to fix this, and what got in the way?",
        type: "History question",
        quality: "strong",
        points: 3,
        trust: 7,
        insight: "history",
        response:
          "Dana: \"We built our own customer hub in 2022. Fourteen months in, we were still writing integrations, and the reps refused to use the new screen. We shut it down.\"",
        feedback:
          "Strong. Past failures reveal the objections you'll face later. Now you know implementation risk and field adoption will be on their minds."
      },
      {
        id: "q6",
        text: "Are there constraints on where customer data can be hosted or who can access it?",
        type: "Requirements question",
        quality: "strong",
        points: 3,
        trust: 4,
        insight: "residency",
        response:
          "Priya: \"Yes. EU customer data has to stay hosted in the EU, and our auditors want a full history of who changed what. That ruled out one vendor already.\"",
        feedback:
          "Strong. Asking about constraints early surfaces must-have requirements that can disqualify a solution, before you've invested in a proposal."
      },
      {
        id: "q7",
        text: "Are you happy with your current systems?",
        type: "Closed question",
        quality: "weak",
        points: 1,
        trust: 0,
        insight: null,
        response:
          "Dana: \"Mostly, yes. They do what they were bought to do.\" There's a pause while they wait for your next question.",
        feedback:
          "Weak. A yes/no question invites a yes/no answer. Reframe it as open-ended, such as \"Where do your current systems create the most extra work?\""
      },
      {
        id: "q8",
        text: "Our platform has AI-powered match-and-merge. Would that help with your duplicates?",
        type: "Leading pitch",
        quality: "poor",
        points: 0,
        trust: -10,
        insight: null,
        response:
          "Priya: \"Maybe. Every vendor says they have AI matching now.\" She glances at her laptop.",
        feedback:
          "Ineffective. This pitches a feature before you understand the problem. It also signals you're more interested in selling than listening, and trust drops."
      },
      {
        id: "q9",
        text: "What budget have you set aside for this project?",
        type: "Premature pricing",
        quality: "poor",
        points: 0,
        trust: -8,
        insight: null,
        response:
          "Dana: \"We're not there yet. I'd want to understand whether this is worth funding first.\"",
        feedback:
          "Ineffective this early. Budget questions matter, but asked before value is established they make the conversation about price. Ask about impact first."
      },
      {
        id: "q10",
        text: "Can I share my screen and show you a quick demo of our dashboard?",
        type: "Premature demo",
        quality: "poor",
        points: 0,
        trust: -10,
        insight: null,
        response:
          "Dana: \"Let's hold the demo. We've seen a lot of dashboards. I'd rather know if you understand our situation.\"",
        feedback:
          "Ineffective. A demo before discovery shows generic features rather than their problem. Earn the demo by showing you understand their situation first."
      }
    ]
  },

  /* ------------------------------------------------------------------
     STAGE 2 — Stakeholder Intelligence
     Two tasks per stakeholder: identify role, choose tailored message.
     ------------------------------------------------------------------ */
  stakeholders: {
    rolePoints: 2,  // per correct role
    maxPoints: 15,  // 3 roles × 2 + 3 messages × 3
    roles: [
      { id: "decision", label: "Decision-maker", hint: "Controls budget and final approval" },
      { id: "influencer", label: "Influencer", hint: "Shapes the evaluation and recommendation" },
      { id: "blocker", label: "Blocker", hint: "Can delay or veto if concerns aren't met" }
    ],
    people: [
      {
        id: "dana",
        name: "Dana Okafor",
        title: "Chief Information Officer",
        initials: "DO",
        correctRole: "decision",
        influence: 5,
        stance: "Open but cautious",
        priorities: [
          "Retire fragile point-to-point interfaces",
          "Predictable total cost of ownership",
          "One accountable vendor"
        ],
        concerns: ["Another platform for IT to maintain", "Security and audit exposure"],
        quote: "\"I need fewer moving parts, not more.\"",
        roleFeedback: {
          decision: "Correct. Dana approves platform spend, so she is the economic decision-maker.",
          influencer: "Not quite. Dana does shape the evaluation, but she also holds the budget and gives final approval. That makes her the decision-maker.",
          blocker: "Not quite. Dana is cautious, not opposed. She holds the budget and gives final approval, so she is the decision-maker."
        },
        messages: [
          {
            text: "Aperion replaces point-to-point interfaces with one governed hub. Because it runs as a managed service, your team stops handling upgrades, and one vendor is accountable for software, data model, and support.",
            points: 3,
            fit: "tailored",
            feedback: "Tailored. It speaks directly to Dana's priorities: fewer interfaces, lower maintenance, and single-vendor accountability."
          },
          {
            text: "Your data stewards get intuitive match-review queues and data-quality scorecards.",
            points: 1,
            fit: "misdirected",
            feedback: "Misdirected. This is a real benefit, but it belongs to Priya's team. A CIO evaluates architecture, cost, and risk."
          },
          {
            text: "Aperion offers 400+ features, including graph technology, machine-learning matching, and an API-first architecture.",
            points: 0,
            fit: "feature dump",
            feedback: "Feature dump. A list of features with no link to Dana's goals asks her to work out the value herself."
          }
        ]
      },
      {
        id: "priya",
        name: "Priya Raman",
        title: "Director of Data Governance",
        initials: "PR",
        correctRole: "influencer",
        influence: 4,
        stance: "Supportive of change",
        priorities: [
          "Higher data quality across markets",
          "Configurable matching and survivorship rules",
          "Full audit history"
        ],
        concerns: ["A tool that can't reflect her team's rules", "Being sidelined by automation"],
        quote: "\"My team should be governing data, not retyping it.\"",
        roleFeedback: {
          decision: "Not quite. Priya runs the evaluation, but Dana approves the spend. Priya is an influencer, and potentially your strongest champion.",
          influencer: "Correct. Priya's evaluation will shape Dana's decision. As an influencer with a strong interest in change, she could become your champion.",
          blocker: "Not quite. Priya wants this problem solved. She's an influencer who could become your champion, not a blocker."
        },
        messages: [
          {
            text: "This will significantly reduce IT's interface maintenance costs.",
            points: 1,
            fit: "misdirected",
            feedback: "Misdirected. Interface cost is Dana's concern. Priya cares about data quality, rules, and her team's workload."
          },
          {
            text: "Once it's live, the platform handles data quality automatically. Your team won't need to be involved.",
            points: 0,
            fit: "threatening",
            feedback: "Counterproductive. It overclaims, and it suggests her team becomes unnecessary. That can turn a champion into a skeptic."
          },
          {
            text: "Configurable matching and quality rules, stewardship queues, and a full audit trail let your team govern data across all 14 markets instead of reconciling spreadsheets.",
            points: 3,
            fit: "tailored",
            feedback: "Tailored. It positions her team as more strategic, gives them control over the rules, and addresses the audit requirement."
          }
        ]
      },
      {
        id: "marcus",
        name: "Marcus Feld",
        title: "VP, Commercial Operations",
        initials: "MF",
        correctRole: "blocker",
        influence: 4,
        stance: "Skeptical",
        priorities: [
          "Launch readiness in 9 months",
          "Field-rep productivity",
          "No disruption to sales workflows"
        ],
        concerns: ["Reps pulled into training before launch", "Repeating the 2022 failure"],
        quote: "\"Nothing gets between my reps and this launch.\"",
        roleFeedback: {
          decision: "Not quite. Marcus doesn't hold the platform budget, but he can delay the project if it threatens launch. That makes him a potential blocker.",
          influencer: "Close, but his position is stronger than an influencer's. Marcus can delay anything that touches launch readiness, so treat him as a potential blocker and address his concerns early.",
          blocker: "Correct. Marcus can delay the project if it threatens launch readiness. Blockers aren't enemies. Address their concerns early and they can become supporters."
        },
        messages: [
          {
            text: "Better data will improve your segmentation and targeting.",
            points: 1,
            fit: "generic",
            feedback: "Generic. True, but it doesn't touch his real concern: protecting the launch and his reps' time."
          },
          {
            text: "Reps keep working in the CRM they already use; Aperion simply feeds it cleaner account data. We'd phase the rollout around your launch calendar, and your team would set the cutover dates.",
            points: 3,
            fit: "tailored",
            feedback: "Tailored. It removes his biggest fear (disruption), respects his launch calendar, and gives him control over timing."
          },
          {
            text: "This is a strategic IT initiative that your CIO is sponsoring.",
            points: 0,
            fit: "escalating",
            feedback: "Counterproductive. Going over a blocker's head usually hardens resistance. Address his concerns directly instead."
          }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------
     STAGE 3 — Value Proposition Builder
     Part A: match a capability to each business requirement.
     Part B: classify statements as feature / benefit / outcome.
     Part C: compose a value proposition from four building blocks.
     ------------------------------------------------------------------ */
  value: {
    matchPoints: 2,
    classifyPoints: 1,
    maxPoints: 25, // 5×2 + 3×1 + 4×3
    // Shown above the requirement list in Stage 3, so learners know where the requirements came from.
    requirementsIntro: "After the discovery call, Halvorsen's team sent a short list of five business requirements for any solution.",
    requirements: [
      { id: "r1", text: "Create one trusted record for each customer across CRM, ERP, and Rebates", answer: "c1" },
      { id: "r2", text: "Have launch-ready customer data in all 14 markets within 9 months", answer: "c3" },
      { id: "r3", text: "Keep EU customer data hosted in the EU, with auditable access", answer: "c4" },
      { id: "r4", text: "Reduce the manual effort spent reconciling records each month", answer: "c5" },
      { id: "r5", text: "Give field reps accurate account data without changing their CRM workflow", answer: "c2" }
    ],
    capabilities: [
      { id: "c1", name: "Match-and-merge engine", detail: "Survivorship rules combine duplicates into a single golden record" },
      { id: "c2", name: "Pre-built CRM and ERP connectors", detail: "Real-time sync pushes clean data into existing applications" },
      { id: "c3", name: "Phased rollout templates", detail: "Pre-configured data model deployed market by market" },
      { id: "c4", name: "Regional cloud tenancy", detail: "Choose hosting region; every change is logged" },
      { id: "c5", name: "Data-quality automation", detail: "Quality rules, scorecards, and stewardship work queues" },
      { id: "c6", name: "Generative AI chat assistant", detail: "Ask questions about your data in plain language" },
      { id: "c7", name: "On-premises deployment", detail: "Install and run the platform in your own data center" }
    ],
    matchFeedback: {
      c6: "The AI assistant is a nice-to-have, but it doesn't solve any of Halvorsen's stated requirements. Leading with it is a common distraction.",
      c7: "On-premises deployment adds the maintenance burden Dana wants to remove, and the 2022 project shows how long self-built infrastructure can take."
    },
    classify: {
      options: [
        { id: "feature", label: "Feature", hint: "What the product does or has" },
        { id: "benefit", label: "Benefit", hint: "What that means for the user" },
        { id: "outcome", label: "Business outcome", hint: "What the organization achieves" }
      ],
      items: [
        {
          id: "s1",
          text: "Survivorship rules automatically select the most trusted value for each field.",
          answer: "feature",
          feedback: "Feature: it describes what the product does."
        },
        {
          id: "s2",
          text: "Data stewards spend less time manually reconciling records.",
          answer: "benefit",
          feedback: "Benefit: it describes what the feature means for the people using it."
        },
        {
          id: "s3",
          text: "The launch team reaches the right accounts in all 14 markets on day one.",
          answer: "outcome",
          feedback: "Business outcome: it describes a result the organization cares about."
        }
      ]
    },
    /* Composer: four slots. Each option scores 0–3.
       The "evidence" slot is built from insights uncovered in Stage 1;
       its points are set in evidencePoints below. */
    composer: {
      slots: [
        {
          id: "problem",
          label: "The problem",
          prompt: "How will you frame the customer's problem?",
          options: [
            { id: "p1", text: "Halvorsen's customer data is split across four systems, creating duplicate accounts and hours of manual rework,", points: 3, feedback: "Specific to Halvorsen and stated in their terms." },
            { id: "p2", text: "Many life sciences companies struggle with data quality,", points: 1, feedback: "Generic. It could describe any prospect, so it doesn't show you listened." },
            { id: "p3", text: "Your current systems are outdated and holding you back,", points: 0, feedback: "Criticizes choices the customer made, which tends to create defensiveness." }
          ]
        },
        {
          id: "solution",
          label: "The solution",
          prompt: "How will you describe what Aperion does?",
          options: [
            { id: "s1", text: "and Aperion unifies those records into one governed customer master that stays in sync with your CRM and ERP", points: 3, feedback: "Describes the solution in terms of the customer's problem and systems." },
            { id: "s2", text: "and Aperion is a multi-tenant, multi-domain, cloud-native big-data platform", points: 1, feedback: "Accurate but jargon-heavy. It lists architecture rather than what changes for them." },
            { id: "s3", text: "and Aperion replaces your CRM and ERP with one modern system", points: 0, feedback: "Inaccurate, and it raises exactly the disruption fears Marcus and Dana have." }
          ]
        },
        {
          id: "evidence",
          label: "Customer evidence",
          prompt: "Which discovery insight will make this credible? (Only insights you uncovered are available.)",
          dynamic: true
        },
        {
          id: "outcome",
          label: "The outcome",
          prompt: "Which outcome will you commit to?",
          options: [
            { id: "o1", text: "so your launch team can reach the right accounts in every market on schedule, while your stewards spend less time on rework.", points: 3, feedback: "Ties the solution to their real priority (the launch) and a measurable team benefit." },
            { id: "o2", text: "so you have best-in-class data.", points: 1, feedback: "Vague. \"Best-in-class\" can't be measured or verified." },
            { id: "o3", text: "guaranteeing a 300% return in year one.", points: 0, feedback: "An unsupported guarantee damages credibility and creates contractual risk." }
          ]
        }
      ],
      evidencePoints: {
        dupes: 3,
        cost: 3,
        launch: 3,
        history: 2,
        residency: 2,
        buyers: 1
      },
      evidencePhrases: {
        dupes: "(you told us one health system appears four different ways)",
        cost: "(you told us six people spend most of each month reconciling records)",
        launch: "(with a nine-month launch window that won't move)",
        history: "(without repeating the integration work that stalled in 2022)",
        residency: "(with EU data kept in the EU)",
        buyers: "(with sign-off from IT, governance, and commercial teams)"
      },
      evidenceFeedback: {
        dupes: "Strong evidence. The customer's own example makes the problem concrete.",
        cost: "Strong evidence. The customer's own numbers make the value measurable.",
        launch: "Strong evidence. Tying the message to the launch makes it urgent.",
        history: "Useful, but this mainly reduces risk. It doesn't show the value of solving the problem.",
        residency: "Useful, but this is a requirement to meet, not a reason to buy.",
        buyers: "Weak. Who signs off is process information, not evidence of value.",
        generic: "Weak. A generic claim with no customer data is easy to dismiss. Insights from discovery would make this stronger."
      },
      genericEvidence: {
        id: "generic",
        text: "(trusted by leading companies worldwide)",
        points: 1
      }
    }
  },

  /* ------------------------------------------------------------------
     STAGE 4 — Objection Handling
     Each objection has one strong, one partial, and one poor response.
     If the first choice isn't strong, the learner may revise once.
     Score per objection = max(first attempt, revision) using the table.
     ------------------------------------------------------------------ */
  objections: {
    scoring: {
      first: { strong: 4, partial: 2, poor: 0 },
      revised: { strong: 3, partial: 2, poor: 0 }
    },
    maxPoints: 16,
    framework: [
      { step: "Acknowledge", text: "Show you heard the concern without arguing." },
      { step: "Clarify", text: "Ask or confirm what sits behind it." },
      { step: "Respond", text: "Answer with evidence specific to this customer." },
      { step: "Confirm", text: "Check whether the answer resolved it, and agree a next step." }
    ],
    items: [
      {
        id: "o1",
        category: "Implementation complexity",
        speaker: "dana",
        text: "We tried building a customer hub in 2022. It took fourteen months and never went live. Why would this be any different?",
        options: [
          {
            quality: "partial",
            text: "Our platform is much easier than building in-house. Most of our customers go live quickly.",
            reaction: "Dana: \"That's what our last vendor said too.\" She doesn't look convinced.",
            feedback: "Partly effective. You disagree with the concern but offer no evidence, and \"most customers\" is vague. Acknowledge what happened and explain specifically how this approach reduces that risk."
          },
          {
            quality: "strong",
            text: "That's a fair concern, and I'd rather address it directly. Was it mainly integration, scope, or adoption that stalled it? We'd start with one division and your two highest-volume systems, using pre-built connectors, with exit criteria you approve before expanding. I can also connect you with a customer who took a similar path.",
            reaction: "Dana: \"It was integration, mostly. A phased start with exit criteria I set... that I could take to my team.\"",
            feedback: "Effective. You acknowledged the concern, asked what caused the failure, offered a lower-risk phased approach she controls, and proposed peer proof."
          },
          {
            quality: "poor",
            text: "Honestly, that project probably failed because of the old technology. Ours is cloud-native, so that won't happen.",
            reaction: "Dana, flatly: \"My team built that. It wasn't the technology.\"",
            feedback: "Ineffective. It blames the customer's team and promises something you can't guarantee. Never dismiss a past failure the stakeholder owned."
          }
        ]
      },
      {
        id: "o2",
        category: "Return on investment",
        speaker: "dana",
        text: "I can't take this to our CFO without a clear return. The license cost alone is significant.",
        options: [
          {
            quality: "poor",
            text: "If you can sign this quarter, I can offer a 25% discount.",
            reaction: "Dana: \"A discount on something I can't justify is still something I can't justify.\"",
            feedback: "Ineffective. Jumping to price signals that the list price isn't credible and still doesn't answer the ROI question."
          },
          {
            quality: "strong",
            text: "Let's build that case with your numbers, not mine. If we quantify the hours spent reconciling records, the cost of duplicate-driven rebate disputes, and the interfaces you'd retire, we can model payback conservatively. Your finance team can pressure-test every assumption. Could Priya and I put that together for you this week?",
            reaction: "Dana: \"If the numbers are ours, the CFO will trust them. Yes, let's do that.\"",
            feedback: "Effective. You acknowledged the need, grounded ROI in the customer's own data, made it verifiable, and agreed a concrete next step."
          },
          {
            quality: "partial",
            text: "Our customers typically see a strong return. I can send you an analyst report on the market.",
            reaction: "Dana: \"Sure, send it over.\" It sounds like the report will sit unread.",
            feedback: "Partly effective. Third-party proof helps, but generic market data won't convince a CFO about this business. Build the case from their own numbers."
          }
        ]
      },
      {
        id: "o3",
        category: "Organizational change",
        speaker: "marcus",
        // Development note shown in the debrief ONLY when the first response was not fully effective.
        // The first sentence matches the learner's first response; the second matches what happened next.
        debriefNote: {
          firstPartial: "Your first response emphasized training materials and webinars. That reinforced Marcus's concern that a new system means extra work and disruption before launch.",
          firstPoor: "Your first response relied on a leadership mandate. That dismissed Marcus's concern about extra work and disruption before launch, and put him on the defensive.",
          revisedStrong: "Your revision worked because it protected launch readiness, made clear that reps wouldn't need to learn a new tool, and gave his regional leads a role in planning the rollout.",
          notRecovered: "A stronger response would protect launch readiness, avoid asking reps to learn a new tool, and give operational leaders a role in planning the rollout."
        },
        text: "My reps have a launch to prepare for. Every new system means training, and adoption always tanks.",
        options: [
          {
            quality: "partial",
            text: "We provide comprehensive training materials and webinars for every user.",
            reaction: "Marcus: \"So, more training. That's exactly my point.\"",
            feedback: "Partly effective. You took the concern seriously, but you confirmed his fear instead of addressing it. The key fact is that reps don't need to learn a new tool."
          },
          {
            quality: "poor",
            text: "Adoption won't be an issue once leadership makes it mandatory.",
            reaction: "Marcus folds his arms. \"I am leadership, for my reps.\"",
            feedback: "Ineffective. Relying on a mandate dismisses his concern and puts him on the defensive. Mandates rarely produce real adoption."
          },
          {
            quality: "strong",
            text: "Understood. Launch readiness has to come first. Your reps wouldn't learn a new tool: the change shows up as cleaner accounts in the CRM they already use. Could we co-design the rollout with two of your regional leads and schedule cutover outside your launch window?",
            reaction: "Marcus: \"If my reps don't see a new screen, and my leads pick the dates, I can live with that.\"",
            feedback: "Effective. You acknowledged his priority, corrected the assumption that drove his concern, and gave his team control over the change."
          }
        ]
      },
      {
        id: "o4",
        category: "Competitive alternative",
        speaker: "priya",
        text: "Our ERP vendor says their bundled master-data module could do this for almost no extra license cost.",
        options: [
          {
            quality: "strong",
            text: "That's worth evaluating seriously. A useful test: can it master customers from all four systems, not just the ERP, apply your matching rules across markets, and keep EU data in the EU? If it can, it's a strong option. If not, the hidden cost is integration work. Would a side-by-side against your requirements help?",
            reaction: "Priya: \"That's a fair test. Let's put both against our requirements list.\"",
            feedback: "Effective. You treated the alternative respectfully, moved the comparison to the customer's own criteria, and pointed out the hidden cost without disparaging anyone."
          },
          {
            quality: "poor",
            text: "Honestly, their module is terrible. We hear complaints from their customers all the time.",
            reaction: "Priya: \"We've been their customer for ten years.\" The room goes quiet.",
            feedback: "Ineffective. Disparaging a competitor is unprofessional, unverifiable, and indirectly criticizes the customer's past choices."
          },
          {
            quality: "partial",
            text: "Bundled modules are usually limited. We're the leader in this space.",
            reaction: "Priya: \"Limited how, exactly?\"",
            feedback: "Partly effective. You may be right, but an unsupported leadership claim invites skepticism. Give the customer a way to test the difference themselves."
          }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------
     Debrief — bands, strengths, development, next steps
     ------------------------------------------------------------------ */
  debrief: {
    bands: [
      { min: 85, label: "Strong" },
      { min: 65, label: "Proficient" },
      { min: 0, label: "Developing" }
    ],
    strengthThreshold: 80,
    competencies: {
      discovery: {
        label: "Discovery effectiveness",
        strength: "You asked open, impact-focused questions that uncovered real priorities rather than pitching.",
        develop: "Replace closed or pitch-style questions with open questions about process, impact, urgency, and past attempts.",
        next: "Before your next call, write five open questions: one each on process, impact, urgency, the buying group, and past attempts."
      },
      stakeholders: {
        label: "Stakeholder alignment",
        strength: "You read the buying group accurately and matched each message to what that person values.",
        develop: "Separate who holds budget, who shapes the evaluation, and who can block. Then translate one capability into each person's priorities.",
        next: "Build a one-page stakeholder map for a live account: role, influence, top priority, top concern, and a tailored one-line message."
      },
      value: {
        label: "Value articulation",
        strength: "You linked capabilities to business requirements and built a specific, evidence-based value proposition.",
        develop: "Lead with the customer's problem and outcome, use their own evidence, and keep features as supporting detail.",
        next: "Rewrite your standard pitch as a 25-word and a 50-word value proposition for one customer, using a fact they told you."
      },
      objections: {
        label: "Objection handling",
        strength: "You acknowledged concerns, clarified them, and answered with customer-specific evidence and a next step.",
        develop: "Use the acknowledge, clarify, respond, confirm pattern. Avoid discounts, mandates, guarantees, and disparaging competitors.",
        next: "Role-play the four objections from this simulation with a peer, using a real account, and record your responses for review."
      }
    }
  }
};
