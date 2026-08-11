import { createContext, useContext, useReducer, useEffect, useRef, useMemo, useCallback } from 'react'

const uid = () => Math.random().toString(36).slice(2,9)
const trackId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2,7)}`

const makeBlock = (type, extra={}) => {
  const defaultSlot = (type==='quiz' || type==='answer') ? 2 : 2
  // text/button use slot 2 (dark) for readability; slot 1 is page bg
  // quiz/answer also need slot 2 (was slot 1 bug → invisible on #f0f9ff)
  const base = {
  id: uid(),
  type,
  parentId: null,
  order: Date.now(),
  content: extra.content ?? defaultContent(type),
  style: {
    size: type==='text'?'M': 'M',
    bold:false, italic:false, underline:false,
    align: type==='text'?'left':'center',
    color: { kind:'token', slot: defaultSlot },
    background: { kind:'token', slot:0 },
    spacingTop: 8, spacingBottom: 8,
    lineHeight: 1.45,
    ...extra.style
  },
  styleOverrides:{},
  trackingId: trackId(type),
  linking: { mode:'always', always:{ kind:'next' } },
  resultRef: null,
  children: [],
  }
  // Priority 1,3,4: answer enrichment
  if(type==='answer'){
    base.score = extra.score ?? 0
    base.tags = extra.tags ?? []
    base.icon = extra.icon ?? ''
    base.reportHeadline = extra.reportHeadline ?? ''
    base.reportBody = extra.reportBody ?? ''
    base.insightUrl = extra.insightUrl ?? ''
    base.insightLabel = extra.insightLabel ?? ''
  }
  // Priority 3,5: quiz-level display + autoAdvance
  if(type==='quiz'){
    base.optionDisplay = extra.optionDisplay ?? 'text'
    base.autoAdvance = extra.autoAdvance ?? false
    base.autoAdvanceDelayMs = extra.autoAdvanceDelayMs ?? 600
  }
  if(type==='image'){
    base.dropShadow = extra.dropShadow ?? true
  }
  return { ...base, ...extra }
}

function defaultContent(type){
  if(type==='text') return 'We help ambitious brands turn visitors into customers — without the guesswork.'
  if(type==='button') return 'Get my free audit'
  if(type==='image') return 'https://picsum.photos/seed/persp/640/420'
  if(type==='divider') return ''
  if(type==='list') return ['Benefit one — clear outcome','Benefit two — social proof','Benefit three — risk reversal']
  if(type==='video') return 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  if(type==='quiz') return { question: 'What best describes your current situation?' }
  if(type==='answer') return 'Just getting started'
  if(type==='form') return {
    formTitle: '',
    submitLabel: 'Continue',
    fields: [
      { id: Math.random().toString(36).slice(2,7), type:'email', label:'Email address', placeholder:'you@company.com', helperText:'We’ll never share your email.', required:true, options:[] },
    ]
  }
  if(type==='reviews') return { rating:5, text:'“This funnel doubled our conversion rate — absolutely love it!” — Alex, Founder', author:'Alex' }
  if(type==='logo') return { logos:['ACME','Globex','Soylent','Initech'] }
  if(type==='testimonial') return { text:'“The best investment we made this year.”', author:'— Jamie, CEO' }
  if(type==='slider') return 'https://picsum.photos/seed/slider/640/360'
  if(type==='graphic') return 'https://picsum.photos/seed/graphic/640/360'
  if(type==='webinar') return { title:'Live Webinar: Growth Secrets', date:'June 12,  3PM CET' }
  if(type==='faq') return [{ q:'How does it work?', a:'Connect your funnel and start capturing leads in minutes.'},{ q:'Is there a free trial?', a:'Yes, 14 days free.'}]
  if(type==='countdown') return { target:'2026-12-31', label:'Offer ends in' }
  if(type==='loader') return { label:'Loading your personal result…' }
  if(type==='embed') return { provider:'Embed', url:'https://example.com' }
  return ''
}

const THEMES = [
  { id:'t1', name:'Editorial', font:'Fraunces', bodyFont:'Inter', colors:['#ffffff','#0f0f0f','#2563eb','#f59e0b'], radius:2, transition:'fade', disableAnimation:false, isSystem:false },
  { id:'t2', name:'Minimal', font:'Inter', bodyFont:'Inter', colors:['#fafaf8','#111111','#111111','#e8e6e1'], radius:1, transition:'slide', disableAnimation:false, isSystem:true },
  { id:'t3', name:'Sunset', font:'Fraunces', bodyFont:'Inter', colors:['#fff7ed','#7c2d12','#ea580c','#facc15'], radius:3, transition:'scale', disableAnimation:false, isSystem:true },
  { id:'t4', name:'Ocean', font:'Inter', bodyFont:'Inter', colors:['#f0f9ff','#0c4a6e','#0284c7','#06b6d4'], radius:2, transition:'fade', disableAnimation:false, isSystem:true },
  { id:'t5', name:'Party', font:'Fraunces', bodyFont:'Inter', colors:['#fff1f2','#831843','#ec4899','#8b5cf6'], radius:3, transition:'scale', disableAnimation:false, isSystem:true },
  { id:'t6', name:'AI — Nebula', font:'JetBrains Mono', bodyFont:'JetBrains Mono', colors:['#faf5ff','#2e1065','#7c3aed','#a78bfa'], radius:3, transition:'fade', disableAnimation:false, isSystem:true },
  { id:'t7', name:'AI — Vector', font:'JetBrains Mono', bodyFont:'JetBrains Mono', colors:['#010d03','#00ff41','#22c55e','#86efac'], radius:1, transition:'none', disableAnimation:false, isSystem:true },
]

function initialFunnel(){
  const a1 = makeBlock('answer', { content:'Just getting started', children:[] })
  const a2 = makeBlock('answer', { content:'Growing steadily', children:[] })
  const a3 = makeBlock('answer', { content:'Scaling fast', children:[] })
  const a4 = makeBlock('answer', { content:'Enterprise level', children:[] })
  const quiz = makeBlock('quiz', { content:{ question:'What best describes your business right now?' }, children:[a1.id,a2.id,a3.id,a4.id] })
  a1.parentId=quiz.id; a2.parentId=quiz.id; a3.parentId=quiz.id; a4.parentId=quiz.id
  const map = {}
  ;[quiz,a1,a2,a3,a4].forEach(b=>map[b.id]=b)
  const b1 = makeBlock('text', { content:'The growth quiz', style:{ size:'XL', align:'center', bold:true } })
  const b2 = makeBlock('text', { content:'Answer 4 quick questions to get a personalized growth plan — tailored to where you are today.', style:{ size:'M', align:'center' } })
  const b3 = makeBlock('button', { content:'Start the quiz →', style:{ align:'center' } })
  const b4 = quiz
  const heroImg = makeBlock('image', { content:'https://picsum.photos/seed/persp-hero/800/520' })
  const form = makeBlock('form', { content:{ label:'Get your plan', placeholder:'Enter your email' } })
  const formText = makeBlock('text', { content:'Drop your email and we’ll send the personalized plan in under a minute.', style:{ size:'M', align:'center' } })
  ;[b1,b2,b3,heroImg,form,formText].forEach(b=>map[b.id]=b)
  return {
    id:'f1', name:'Growth Assessment Funnel',
    themeId:'t1',
    settings:{
      progressBar:true, progressStyle:'bar', cookieBanner:false,
      socialTitle:'Growth Assessment', socialDesc:'Get your personalized growth plan in 45 seconds.', favicon:'', language:'en', funnelBackground:{kind:'token', slot:0},
      startCta:'Get my free audit', brandName:'Acme', category:'Growth', subtitle:'Answer 4 quick questions to get your personalized plan',
      autoAdvance:false, autoAdvanceDelayMs:600,
      legal:{ bannerText:'', footerDisclaimer:'', privacyUrl:'', termsUrl:'' },
    },
    pages:[
      { id:'p1', index:1, name:'Welcome', slug:'welcome', confetti:false, blocks:[b1.id,b2.id,b3.id,heroImg.id], background:{kind:'token', slot:1} },
      { id:'p2', index:2, name:'Question 1', slug:'q1', confetti:false, blocks:[b4.id], background:{kind:'token', slot:1} },
      { id:'p3', index:3, name:'Lead capture', slug:'capture', confetti:false, blocks:[formText.id, form.id], background:{kind:'token', slot:1} },
    ],
    results:[
      { id:'rA', letter:'A', name:'Starter plan', selectionRules:[] },
      { id:'rB', letter:'B', name:'Growth plan', selectionRules:[] },
    ],
    messages:[
      { id:'m1', name:'Welcome sequence', status:'offline', sequence:[
        { id:'n1', type:'trigger', label:'Funnel completed' },
        { id:'n2', type:'delay', label:'Wait 1 hour', delayMs:3600000 },
        { id:'n3', type:'email', label:'Your plan is ready', from:'hello@perspective.test', to:'Contact', subject:'Your personalized plan', body:'Hi {{firstName}}, your {{quizName}} result is ready. Score: {{score}} — {{brandName}}', bodyBlocks:[], recipientMode:'lead', staffEmails:'' },
      ]},
    ],
    blocksById: map,
    themes: THEMES,
  }
}

export function createRobustDemoFunnel(){
  const mkQuiz = (question, opts, cfg={})=>{
    const answers = opts.map(o=>{
      const a = makeBlock('answer', {
        content: o.label,
        score: o.score ?? 0,
        tags: o.tags ?? [],
        icon: o.icon ?? '',
        reportHeadline: o.reportHeadline ?? '',
        reportBody: o.reportBody ?? '',
        insightLabel: o.insightLabel ?? '',
        insightUrl: o.insightUrl ?? '',
      })
      return a
    })
    const q = makeBlock('quiz', {
      content:{ question },
      optionDisplay: cfg.optionDisplay ?? 'text',
      autoAdvance: cfg.autoAdvance ?? false,
      autoAdvanceDelayMs: cfg.autoAdvanceDelayMs ?? 600,
      children: answers.map(a=>a.id)
    })
    answers.forEach(a=> a.parentId = q.id)
    q.children = answers.map(a=>a.id)
    return { q, answers }
  }
  const map={}
  const pages=[]
  let pi=1
  const addPage = (name, slug, blocks, bgSlot=1)=>{
    const id='p'+pi
    pages.push({ id, index:pi, name, slug, confetti: pi===8, blocks: blocks.map(b=>b.id), background:{kind:'token', slot:bgSlot}})
    pi++
    return id
  }
  // Welcome — editorial hero with pill + gradient-friendly copy
  const w1 = makeBlock('text', { content:'We find your growth lever in 60 seconds', style:{ size:48, align:'center', bold:true, font:'Fraunces' } })
  const w2 = makeBlock('text', { content:'Hi {{firstName}} — 7 questions, score {{score}} → a plan from {{brandName}} tailored to your stage.', style:{ size:'M', align:'center', color:{kind:'token', slot:2} } })
  const wPill = makeBlock('text', { content:'<span style="display:inline-flex;gap:8px;align-items:center;background:#fff;border:1px solid #e8e6e1;border-radius:99px;padding:6px 12px;font-size:12px;font-weight:600;letter-spacing:.02em">● 7 questions · 2 min · personalized</span>', style:{ size:'M', align:'center' } })
  const w3 = makeBlock('button', { content:'Start my audit →', style:{ align:'center', bold:true } })
  const wImg = makeBlock('image', { content:'https://picsum.photos/seed/persp-hero7/900/560', dropShadow:true })
  ;[w1,w2,wPill,w3,wImg].forEach(b=> map[b.id]=b)
  addPage('Welcome','welcome',[w1,w2,wPill,w3,wImg])
  // Q1 — stage — icon display, larger question
  const q1 = mkQuiz('What best describes your business right now?', [
    {label:'Just getting started', score:1, tags:['starter'], icon:'🌱', reportHeadline:'Early stage — foundation first', reportBody:'Hi {{firstName}}, you’re laying the groundwork. Focus on clear positioning before scaling. Score: {{score}}.', insightLabel:'Starter checklist', insightUrl:'https://example.com/starter'},
    {label:'Growing steadily', score:3, tags:['growth'], icon:'🌿', reportHeadline:'Growth mode — optimize', reportBody:'You have traction, {{firstName}}. Now tighten conversion and repeat what works. Tag: growth.', insightLabel:'Growth playbook', insightUrl:'https://example.com/growth'},
    {label:'Scaling fast', score:6, tags:['scale','qualified'], icon:'🚀', reportHeadline:'Scale — systems needed', reportBody:'Scaling fast is exciting. Score {{score}} suggests you need systems. {{brandName}} can automate follow-up.', insightLabel:'Scale guide', insightUrl:'https://example.com/scale'},
    {label:'Enterprise level', score:10, tags:['enterprise','qualified'], icon:'🏢', reportHeadline:'Enterprise — bespoke', reportBody:'Enterprise, {{firstName}} — your {{quizName}} score {{score}} qualifies for 1:1 strategy.', insightLabel:'Enterprise consult', insightUrl:'https://example.com/enterprise'},
  ], {optionDisplay:'icon', autoAdvance:false})
  q1.q.style.size = 24
  q1.q.style.bold = true
  ;[q1.q, ...q1.answers].forEach(b=> map[b.id]=b)
  const q1Help = makeBlock('text', { content:'Your tags shape the result — honest answers only.', style:{ size:14, align:'center', italic:true, color:{kind:'solid', hex:'#6b6b6b'} } })
  map[q1Help.id]=q1Help
  addPage('Q1 — Stage','q1',[q1.q, q1Help])
  // give Q1 a gradient page to break monotone
  pages[pages.length-1].background = {kind:'gradient', from:'#fff1f2', to:'#ffffff', angle:180}
  // Q2 — team size — text
  const q2 = mkQuiz('How large is your team?', [
    {label:'Just me', score:1, tags:['solo'], icon:'👤', reportBody:'Solo operator — leverage automation.'},
    {label:'2–5 people', score:3, tags:['small-team'], icon:'👥'},
    {label:'6–20 people', score:6, tags:['mid-team','qualified'], icon:'🏢', reportHeadline:'Mid-team — process matters', reportBody:'Team of 6–20, {{firstName}} — process is your bottleneck.'},
    {label:'20+ people', score:10, tags:['large-team','enterprise'], icon:'🌐', reportHeadline:'Large team — orchestration', reportBody:'Large team score {{score}} — align on one funnel.'},
  ], {optionDisplay:'text'})
  ;[q2.q, ...q2.answers].forEach(b=> map[b.id]=b)
  addPage('Q2 — Team','q2',[q2.q])
  // Q3 — revenue — image display + contextual image to showcase shadow
  const q3 = mkQuiz('What’s your monthly revenue?', [
    {label:'< $10k', score:1, tags:['starter']},
    {label:'$10k – $50k', score:4, tags:['growth']},
    {label:'$50k – $250k', score:7, tags:['scale','qualified']},
    {label:'$250k+', score:10, tags:['enterprise','qualified']},
  ], {optionDisplay:'image', autoAdvance:false})
  q3.q.style.size = 22
  ;[q3.q, ...q3.answers].forEach(b=> map[b.id]=b)
  const q3Img = makeBlock('image', { content:'https://picsum.photos/seed/revenue-7q/720/380', dropShadow:true })
  map[q3Img.id]=q3Img
  addPage('Q3 — Revenue','q3',[q3.q, q3Img])
  pages[pages.length-1].background = {kind:'gradient', from:'#fff1f2', to:'#ffffff', angle:180}
  // Q4 — challenge — icon
  const q4 = mkQuiz('What’s your biggest challenge right now?', [
    {label:'Getting more traffic', score:2, tags:['traffic'], icon:'lucide:trending-up', reportBody:'Traffic is the top constraint — fix acquisition first.'},
    {label:'Converting visitors', score:4, tags:['conversion','qualified'], icon:'lucide:target', reportHeadline:'Conversion — the lever', reportBody:'Conversion at {{score}} pts — your landing copy needs testing.'},
    {label:'Retaining customers', score:3, tags:['retention'], icon:'lucide:heart', reportBody:'Retention — nurture beats acquisition.'},
    {label:'Hiring & ops', score:6, tags:['ops','enterprise'], icon:'lucide:users'},
  ], {optionDisplay:'icon', autoAdvance:true, autoAdvanceDelayMs:800})
  ;[q4.q, ...q4.answers].forEach(b=> map[b.id]=b)
  addPage('Q4 — Challenge','q4',[q4.q])
  // Q5 — timeline — text
  const q5 = mkQuiz('How soon do you want results?', [
    {label:'Just exploring', score:1, tags:['low-intent']},
    {label:'In the next 3 months', score:3, tags:['warm']},
    {label:'In the next 30 days', score:6, tags:['hot','qualified']},
    {label:'This week — urgent', score:10, tags:['urgent','qualified'], icon:'⏰', reportHeadline:'Urgent — fast lane', reportBody:'Urgent timeline, {{firstName}} — we’ll prioritize your {{brandName}} onboarding.'},
  ], {optionDisplay:'text', autoAdvance:true})
  ;[q5.q, ...q5.answers].forEach(b=> map[b.id]=b)
  addPage('Q5 — Timeline','q5',[q5.q])
  // Q6 — budget — icon + image showcase
  const q6 = mkQuiz('What’s your marketing budget?', [
    {label:'< $1k / mo', score:1, tags:['starter'] , icon:'💵'},
    {label:'$1k – $5k', score:3, tags:['growth'], icon:'💰'},
    {label:'$5k – $25k', score:7, tags:['scale','qualified'], icon:'💎', reportHeadline:'Healthy budget — scale', reportBody:'With ${{score}} pts budget, {{brandName}} ROI is strongest.'},
    {label:'$25k+ / mo', score:10, tags:['enterprise','qualified'], icon:'🏦', reportHeadline:'Enterprise budget', reportBody:'Enterprise budget qualifies for done-for-you. Score {{score}}.'},
  ], {optionDisplay:'icon'})
  ;[q6.q, ...q6.answers].forEach(b=> map[b.id]=b)
  const q6Img = makeBlock('image', { content:'https://picsum.photos/seed/budget-7q/720/360', dropShadow:true })
  map[q6Img.id]=q6Img
  addPage('Q6 — Budget','q6',[q6.q, q6Img])
  // Q7 — commitment — image+text, hero question
  const q7 = mkQuiz('How committed are you to fixing this now? ({{brandName}})', [
    {label:'Curious — just looking', score:1, tags:['low-intent'], icon:'👀'},
    {label:'Interested — need details', score:3, tags:['warm']},
    {label:'Ready — have time & budget', score:7, tags:['hot','qualified'], icon:'✅', reportHeadline:'Ready — let’s move', reportBody:'Ready is 80% of success, {{firstName}}. Score {{score}} — we’ll hold a spot.'},
    {label:'All in — start today', score:10, tags:['urgent','enterprise','qualified'], icon:'🔥', reportHeadline:'All in 🔥', reportBody:'All-in commitment unlocks {{brandName}} fast-track. Score {{score}} — {{quizName}} says now.', insightLabel:'Start now', insightUrl:'https://example.com/start'},
  ], {optionDisplay:'image', autoAdvance:false})
  q7.q.style.size = 24
  q7.q.style.bold = true
  ;[q7.q, ...q7.answers].forEach(b=> map[b.id]=b)
  const q7Note = makeBlock('text', { content:'<span style="background:#fff1f2;border:1px solid #fecaca;color:#831843;border-radius:99px;padding:6px 12px;font-size:12px;font-weight:600">Your answer here weights the result most</span>', style:{ size:'M', align:'center' } })
  map[q7Note.id]=q7Note
  addPage('Q7 — Commitment','q7',[q7.q, q7Note])
  // Lead capture — multi-field demo
  const capHead = makeBlock('text', { content:'Get your personalized plan — {{brandName}}', style:{ size:'L', align:'center', bold:true } })
  const capSub = makeBlock('text', { content:'Your score {{score}} and tags determine the result. Leave your details — we’ll send the detailed report (with {{firstName}} merge).', style:{ size:'M', align:'center' } })
  const capForm = makeBlock('form', { content:{
    formTitle: 'Your details',
    submitLabel: 'Get my plan →',
    fields: [
      { id: uid(), type:'text', label:'First name', placeholder:'Alex', helperText:'So we can personalize your report', required:true, options:[] },
      { id: uid(), type:'email', label:'Work email', placeholder:'you@company.com', helperText:'We’ll send your plan here', required:true, options:[] },
      { id: uid(), type:'phone', label:'', placeholder:'Phone (optional)', helperText:'Optional — for a quick SMS summary', required:false, options:[] },
      { id: uid(), type:'select', label:'Team size', placeholder:'Select…', helperText:'', required:false, options:['Just me','2–5','6–20','20+'] },
    ]
  } })
  ;[capHead, capSub, capForm].forEach(b=> map[b.id]=b)
  addPage('Lead capture','capture',[capHead, capSub, capForm])
  // Results — 3 with score/tag rules
  const rA = { id:'rA', letter:'A', name:'Starter — Foundations', selectionRules:[
    {conditions:[{operator:'score_lte', value:'12'}]},
  ]}
  const rB = { id:'rB', letter:'B', name:'Growth — Optimization', selectionRules:[
    {conditions:[{operator:'score_between', value:'13,24'}]},
    {conditions:[{operator:'has_tag', value:'growth'}]},
  ]}
  const rC = { id:'rC', letter:'C', name:'Scale — Enterprise', selectionRules:[
    {conditions:[{operator:'score_gte', value:'25'}]},
    {conditions:[{operator:'has_tag', value:'enterprise'}]},
  ]}
  // Link some answers directly to results as fallback (first answer of each tier)
  q1.answers[0].resultRef='rA'; q1.answers[1].resultRef='rB'; q1.answers[2].resultRef='rC'; q1.answers[3].resultRef='rC'
  return {
    id:'f-demo-7q', name:'7-Question Growth Audit — Demo',
    themeId:'t5',
    settings:{
      progressBar:true, progressStyle:'bar', cookieBanner:true,
      socialTitle:'7-Question Growth Audit', socialDesc:'7 questions → score + tags → tailored result. Demo of scoring, icons, autoAdvance, legal, tokens.', favicon:'', language:'en', funnelBackground:{kind:'token', slot:0},
      startCta:'Start my audit', brandName:'Perspective Demo', category:'SaaS', subtitle:'Score + tags drive the result — {{score}} determines A/B/C',
      autoAdvance:false, autoAdvanceDelayMs:700,
      legal:{ bannerText:'Demo quiz — scoring + tags + icons + tokens live. Try Preview.', footerDisclaimer:'© 2026 Perspective Demo — demo data, not real advice.', privacyUrl:'https://example.com/privacy', termsUrl:'https://example.com/terms' },
    },
    pages, results:[rA,rB,rC],
    messages:[
      { id:'m1', name:'Demo nurture', status:'offline', sequence:[
        { id:'n1', type:'trigger', label:'Funnel completed' },
        { id:'n2', type:'delay', label:'Wait 5 min', delayMs:300000 },
        { id:'n3', type:'email', label:'Your score & plan', from:'hello@perspective.demo', to:'Contact', subject:'Hi {{firstName}} — your score {{score}} is ready ({{brandName}})', body:'Hi {{firstName}},\n\nYour {{quizName}} score is {{score}}.\n{{brandName}} picked result {{category}}.\n\nCollected tags drive this. Reply to book.', bodyBlocks:[], recipientMode:'lead', staffEmails:'' },
        { id:'n4', type:'email', label:'Staff alert — hot lead', from:'hello@perspective.demo', to:'Staff', subject:'New qualified lead — {{score}} pts', body:'Lead {{firstName}} {{email}} scored {{score}} — tags: hot/qualified. Check CRM.', bodyBlocks:[], recipientMode:'staff', staffEmails:'founders@perspective.demo, sales@perspective.demo' },
      ]},
    ],
    blocksById: map,
    themes: THEMES,
  }
}

function deepClone(o){ return JSON.parse(JSON.stringify(o)) }

// --- Parity helpers: merge tokens, scoring, result selection ---
export function interpolateTokens(str, ctx={}){
  if(typeof str!=='string') return str
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k)=>{
    const map = {
      firstName: ctx.firstName || ctx.email?.split('@')[0] || 'there',
      fullName: ctx.fullName || ctx.firstName || '',
      email: ctx.email || '',
      brandName: ctx.brandName || '',
      quizName: ctx.quizName || ctx.funnelName || '',
      score: String(ctx.score ?? 0),
      category: ctx.category || '',
      subtitle: ctx.subtitle || '',
    }
    return map[k]!==undefined ? map[k] : `{{${k}}}`
  })
}

export function collectScoreAndTags(funnel, answers){
  let score=0; const tags=new Set()
  Object.entries(answers||{}).forEach(([trackingId, answerId])=>{
    // answerId may be the block id for quiz answers
    const blk = funnel.blocksById[answerId]
    if(blk && blk.type==='answer'){
      score += Number(blk.score||0)
      ;(blk.tags||[]).forEach(t=> { const tt=t.trim(); if(tt) tags.add(tt) })
    } else {
      // fallback: if answers stored as trackingId->value string, try lookup by trackingId
      const maybe = Object.values(funnel.blocksById).find(b=> b.trackingId===trackingId && b.type==='answer' && b.content===answers[trackingId])
      if(maybe){ score+=Number(maybe.score||0); (maybe.tags||[]).forEach(t=>tags.add(t)) }
    }
  })
  return { score, tags:[...tags] }
}

export function resolveResultId(funnel, session){
  const { score, tags } = session
  // first, check per-result selectionRules (first match wins in result order) — returns null if no rule matches
  for(const r of funnel.results||[]){
    const rules = r.selectionRules||[]
    if(!rules.length) continue
    for(const rule of rules){
      const conds = rule.conditions||[]
      if(!conds.length) continue
      const ok = conds.every(c=>{
        const op = c.operator
        const val = c.value
        if(op==='score_gte') return score >= Number(val||0)
        if(op==='score_lte') return score <= Number(val||0)
        if(op==='score_between'){
          const [a,b]=String(val).split(',').map(Number)
          return score >= (a||0) && score <= (b||9999)
        }
        if(op==='has_tag') return tags.includes(String(val).trim())
        if(op==='equals') return String(score)===String(val) || tags.includes(String(val))
        return false
      })
      if(ok) return r.id
    }
  }
  return null
}

function migratePersisted(saved){
  try{
    // merge new system themes (t5+t6+t7) into existing saves
    if(saved.themes){
      const have = new Set(saved.themes.map(t=>t.id))
      THEMES.forEach(t=>{ if(!have.has(t.id)) saved.themes.push(t) })
      // P8: backfill bodyFont
      saved.themes.forEach(t=>{ if(!t.bodyFont) t.bodyFont = t.font })
    }
    // ensure funnelBackground and page backgrounds exist
    if(!saved.settings) saved.settings={}
    if(!saved.settings.funnelBackground) saved.settings.funnelBackground={kind:'token', slot:0}
    // P5: backfill settings parity defaults
    if(saved.settings.progressStyle===undefined) saved.settings.progressStyle = saved.settings.progressBar ? 'bar' : 'hidden'
    if(saved.settings.startCta===undefined) saved.settings.startCta = 'Get my free audit'
    if(saved.settings.brandName===undefined) saved.settings.brandName = 'Acme'
    if(saved.settings.category===undefined) saved.settings.category = 'Growth'
    if(saved.settings.subtitle===undefined) saved.settings.subtitle = ''
    if(saved.settings.autoAdvance===undefined) saved.settings.autoAdvance = false
    if(saved.settings.autoAdvanceDelayMs===undefined) saved.settings.autoAdvanceDelayMs = 600
    if(!saved.settings.legal) saved.settings.legal = { bannerText:'', footerDisclaimer:'', privacyUrl:'', termsUrl:'' }
    else {
      if(saved.settings.legal.bannerText===undefined) saved.settings.legal.bannerText=''
      if(saved.settings.legal.footerDisclaimer===undefined) saved.settings.legal.footerDisclaimer=''
      if(saved.settings.legal.privacyUrl===undefined) saved.settings.legal.privacyUrl=''
      if(saved.settings.legal.termsUrl===undefined) saved.settings.legal.termsUrl=''
    }
    saved.pages?.forEach(p=>{
      if(!p.background) p.background={kind:'token', slot:1}
    })
    // trim phantom pages 4-6 (keep only first 3 unless user explicitly added)
    if(saved.pages && saved.pages.length>3){
      // if pages 4+ are empty default-named, drop them
      const extra = saved.pages.slice(3)
      const allExtraEmpty = extra.every(p=> !p.blocks || p.blocks.length===0)
      if(allExtraEmpty) saved.pages = saved.pages.slice(0,3)
      // reindex
      saved.pages.forEach((p,i)=> p.index = i+1)
    }
    // fix invisible quiz/answer: slot 1 → slot 2
    Object.values(saved.blocksById||{}).forEach(b=>{
      if((b.type==='quiz' || b.type==='answer') && b.style?.color?.kind==='token' && b.style.color.slot===1){
        b.style.color.slot = 2
      }
      // also fix any text/button that somehow got slot 1 light bg visible? keep slot 2 for readability
      if(b.style?.color?.slot===1 && b.type==='text'){
        // if text on Ocean (#f0f9ff) white-on-light, migrate to 2
        const theme = saved.themes?.find(t=> t.id===saved.themeId)
        if(theme && theme.colors[0]==='#f0f9ff') b.style.color.slot = 2
      }
      // P1,3,4: backfill answer fields
      if(b.type==='answer'){
        if(b.score===undefined) b.score=0
        if(!Array.isArray(b.tags)) b.tags=[]
        if(b.icon===undefined) b.icon=''
        if(b.reportHeadline===undefined) b.reportHeadline=''
        if(b.reportBody===undefined) b.reportBody=''
        if(b.insightUrl===undefined) b.insightUrl=''
        if(b.insightLabel===undefined) b.insightLabel=''
      }
      // P3: backfill quiz fields
      if(b.type==='quiz'){
        if(!b.optionDisplay) b.optionDisplay='text'
        if(b.autoAdvance===undefined) b.autoAdvance=false
        if(b.autoAdvanceDelayMs===undefined) b.autoAdvanceDelayMs=600
      }
      if(b.type==='image'){
        if(b.dropShadow===undefined) b.dropShadow = true
      }
      // Form: migrate legacy {label,placeholder} → {fields:[], formTitle, submitLabel}
      if(b.type==='form'){
        let c = b.content
        if(typeof c==='string'){
          b.content = { formTitle:'', submitLabel:'Continue', fields:[{id:uid(), type:'text', label:c, placeholder:'', helperText:'', required:false, options:[]}] }
          c = b.content
        } else if(c && typeof c==='object' && !Array.isArray(c) && !c.fields){
          // legacy single-field
          const legacyLabel = c.label || 'Email address'
          const legacyPlaceholder = c.placeholder || ''
          b.content = {
            formTitle: '',
            submitLabel: 'Continue',
            fields: [{ id: uid(), type:'email', label: legacyLabel, placeholder: legacyPlaceholder, helperText:'', required:true, options:[] }]
          }
          c = b.content
        }
        // ensure fields shape
        if(c && c.fields && Array.isArray(c.fields)){
          b.content.fields = c.fields.map(f=>({
            id: f.id || uid(),
            type: f.type || 'text',
            label: f.label ?? '',
            placeholder: f.placeholder ?? '',
            helperText: f.helperText ?? '',
            required: !!f.required,
            options: Array.isArray(f.options) ? f.options : [],
          }))
          if(b.content.formTitle===undefined) b.content.formTitle=''
          if(b.content.submitLabel===undefined) b.content.submitLabel='Continue'
        }
      }
    })
    // P2: backfill result selectionRules
    if(saved.results){
      saved.results.forEach(r=>{ if(!Array.isArray(r.selectionRules)) r.selectionRules=[] })
    }
    // P7: backfill messages
    if(saved.messages){
      saved.messages.forEach(m=>{
        ;(m.sequence||[]).forEach(n=>{
          if(n.type==='delay' && n.delayMs===undefined) n.delayMs=3600000
          if(n.type==='email'){
            if(n.body===undefined) n.body=n.bodyBlocks ? '' : 'Hi {{firstName}}, your result is ready.'
            if(n.recipientMode===undefined) n.recipientMode='lead'
            if(n.staffEmails===undefined) n.staffEmails=''
          }
        })
      })
    }
    // ensure p3 has form if empty — create new shape
    const p3 = saved.pages?.[2]
    if(p3 && (!p3.blocks || p3.blocks.length===0)){
      const fid = uid(); const tid = uid()
      const form = { id: fid, type:'form', parentId:null, order:Date.now(), content:{ formTitle:'', submitLabel:'Continue', fields:[{id:uid(), type:'email', label:'Email address', placeholder:'you@company.com', helperText:'We’ll send your plan here', required:true, options:[]}] }, style:{ size:'M', bold:false, italic:false, underline:false, align:'center', color:{kind:'token',slot:2}, background:{kind:'token',slot:0}, spacingTop:8, spacingBottom:8 }, styleOverrides:{}, trackingId: trackId('form'), linking:{mode:'always', always:{kind:'next'}}, resultRef:null, children:[] }
      const txt = { id: tid, type:'text', parentId:null, order:Date.now()-1, content:'Drop your email and we’ll send the personalized plan in under a minute.', style:{ size:'M', bold:false, italic:false, underline:false, align:'center', color:{kind:'token',slot:2}, background:{kind:'token',slot:0}, spacingTop:8, spacingBottom:8 }, styleOverrides:{}, trackingId: trackId('text'), linking:{mode:'always', always:{kind:'next'}}, resultRef:null, children:[] }
      saved.blocksById[fid]=form; saved.blocksById[tid]=txt
      p3.blocks=[tid,fid]
    }
  }catch{}
  return saved
}

function funnelReducer(state, action){
  switch(action.type){
    case 'REHYDRATE': return action.payload
    case 'SET_FUNNEL_NAME': return { ...state, name: action.name }
    case 'SET_THEME': return { ...state, themeId: action.id }
    case 'UPDATE_THEME': {
      return { ...state, themes: state.themes.map(t=> t.id===action.id ? { ...t, ...action.patch } : t) }
    }
    case 'CREATE_THEME': {
      const nt = { id:uid(), name:'New theme', font:'Inter', bodyFont:'Inter', colors:['#ffffff','#111111','#2563eb','#f59e0b'], radius:2, transition:'fade', disableAnimation:false, isSystem:false }
      return { ...state, themes:[nt, ...state.themes], themeId: nt.id }
    }
    case 'FORK_THEME': {
      const src = state.themes.find(t=>t.id===action.id)
      if(!src) return state
      const fork = { ...deepClone(src), id:uid(), name: `${src.name} copy`, isSystem:false }
      return { ...state, themes:[fork, ...state.themes], themeId:fork.id }
    }
    case 'DELETE_THEME': {
      if(state.themes.find(t=>t.id===action.id)?.isSystem) return state
      const remaining = state.themes.filter(t=>t.id!==action.id)
      return { ...state, themes: remaining, themeId: remaining[0]?.id ?? state.themeId }
    }
    case 'ADD_PAGE': {
      const np = { id:uid(), index: state.pages.length+1, name:`Page ${state.pages.length+1}`, slug:`page-${state.pages.length+1}`, confetti:false, blocks:[], background:{kind:'token', slot:1} }
      return { ...state, pages:[...state.pages, np] }
    }
    case 'DUPLICATE_PAGE': {
      const src = state.pages.find(p=>p.id===action.id); if(!src) return state
      const copy = { ...src, id:uid(), name: `${src.name} copy`, index: state.pages.length+1, blocks: [] }
      const newBlocks = {}
      src.blocks.forEach(bid=>{
        const b = state.blocksById[bid]
        if(!b) return
        const nb = { ...deepClone(b), id:uid() }
        nb.children = []
        // duplicate quiz answers too
        if(b.children?.length){
          nb.children = b.children.map(cid=>{
            const child = state.blocksById[cid]
            if(!child) return null
            const nc = { ...deepClone(child), id:uid(), parentId: nb.id }
            newBlocks[nc.id]=nc
            return nc.id
          }).filter(Boolean)
        }
        newBlocks[nb.id]=nb
        copy.blocks.push(nb.id)
      })
      return { ...state, pages:[...state.pages, copy], blocksById:{ ...state.blocksById, ...newBlocks } }
    }
    case 'DELETE_PAGE': {
      if(state.pages.length<=1) return state
      const pages = state.pages.filter(p=>p.id!==action.id).map((p,i)=>({ ...p, index:i+1 }))
      return { ...state, pages }
    }
    case 'RENAME_PAGE': {
      return { ...state, pages: state.pages.map(p=> p.id===action.id ? { ...p, name:action.name } : p) }
    }
    case 'ADD_RESULT': {
      const letter = String.fromCharCode(65 + state.results.length)
      return { ...state, results:[...state.results, { id:uid(), letter, name:`Result ${letter}`, selectionRules:[] }] }
    }
    case 'DELETE_RESULT': {
      return { ...state, results: state.results.filter(r=>r.id!==action.id) }
    }
    case 'UPDATE_RESULT': {
      const r = state.results.find(x=>x.id===action.id); if(!r) return state
      return { ...state, results: state.results.map(x=> x.id===action.id ? { ...x, ...action.patch } : x) }
    }
    case 'ADD_BLOCK': {
      const { pageId, block, afterId } = action
      const page = state.pages.find(p=>p.id===pageId)
      if(!page) return state
      const nb = block
      const idx = afterId ? page.blocks.indexOf(afterId) : -1
      const blocks = idx>=0 ? [...page.blocks.slice(0,idx+1), nb.id, ...page.blocks.slice(idx+1)] : [...page.blocks, nb.id]
      return { ...state, pages: state.pages.map(p=> p.id===pageId ? { ...p, blocks } : p), blocksById:{ ...state.blocksById, [nb.id]: nb, ...(action.extraBlocks||{}) } }
    }
    case 'UPSERT_BLOCKS': {
      return { ...state, blocksById:{ ...state.blocksById, ...action.blocks } }
    }
    case 'UPDATE_BLOCK': {
      const cur = state.blocksById[action.id]; if(!cur) return state
      return { ...state, blocksById:{ ...state.blocksById, [action.id]: { ...cur, ...action.patch } } }
    }
    case 'UPDATE_BLOCK_CONTENT': {
      const cur = state.blocksById[action.id]; if(!cur) return state
      return { ...state, blocksById:{ ...state.blocksById, [action.id]: { ...cur, content: action.content } } }
    }
    case 'UPDATE_BLOCK_STYLE': {
      const cur = state.blocksById[action.id]; if(!cur) return state
      return { ...state, blocksById:{ ...state.blocksById, [action.id]: { ...cur, style:{ ...cur.style, ...action.patch } } } }
    }
    case 'DELETE_BLOCK': {
      const bid = action.id
      const page = state.pages.find(p=>p.blocks.includes(bid))
      let nextPages = state.pages
      let nextById = { ...state.blocksById }
      // if answer child, remove from parent
      const blk = state.blocksById[bid]
      if(blk?.parentId){
        const parent = nextById[blk.parentId]
        if(parent) nextById[blk.parentId] = { ...parent, children: parent.children.filter(c=>c!==bid) }
      }
      // if quiz, delete its answers
      if(blk?.children?.length){
        blk.children.forEach(cid=> delete nextById[cid])
      }
      delete nextById[bid]
      if(page){
        nextPages = state.pages.map(p=> p.id===page.id ? { ...p, blocks: p.blocks.filter(x=>x!==bid) } : p)
      }
      return { ...state, pages: nextPages, blocksById: nextById }
    }
    case 'DUPLICATE_BLOCK': {
      const src = state.blocksById[action.id]; if(!src) return state
      const copy = { ...deepClone(src), id:uid(), trackingId: trackId(src.type) }
      copy.children = []
      const extra={}
      if(src.children?.length){
        copy.children = src.children.map(cid=>{
          const c = state.blocksById[cid]; if(!c) return null
          const nc = { ...deepClone(c), id:uid(), parentId:copy.id, trackingId: trackId(c.type) }
          extra[nc.id]=nc; return nc.id
        }).filter(Boolean)
      }
      // insert after src if top-level
      const page = state.pages.find(p=>p.blocks.includes(action.id))
      if(page){
        const idx = page.blocks.indexOf(action.id)
        const blocks = [...page.blocks.slice(0,idx+1), copy.id, ...page.blocks.slice(idx+1)]
        return { ...state, pages: state.pages.map(p=> p.id===page.id ? { ...p, blocks } : p), blocksById:{ ...state.blocksById, [copy.id]:copy, ...extra } }
      }
      // child answer duplicate -> add to parent quiz
      if(src.parentId){
        const parent = state.blocksById[src.parentId]
        if(parent){
          const children = [...parent.children.slice(0, parent.children.indexOf(src.id)+1), copy.id, ...parent.children.slice(parent.children.indexOf(src.id)+1)]
          return { ...state, blocksById:{ ...state.blocksById, [copy.id]:{ ...copy, parentId: src.parentId }, [parent.id]:{ ...parent, children }, ...extra } }
        }
      }
      return { ...state, blocksById:{ ...state.blocksById, [copy.id]:copy, ...extra } }
    }
    case 'MOVE_BLOCK': {
      const { pageId, from, to } = action
      const page = state.pages.find(p=>p.id===pageId); if(!page) return state
      const arr = [...page.blocks]
      const [moved] = arr.splice(from,1)
      arr.splice(to,0,moved)
      return { ...state, pages: state.pages.map(p=> p.id===pageId ? { ...p, blocks: arr } : p) }
    }
    case 'UPDATE_PAGE_BACKGROUND': {
      return { ...state, pages: state.pages.map(p=> p.id===action.pageId ? { ...p, background: action.background } : p) }
    }
    case 'UPDATE_FUNNEL_BACKGROUND': {
      return { ...state, settings:{ ...state.settings, funnelBackground: action.background } }
    }
    case 'UPDATE_SETTINGS': {
      return { ...state, settings:{ ...state.settings, ...action.patch } }
    }
    case 'UPDATE_LEGAL': {
      return { ...state, settings:{ ...state.settings, legal:{ ...state.settings.legal, ...action.patch } } }
    }
    case 'UPDATE_MESSAGE_SEQUENCE': {
      return { ...state, messages: state.messages.map(m=> m.id===action.messageId ? { ...m, sequence: action.sequence } : m) }
    }
    default: return state
  }
}

const FunnelContext = createContext(null)
export const useFunnel = () => useContext(FunnelContext)

export function FunnelProvider({ children }){
  const [funnel, dispatch] = useReducer(funnelReducer, undefined, initialFunnel)
  const [past, setPast] = useReducer((s,a)=>{
    if(a.type==='PUSH') return [...s.slice(-49), a.snapshot]
    if(a.type==='POP') return s.slice(0,-1)
    if(a.type==='CLEAR') return []
    return s
  }, [])
  const [future, setFuture] = useReducer((s,a)=>{
    if(a.type==='PUSH') return [...s, a.snapshot]
    if(a.type==='POP') return s.slice(0,-1)
    if(a.type==='CLEAR') return []
    return s
  }, [])
  const [selectedPageId, setSelectedPageId] = useReducer((s,a)=>a??s, null)
  const [selectedBlockId, setSelectedBlockId] = useReducer((s,a)=> a===undefined? null : a, null)
  const [device, setDevice] = useReducer((s,a)=>a??s, 'mobile')
  const [published, setPublished] = useReducer((s,a)=>!s, false)
  const skipHistoryRef = useRef(false)
  const hydratedRef = useRef(false)
  const didReadUrlRef = useRef(false)

  // hydrate from localStorage + read deep link (do not overwrite saved data with initial)
  useEffect(()=>{
    try{
      const sp = new URLSearchParams(location.search)
      const urlPage = sp.get('pageId')
      const urlComp = sp.get('componentId')
      if(urlPage) { setSelectedPageId(urlPage); didReadUrlRef.current = true }
      if(urlComp) setSelectedBlockId(urlComp)
      const raw = localStorage.getItem('perspective:funnel:v3') || localStorage.getItem('perspective:funnel:v2')
      if(raw){
        let saved = JSON.parse(raw)
        // v4 migrations: fix phantom pages, invisible quiz, empty p3
        saved = migratePersisted(saved)
        dispatch({ type:'REHYDRATE', payload: saved })
        // if no url page, default to first page of saved funnel
        if(!urlPage && saved.pages?.[0]) setSelectedPageId(saved.pages[0].id)
      } else {
        // no saved data, default to p1 if no url
        if(!urlPage) setSelectedPageId('p1')
      }
    }catch{
      if(!didReadUrlRef.current) setSelectedPageId('p1')
    }
    // mark hydrated after a tick to allow REHYDRATE to flush
    const t = setTimeout(()=>{ hydratedRef.current = true }, 0)
    return ()=> clearTimeout(t)
  },[])
  // autosave only after hydration
  useEffect(()=>{
    if(!hydratedRef.current) return
    try{ localStorage.setItem('perspective:funnel:v3', JSON.stringify(funnel)) }catch{}
  },[funnel])
  // deep link write — only after initial read
  useEffect(()=>{
    if(!hydratedRef.current) return
    if(!selectedPageId) return
    const url = new URL(location.href)
    url.searchParams.set('pageId', selectedPageId)
    if(selectedBlockId) url.searchParams.set('componentId', selectedBlockId); else url.searchParams.delete('componentId')
    history.replaceState(null,'',url)
  },[selectedPageId, selectedBlockId])

  const dispatchWithHistory = useCallback((action)=>{
    const historyActions = new Set(['UPDATE_BLOCK','UPDATE_BLOCK_CONTENT','UPDATE_BLOCK_STYLE','ADD_BLOCK','DELETE_BLOCK','DUPLICATE_BLOCK','MOVE_BLOCK','ADD_PAGE','DELETE_PAGE','RENAME_PAGE','ADD_RESULT','DELETE_RESULT','UPDATE_RESULT','UPDATE_THEME','CREATE_THEME','FORK_THEME','DELETE_THEME','SET_FUNNEL_NAME','SET_THEME','UPSERT_BLOCKS','UPDATE_PAGE_BACKGROUND','UPDATE_FUNNEL_BACKGROUND','UPDATE_SETTINGS','UPDATE_LEGAL','UPDATE_MESSAGE_SEQUENCE'])
    if(historyActions.has(action.type) && !skipHistoryRef.current){
      setPast({ type:'PUSH', snapshot: deepClone(funnel) })
      setFuture({ type:'CLEAR' })
    }
    dispatch(action)
  },[funnel])

  const undo = useCallback(()=>{
    if(!past.length) return
    const prev = past[past.length-1]
    setFuture({ type:'PUSH', snapshot: deepClone(funnel) })
    setPast({ type:'POP' })
    skipHistoryRef.current=true
    dispatch({ type:'REHYDRATE', payload: prev })
    setTimeout(()=> skipHistoryRef.current=false,0)
  },[past,funnel])
  const redo = useCallback(()=>{
    if(!future.length) return
    const nxt = future[future.length-1]
    setPast({ type:'PUSH', snapshot: deepClone(funnel) })
    setFuture({ type:'POP' })
    skipHistoryRef.current=true
    dispatch({ type:'REHYDRATE', payload: nxt })
    setTimeout(()=> skipHistoryRef.current=false,0)
  },[future,funnel])

  useEffect(()=>{
    const onKey=(e)=>{
      const isEditable = e.target?.isContentEditable || e.target?.tagName==='INPUT' || e.target?.tagName==='TEXTAREA' || e.target?.tagName==='SELECT'
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='z'){
        if(isEditable) return
        e.preventDefault()
        if(e.shiftKey) redo(); else undo()
      }
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='d' && selectedBlockId){
        e.preventDefault()
        dispatchWithHistory({ type:'DUPLICATE_BLOCK', id:selectedBlockId })
      }
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='c' && selectedBlockId){
        // let native copy happen but also store to clipboard async
        try{
          const blk = funnel.blocksById[selectedBlockId]
          if(blk) navigator.clipboard.writeText(JSON.stringify(blk))
        }catch{}
      }
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='v'){
        if(isEditable) return
        // paste is handled in Canvas; prevent default to avoid double
      }
      if(e.key==='Escape'){
        setSelectedBlockId(null)
      }
      if((e.key==='Delete' || e.key==='Backspace') && selectedBlockId && !isEditable){
        e.preventDefault()
        dispatchWithHistory({ type:'DELETE_BLOCK', id:selectedBlockId })
        setSelectedBlockId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[undo,redo,selectedBlockId,dispatchWithHistory,funnel.blocksById])

  const value = useMemo(()=>({
    funnel, dispatch: dispatchWithHistory, rawDispatch: dispatch,
    selectedPageId, setSelectedPageId, selectedBlockId, setSelectedBlockId,
    device, setDevice, published, setPublished,
    undo, redo, canUndo: past.length>0, canRedo: future.length>0,
    makeBlock
  }),[funnel,dispatchWithHistory,selectedPageId,selectedBlockId,device,published,undo,redo,past.length,future.length])

  return <FunnelContext.Provider value={value}>{children}</FunnelContext.Provider>
}
