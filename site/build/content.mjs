/* Single source of truth for the case-study pages.
   Prose is carried over from the existing portfolio (constants.tsx), trimmed
   where it repeated itself. Edit here, then `node build/cases.mjs`. */

export const CASES = [
  {
    slug: 'xtrade',
    name: 'xTrade',
    brand: '#1f7a5c',
    icon: '<path d="M2.5 14.5V9M6.8 14.5V5M11.2 14.5V7.2M15.5 14.5V3.5"/>',
    tag: 'NDA',
    locked: 'Socrates14',
    title: 'Four legacy systems,<br>one placement platform',
    tagline:
      'Aviation, Renewables, Cargo and Fine Art each had their own application, their own dev team and their own way of capturing risk. I consolidated them, and became the product owner of the thing I had been designing.',
    meta: [
      ['Role', 'Lead Product Designer → Product Owner'],
      ['Team', '17 cross-functional'],
      ['Where', 'Howden Group'],
      ['When', '2021 – present'],
    ],
    card: 'Four legacy placement systems collapsed into one configurable platform. I went from lead designer to product owner of a 17-person team because the problem needed both.',
    cardStats: [
      ['£1.5–2M', 'saved a year'],
      ['~£200M', 'GWP processed'],
      ['~1,000', 'enterprise users'],
    ],
    shots: [
      ['mock-panes', '#123f30', '#1f7a5c', 'Outlook-shaped placement UI'],
      ['mock-code', '#eef0ee', '#dfe4e1', 'Config tool, ~1 month saved per product', 'pale'],
    ],
    sections: [
      {
        h: 'The strategic problem',
        p: [
          'I had spent seven years in Howden’s internal design team, designing several of the 1.0 placement platforms. Each product line ran on its own stack, and the cost compounded in four directions at once.',
          'Duplicated maintenance across multiple tech stacks. Launching a new product line meant building from scratch. Inconsistent data capture made analytics unreliable. And brokers had to learn a different interface for every product they touched.',
        ],
      },
      {
        h: 'My role',
        p: [
          'I joined as lead product designer and evolved into product owner. That transition happened because the problems required someone who could hold the user experience and the delivery reality in the same frame.',
          'In practice: owning the roadmap and the prioritisation calls, leading a 17-person delivery team through standups and sprint planning, running weekly research with brokers and underwriters, managing a £1.5M annual budget, and partnering with North — the agency behind the Tate Modern and Co-op identities — on Howden’s digital design language.',
        ],
      },
      {
        n: '01',
        h: 'The Outlook mental model',
        p: [
          'Enterprise software fails when it asks users to abandon mental models they have spent years building. From the first round of interviews one thing was obvious: brokers live in Outlook.',
          'So rather than imposing a novel paradigm, I leaned into what they already knew. A pane-based layout mirroring Outlook’s list-plus-detail pattern. Clear hierarchy for submissions, placements and market responses. Interaction patterns that felt immediately familiar.',
          'We tested with groups of up to ten brokers. Onboarding friction was close to zero — people understood how to navigate in minutes rather than days.',
        ],
      },
      {
        n: '02',
        h: 'The configuration tool nobody asked for',
        p: [
          'As we onboarded more product lines, a bottleneck emerged. Product configuration was being done by hand in JSON. Early configs ran to a few hundred lines; they ballooned into the thousands, with field IDs reused across subsystems.',
          'This was the constraint on our ability to scale, and it was invisible on any roadmap. Rather than asking for a dedicated engineering initiative, I prototyped the tool myself: automated ID generation and mapping across subsystems, product logic exposed visually instead of buried in raw JSON, validation before deployment, and a structure legible to people who do not read code.',
          'Configuration timelines dropped by roughly a month per product. We have since launched five more products through it.',
        ],
      },
      {
        n: '03',
        h: 'Export over dashboard',
        p: [
          'Midway through the build, stakeholders asked for a dashboard. Charts, KPIs, visual reporting. I pushed back.',
          'Having led Howden’s dashboard unification effort, I knew how dashboards actually get used here: people export to Excel, rebuild the view they need, and circulate a spreadsheet. So I proposed investing in export instead — clean column selection and filtering, formatting aligned to Excel workflows, and reliable performance on large datasets.',
          'It met the real need at a fraction of the cost, and it scaled automatically as we added products. No dashboard redesign required.',
        ],
      },
      {
        h: 'Design system and brand',
        p: [
          'With 2.5 designers on the team, I led a system that standardised the components the platform actually runs on — tables, forms, pricing panels, filters — and defined typography, spacing and interaction patterns for consistency and accessibility, aligned to the brand direction we developed with North.',
          'It has since been adopted across other Howden applications, which multiplied the original investment well beyond xTrade.',
        ],
      },
    ],
    outcomes: [
      ['£1.5–2M', 'annual saving from legacy consolidation'],
      ['~£200M', 'gross written premium processed a year'],
      ['~1,000', 'enterprise users, including AXA, Aviva, Convex, Chubb and Hiscox'],
      ['5', 'additional product lines launched via the configuration tool'],
      ['~10 hrs', 'saved per stakeholder per week through structured MRC v3 capture'],
    ],
    learned: [
      ['Familiarity beats novelty in high-stakes workflows.', 'When users are processing complex, high-value transactions, reducing cognitive load matters more than visual innovation.'],
      ['Fixing invisible bottlenecks creates disproportionate leverage.', 'The configuration problem was not glamorous. It was the thing preventing us from scaling.'],
      ['The best feature is sometimes the one you do not build.', 'Pushing back on the dashboard required confidence in my reading of how people actually work.'],
      ['Holding design and delivery together protects quality at speed.', 'Being both design lead and product owner meant I could defend UX while staying close to engineering trade-offs.'],
    ],
  },

  {
    slug: 'insyt',
    name: 'Insyt',
    brand: '#f76b15',
    icon: '<path d="M2.5 6.2 9 3l6.5 3.2v5.6L9 15l-6.5-3.2z"/><path d="M2.5 6.2 9 9.4l6.5-3.2M9 9.4V15"/>',
    tag: '2 yrs',
    title: 'Redemption at<br>national scale',
    tagline:
      '“Buy a Chromebook, get a Google Home free” is a serious marketing investment. The infrastructure behind it was usually an afterthought — an agency one-off, fragile under load and disconnected from fulfilment. We built the platform instead.',
    meta: [
      ['Role', 'Lead Product Designer'],
      ['Team', '2 designers, one hired by me'],
      ['Clients', 'Google, LG, Philips, Samsung'],
      ['When', '2 years'],
    ],
    card: 'A redemption platform for Google, LG, Philips and Samsung. I posted sixty parcels around the UK to pick the courier, then defended our tested inputs against Material Design.',
    cardStats: [
      ['4–5k', 'daily users at peak'],
      ['Mid-60s', 'client NPS'],
      ['~1 week', 'saved per campaign'],
    ],
    shots: [
      ['mock-form', '#2b1b52', '#7a3df0', 'Conversational capture'],
      ['mock-parcels', '#f2efe7', '#e4ddcd', '60-package delivery audit', 'pale'],
    ],
    sections: [
      {
        h: 'The strategic problem',
        p: [
          'Landing pages for promotional campaigns were built as one-offs: inconsistent quality, poor accessibility, fragile under the traffic a TV spot produces, and completely disconnected from fulfilment. Support teams drowned in “where is my item?”.',
          'The opportunity was a single platform that could deliver a best-in-class redemption experience across brands, survive traffic spikes from TV and print, integrate properly with logistics partners, cut operational overhead, and be reused for the next client.',
        ],
      },
      {
        h: 'My role',
        p: [
          'I led product design for two years across UX, service design and client-facing work. I owned the experience end to end — from the form through fulfilment and support — and managed two designers across the component system and the campaign UIs.',
          'I also led service design across logistics partners, drove the copy and accessibility standards, and presented in sales pitches to Google, LG and Philips, demoing the platform and explaining how we tested it.',
        ],
      },
      {
        n: '01',
        h: 'The sixty-package audit',
        p: [
          'Redemption does not end with a thank-you screen. The part customers remember is receiving — or not receiving — the item. Most teams treat logistics as somebody else’s problem. I insisted we make it ours.',
          'I ordered just under sixty packages to destinations across the UK: cities, suburbs, rural addresses, using different delivery partners. I documented delivery times, package condition, notification accuracy and every failure mode.',
          'The findings were decisive. One partner performed significantly worse outside urban areas. We chose DPD on the evidence. Unglamorous work that shaped the entire downstream experience.',
        ],
      },
      {
        n: '02',
        h: 'Conversational data capture',
        p: [
          'Our users were not always tech-savvy. Many arrived from TV and newspaper ads — an older demographic, usually on a phone, redeeming a promotion for the first time. A traditional long form would have killed conversion.',
          'So the flow asked one question at a time: large mobile-friendly inputs, a conversational tone, clear progress, and a summary screen before submission. Abandonment dropped sharply, particularly on mobile, and the pattern became the reusable template for every campaign after it.',
        ],
      },
      {
        n: '03',
        h: 'Pushing back on Google',
        p: [
          'Google’s team wanted Material Design inputs throughout their campaigns. Their components, their styling.',
          'I pushed back. Ours had been tested across demographics and devices, met WCAG, and were optimised for the specific context of promotional redemption. I walked their team through the testing methodology, showed the rationale behind each component decision, and demonstrated how we could hold brand consistency without giving up usability. They accepted the approach.',
          'It was never about winning the argument. It was about the person at the other end of the campaign.',
        ],
      },
      {
        n: '04',
        h: 'Copy standards and accessibility',
        p: [
          'As campaigns multiplied, inconsistency crept in — different writers, different tones, different levels of clarity around promotional terms. That is a confused user and a compliance risk at the same time.',
          'I pushed for a copy style guide, and for a part-time copywriter to own the words across campaigns. I made the business case on iteration cycles: we were burning days on stakeholder feedback rounds a dedicated writer would prevent. Cycles roughly halved, saving about a week per campaign.',
          'On accessibility, every form component was held to WCAG and tested across assistive technologies.',
        ],
      },
      {
        h: 'One component library, four brands',
        p: [
          'To serve Google, LG, Philips and Samsung from one platform we built a library that supported co-branding and theming per client, shared interaction patterns across campaigns, and rapid setup for a new promotion without rebuilding it.',
          'That is what turned Insyt from a project into a product.',
        ],
      },
    ],
    outcomes: [
      ['Millions', 'of users reached across the UK and Europe'],
      ['4–5k', 'daily users at peak during TV and print campaigns'],
      ['Mid-60s', 'client NPS, well above typical promotional experiences'],
      ['3', 'major clients pitched and won during my tenure'],
      ['~1 week', 'of iteration time saved per campaign'],
    ],
    learned: [
      ['The real experience extends far beyond the UI.', 'Redemption spans web, logistics, email, SMS and support. Designing only the form would have solved 30% of the problem.'],
      ['Defending UX decisions is part of the job.', 'Presenting testing rationale and standing behind your methodology, while staying collaborative, is the work at this level.'],
      ['Investing in content quality pays back fast.', 'The copywriter recommendation felt like a small intervention. It turned out to be the high-leverage one.'],
      ['Client-facing work sharpens your craft.', 'Pitching forces you to articulate why an approach works, not just what you built.'],
    ],
  },

  {
    slug: 'driving-data',
    name: 'Driving Data',
    brand: '#2f7dff',
    icon: '<circle cx="9" cy="9" r="6.4"/><path d="M9 9l3.2-2.6"/>',
    tag: '1 yr',
    title: 'Coaching,<br>not scoring',
    tagline:
      'A telematics app rewards you for driving well. The one we inherited told you how badly you had done, asked for every permission at once, and was about to be rebuilt from scratch for each new insurer.',
    meta: [
      ['Role', 'Lead Product Designer'],
      ['Team', '0.5 designer, dev in Scotland, stakeholders in the Netherlands'],
      ['Client', 'ANWB, then white-labelled'],
      ['When', '1 year'],
    ],
    card: 'A telematics app re-platformed for ANWB. I argued for one white-label build instead of an app per insurer, and swapped trip scoring for coaching.',
    cardStats: [
      ['−1/3', 'onboarding drop-off'],
      ['1 app', 'not one per client'],
      ['On time', 'ANWB relaunch'],
    ],
    shots: [
      ['mock-phone', '#0b2a4a', '#2f7dff', 'Coaching, not scoring'],
      ['mock-perms', '#eaf1fb', '#d7e4f6', 'Staggered permission flow', 'pale'],
    ],
    sections: [
      {
        h: 'The strategic problem',
        p: [
          'Telematics lets drivers reduce their premium by driving more safely. When Howden acquired the company behind Driving Data, the app had a cluttered UX, an onboarding flow whose permission requests confused people and killed activation, and feedback that read as judgment rather than help.',
          'The bigger issue was the plan: build a separate UI for every new insurer. That was the blocker. An app per client does not scale.',
        ],
      },
      {
        h: 'My role',
        p: [
          'I led the re-platforming and UX redesign as sole lead designer, with a design systems specialist half-time. Interviews with drivers about monitoring, feedback and privacy. Redesign of onboarding, permissions, trip scoring and feedback. A/B tests on permission copy and sequencing. And the white-label architecture, which was my proposal and initially unwelcome.',
        ],
      },
      {
        n: '01',
        h: 'White-label over multiple apps',
        p: [
          'The original plan meant different apps, different codebases, different maintenance burden. I had watched that pattern fail before.',
          'I proposed a single app, themed and configured per client. The pushback was immediate — stakeholders assumed it would take longer and cost more. So I did not argue, I showed them: two comparable Howden initiatives, one built without a component library and one with. The version with reusable components could be updated in seconds.',
          'We built it. ANWB launched on time, Howden later launched their own white-labelled version, and the architecture opened sales conversations with other insurers.',
        ],
      },
      {
        n: '02',
        h: 'Permission flows that convert',
        p: [
          'Telematics needs always-on location, motion detection, notifications, sometimes Bluetooth. Most apps dump all of it on the user at once. Users decline, onboarding fails, and the business model fails with it.',
          'I redesigned around three principles: plain-language explanations tied to a clear benefit, staggered requests made at the moment each permission becomes relevant, and framing that addressed privacy concerns head-on rather than hoping nobody asked.',
          'I ran A/B tests on copy variations with participants I recruited myself. Onboarding drop-off fell by roughly a third.',
        ],
      },
      {
        n: '03',
        h: 'Feedback that helps rather than grades',
        p: [
          'The original app scored every trip. A score without context feels like a verdict — drivers who got a low one felt criticised, not helped, and many disengaged entirely.',
          'I rebuilt the feedback around coaching: encouraging language that framed improvement as achievable, specific and actionable suggestions like “brake earlier before junctions” instead of a vague rating, and progress over time so people could see themselves improving.',
          'That changed the emotional dynamic of the whole product. Users were not being watched and graded. They were being helped.',
        ],
      },
      {
        h: 'Simpler navigation',
        p: [
          'Alongside the strategic calls, the core UX needed stripping back: unnecessary complexity out of navigation, a home dashboard centred on recent trips and behaviour trends, and a clear distinction between hardware and phone-based modes.',
          'The goal was an app that felt lightweight and helpful rather than surveillance-heavy.',
        ],
      },
    ],
    outcomes: [
      ['On time', 'ANWB relaunch delivered to schedule'],
      ['~1/3', 'reduction in onboarding drop-off from A/B-tested permission flows'],
      ['2+', 'brands live on the white-label platform, with further insurer conversations opened'],
      ['1 codebase', 'where the plan had been one app per client'],
    ],
    learned: [
      ['Challenge the build plan, not just the UI.', 'The most impactful decision I made was not a design choice. It was proposing a different architecture.'],
      ['Permission UX is product strategy.', 'For an app that depends on sensitive permissions, onboarding is not a flow. It is the entire funnel.'],
      ['Behaviour change needs coaching, not scoring.', 'Feedback that feels like judgment creates defensiveness. Feedback that feels like support creates engagement.'],
      ['Evidence beats opinion in cross-functional debates.', 'When stakeholders assumed white-label would cost more, I showed them two previous projects instead of arguing.'],
    ],
  },

  {
    slug: 'dashboards',
    name: 'Unified Dashboards',
    brand: '#b4292f',
    icon: '<rect x="2.5" y="2.5" width="13" height="13" rx="2.5"/><path d="M2.5 7h13M7 7v8.5"/>',
    tag: '~20',
    title: 'One language for<br>a £3B business',
    tagline:
      'Howden grew from roughly £800M to £3B by acquisition, and every acquisition arrived with its own dashboards, its own metric definitions and its own idea of what a filter does. Leadership could not compare two business units without translating between them first.',
    meta: [
      ['Role', 'Lead Product Designer'],
      ['Team', '2 designers + 1 contractor I hired'],
      ['Scope', '~20 dashboards across Finance, HR and Broking'],
      ['Stack', 'Power BI and Angular'],
    ],
    card: 'An £800M business became £3B by acquisition, and every acquisition brought its own dashboard. One visual language, one glossary, one export flow across Finance, HR and Broking.',
    cardStats: [
      ['~20', 'dashboards unified'],
      ['3', 'functions aligned'],
      ['PE', 'investment secured'],
    ],
    shots: [
      ['mock-bars', '#3a1013', '#b4292f', 'One categorical palette'],
      ['mock-table', '#f4f1f1', '#e6dede', 'Export over dashboard', 'pale'],
    ],
    sections: [
      {
        h: 'The strategic problem',
        p: [
          'Different colour schemes, chart types and hierarchies on every dashboard. The same metric labelled differently — or calculated differently — depending on who built it. Filters, date ranges and drill-downs each handled their own way. And when none of it worked, screenshots and manual copying.',
          'The cost was not aesthetic. Leaders could not compare performance across business units without first mentally translating each dashboard’s logic.',
        ],
      },
      {
        h: 'My role',
        p: [
          'I led the design effort across Finance, HR and Broking with a project manager and a product lead: running discovery into how dashboards were really used, defining the visual language and pattern library across two very different platforms, managing a small team, and translating hard technical constraints into UX patterns.',
          'A good part of the job was navigating scepticism from teams who were protective of what they already had.',
        ],
      },
      {
        n: '01',
        h: 'Realistic mockups over beautiful ones',
        p: [
          'Dashboard projects here had a mixed record. Finance and HR had seen initiatives that looked good in Figma and fell apart in implementation, so I earned trust by showing I understood the constraints.',
          'No rounded corners in the Power BI designs, because the platform does not support them. System fonts — Arial, Georgia, Courier — not custom typography that would never ship. Mockups built on real data scenarios and actual edge cases. And fast turnaround, with feedback incorporated between sessions.',
          'It was not about flashy design. It was about demonstrating I could deliver inside the real constraints.',
        ],
      },
      {
        n: '02',
        h: 'A unified visual language',
        p: [
          'I defined a cross-tool pattern library covering all twenty dashboards: a categorical and quantitative palette that worked within Power BI’s limits, typography and spacing tuned for reading numbers at a glance, chart-type guidance with the rationale attached, and standard patterns for filters, tabs, tables and drill-downs.',
          'The test was simple. Someone who understands one dashboard should feel at home in any other, whichever tool it was built in.',
        ],
      },
      {
        n: '03',
        h: 'Standardised filtering, and a glossary',
        p: [
          'Filtering was the single biggest source of confusion — where filters lived, how they behaved, whether you could tell which were active. I put a stake in the ground: consistent global-versus-local placement, standardised multi-select, reset and defaults, clear surfacing of active filters, and one date-range pattern for time comparisons.',
          'Then the less visible half: how to represent negative numbers (brackets, not minus signs), currency formatting, metric definitions with their calculations, cohort versus total labelling.',
          'None of this is glamorous. But for a data product, trust is the core UX feature.',
        ],
      },
      {
        n: '04',
        h: 'Export UX',
        p: [
          'Discovery made it clear that the dashboard was rarely the destination. Leaders took data out — into Excel to analyse, into PowerPoint for the board, into email to circulate — and the existing export was awkward, dropped filters and gave no control over what came with it.',
          'So I designed one export flow: column selection, filter preservation so the export matches what you are looking at, date range and aggregation controls, and formats matched to what happens next.',
          'It got none of the attention a visual redesign gets. It directly addressed how executives actually used the data.',
        ],
      },
    ],
    outcomes: [
      ['~20', 'dashboards unified across Finance, HR and Broking'],
      ['Hundreds of millions', 'in PE investment, which this work contributed to securing'],
      ['Cross-business', 'comparison made reliable by consistent definitions'],
      ['Faster', 'dashboard builds for BI and engineering on shared patterns'],
      ['Fewer', 'crashes and support queries, per engineering'],
    ],
    learned: [
      ['In data products, trust is the core UX feature.', 'Beautiful charts mean nothing if users do not trust the numbers.'],
      ['Realistic mockups earn credibility faster than polished ones.', 'Showing stakeholders I understood the platform’s limits built trust faster than impressive visuals would have.'],
      ['Export flows matter more than they seem.', 'The boring feature that gets data into Excel turned out to be one of the most valuable things we shipped.'],
      ['Standardisation during growth is a strategic asset.', 'When a business is scaling by acquisition, consistent internal tools are what let leadership manage the portfolio at all.'],
    ],
  },
];
