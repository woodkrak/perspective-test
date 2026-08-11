import { useState, useEffect, useRef } from 'react'
import { FunnelProvider, useFunnel, interpolateTokens, collectScoreAndTags, resolveResultId, createRobustDemoFunnel } from './store.jsx'
import { TrendingUp, Target, Heart, Users } from 'lucide-react'
import './App.css'

const LUCIDE_MAP = { 'trending-up': TrendingUp, 'target': Target, 'heart': Heart, 'users': Users }
function LucideIcon({ name, size=20 }){
  if(!name) return null
  const key = name.replace(/^lucide:/,'').toLowerCase()
  const Icon = LUCIDE_MAP[key]
  if(!Icon) return <span style={{fontSize:size,lineHeight:1}}>{name.replace(/^lucide:/,'')}</span>
  return <Icon size={size} strokeWidth={2} />
}

function SettingsModal({ onClose }){
  const { funnel, dispatch } = useFunnel()
  const [tab,setTab]=useState('general')
  const s = funnel.settings
  const patch = (p)=> {
    const next = JSON.parse(JSON.stringify(funnel))
    next.settings = { ...next.settings, ...p }
    dispatch({type:'REHYDRATE', payload: next})
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,15,15,.45)',backdropFilter:'blur(6px)',display:'grid',placeItems:'center',zIndex:80,padding:20,overflowY:'auto'}} onClick={onClose}>
      <div style={{width:'min(760px,100%)',background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 24px 48px rgba(0,0,0,.18)',display:'flex',minHeight:420,maxHeight:'calc(100vh - 40px)'}} onClick={e=>e.stopPropagation()}>
        <div style={{width:180,borderRight:'1px solid var(--line)',padding:16,display:'flex',flexDirection:'column',gap:6,background:'#fafaf8'}}>
          <div style={{fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700,marginBottom:6}}>Overview</div>
          {[
            ['general','General'],
            ['social','Social Preview'],
            ['progress','Progress Bar'],
            ['privacy','Cookie banner'],
            ['senders','Senders & WhatsApp'],
          ].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{textAlign:'left',padding:'8px 10px',borderRadius:8,border:'none',background: tab===id?'#111':'transparent',color: tab===id?'#fff':'var(--muted)',fontWeight:600,fontSize:13,cursor:'pointer'}}>{label}</button>
          ))}
        </div>
        <div style={{flex:1,padding:18,overflow:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <strong style={{fontSize:15}}>Funnel settings</strong>
            <button className="icon-btn" style={{width:32,height:32}} onClick={onClose}>✕</button>
          </div>
          {tab==='general' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <label style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>Funnel name / Quiz name</label>
              <input className="input" value={funnel.name} onChange={e=> dispatch({type:'SET_FUNNEL_NAME', name:e.target.value})} />
              <label style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>Brand name</label>
              <input className="input" value={s.brandName||''} onChange={e=> dispatch({type:'UPDATE_SETTINGS', patch:{brandName:e.target.value}})} placeholder="Acme" />
              <label style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>Category</label>
              <input className="input" value={s.category||''} onChange={e=> dispatch({type:'UPDATE_SETTINGS', patch:{category:e.target.value}})} placeholder="Growth" />
              <label style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>Subtitle</label>
              <input className="input" value={s.subtitle||''} onChange={e=> dispatch({type:'UPDATE_SETTINGS', patch:{subtitle:e.target.value}})} placeholder="Answer 4 quick questions…" />
              <label style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>Start CTA label</label>
              <input className="input" value={s.startCta||''} onChange={e=> dispatch({type:'UPDATE_SETTINGS', patch:{startCta:e.target.value}})} placeholder="Get my free audit" />
              <label style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>Favicon URL</label>
              <input className="input" value={s.favicon} onChange={e=> patch({favicon:e.target.value})} placeholder="https://..." />
              <label style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>Language</label>
              <select className="select" value={s.language} onChange={e=> patch({language:e.target.value})}><option value="en">English</option><option value="de">Deutsch</option><option value="fr">Français</option></select>
              <div style={{fontSize:12,color:'var(--muted)'}}>Funnel URL: <code>/{funnel.pages[0]?.slug || 'welcome'}</code></div>
              <div style={{height:1,background:'var(--line)',margin:'4px 0'}}/>
              <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700}}>Behavior</div>
              <label style={{display:'flex',gap:10,alignItems:'center',fontSize:13,fontWeight:500}}>
                <span className={`toggle ${s.autoAdvance?'on':''}`} onClick={()=> dispatch({type:'UPDATE_SETTINGS', patch:{autoAdvance: !s.autoAdvance}})}><i/></span>
                Auto-advance on choice (global)
              </label>
              {s.autoAdvance && (
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:11,color:'var(--muted)'}}>Delay</span>
                  <input className="slider" type="range" min={0} max={2000} step={100} value={s.autoAdvanceDelayMs||600} onChange={e=> dispatch({type:'UPDATE_SETTINGS', patch:{autoAdvanceDelayMs: Number(e.target.value)}})} style={{flex:1}} />
                  <span style={{fontSize:12,fontWeight:600,minWidth:48,textAlign:'right'}}>{s.autoAdvanceDelayMs||600}ms</span>
                </div>
              )}
            </div>
          )}
          {tab==='social' && (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <label style={{fontSize:12,fontWeight:600}}>Social title <span style={{color:'var(--faint)',fontWeight:400}}>&lt; 60 chars</span></label>
              <input className="input" value={s.socialTitle} onChange={e=> patch({socialTitle:e.target.value})} />
              <label style={{fontSize:12,fontWeight:600}}>Description</label>
              <textarea className="input" rows={3} value={s.socialDesc} onChange={e=> patch({socialDesc:e.target.value})} />
              <div style={{border:'1px solid var(--line)',borderRadius:12,overflow:'hidden',background:'#fff'}}>
                <div style={{height:120,background:`linear-gradient(135deg, #111 0%, #444 100%)`,display:'grid',placeItems:'center',color:'#fff',fontFamily:'Fraunces',fontSize:20,fontWeight:700}}>{s.socialTitle || 'Preview'}</div>
                <div style={{padding:10}}><div style={{fontWeight:600,fontSize:13}}>{s.socialTitle}</div><div style={{fontSize:12,color:'var(--muted)'}}>{s.socialDesc}</div><div style={{fontSize:11,color:'var(--faint)',marginTop:4}}>1200 × 630px · OG card preview</div></div>
              </div>
            </div>
          )}
          {tab==='progress' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',gap:12}}>
                {[
                  {id:'bar',label:'Bar',desc:'Thick bar at top'},
                  {id:'thin',label:'Thin',desc:'Hairline indicator'},
                  {id:'hidden',label:'Hidden',desc:'No progress indicator'},
                ].map(opt=>(
                  <button key={opt.id} onClick={()=> {
                    const isHidden = opt.id==='hidden'
                    dispatch({type:'UPDATE_SETTINGS', patch:{progressStyle: opt.id, progressBar: !isHidden}})
                  }} style={{flex:1,padding:14,borderRadius:12,border: (s.progressStyle|| (s.progressBar?'bar':'hidden'))===opt.id?'2px solid #111':'1px solid var(--line)',background: (s.progressStyle|| (s.progressBar?'bar':'hidden'))===opt.id?'#f5f4f1':'#fff',textAlign:'left',cursor:'pointer'}}>
                    <div style={{fontWeight:700,fontSize:13}}>{opt.label}</div><div style={{fontSize:12,color:'var(--muted)'}}>{opt.desc}</div>
                    {opt.id!=='hidden' && <div style={{height: opt.id==='thin'?2:4,background:'#efede9',borderRadius:99,marginTop:10,overflow:'hidden'}}><div style={{width:'66%',height:'100%',background:'#111'}}/></div>}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:'var(--faint)'}}>Legacy progressBar boolean maps to Bar/Hidden; new progressStyle adds Thin.</div>
            </div>
          )}
          {tab==='privacy' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <label style={{display:'flex',gap:10,alignItems:'center',fontSize:13,fontWeight:500}}>
                <span className={`toggle ${s.cookieBanner?'on':''}`} onClick={()=> dispatch({type:'UPDATE_SETTINGS', patch:{cookieBanner: !s.cookieBanner}})}><i/></span>
                Show cookie banner
              </label>
              <div style={{height:1,background:'var(--line)'}}/>
              <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700}}>Legal</div>
              <label style={{fontSize:12,fontWeight:600}}>Top banner text</label>
              <input className="input" value={s.legal?.bannerText||''} onChange={e=> dispatch({type:'UPDATE_LEGAL', patch:{bannerText:e.target.value}})} placeholder="Your data is safe…" />
              <label style={{fontSize:12,fontWeight:600}}>Footer disclaimer</label>
              <textarea className="input" rows={2} value={s.legal?.footerDisclaimer||''} onChange={e=> dispatch({type:'UPDATE_LEGAL', patch:{footerDisclaimer:e.target.value}})} placeholder="© 2026 Acme — All rights reserved" />
              <label style={{fontSize:12,fontWeight:600}}>Privacy URL</label>
              <input className="input" value={s.legal?.privacyUrl||''} onChange={e=> dispatch({type:'UPDATE_LEGAL', patch:{privacyUrl:e.target.value}})} placeholder="https://…/privacy" />
              <label style={{fontSize:12,fontWeight:600}}>Terms URL</label>
              <input className="input" value={s.legal?.termsUrl||''} onChange={e=> dispatch({type:'UPDATE_LEGAL', patch:{termsUrl:e.target.value}})} placeholder="https://…/terms" />
            </div>
          )}
          {tab==='senders' && <div style={{fontSize:13,color:'var(--muted)'}}>Senders & WhatsApp — connect your domain and WhatsApp Business account here. Demo placeholder.</div>}
        </div>
      </div>
    </div>
  )
}

function PreviewModal({ onClose }){
  const { funnel, selectedPageId } = useFunnel()
  const startIdx = Math.max(0, funnel.pages.findIndex(p=> p.id===selectedPageId))
  const [idx,setIdx]=useState(startIdx)
  const [answers,setAnswers]=useState({})
  const [resultId,setResultId]=useState(null)
  const [device,setDevice]=useState('mobile')
  const page = funnel.pages[idx]
  const theme = funnel.themes.find(t=>t.id===funnel.themeId) || funnel.themes[0]
  const deviceChrome = {
    mobile:  { label:'Phone', w:390, h:844, pad:10, radius:44 },
    tablet:  { label:'Tablet', w:834, h:1194, pad:14, radius:28 },
    desktop: { label:'Browser', w:1280, h:800, pad:0, radius:10 },
  }[device]
  const { w, h, pad, radius, label } = deviceChrome
  const outerW = w + pad*2
  const outerH = h + pad*2
  const [win,setWin]=useState({ w: typeof window!=='undefined'? window.innerWidth:1280, h: typeof window!=='undefined'? window.innerHeight:800 })
  useEffect(()=>{
    const onR=()=> setWin({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onR)
    return ()=> window.removeEventListener('resize', onR)
  },[])
  const scale = Math.min(1, (win.h - 140) / outerH, (win.w - 80) / outerW)
  const pageBg = resolveBg(page?.background, theme)
  const pageBgStyle = pageBg ? (pageBg.includes('gradient') ? { background: pageBg } : { background: pageBg }) : { background:'#fff' }
  // keep idx in sync if selectedPage changes while open? no, only on open
  const goNext = (overrideAnswers)=>{
    const effectiveAnswers = overrideAnswers || answers
    const blocks = (page?.blocks||[]).map(id=> funnel.blocksById[id]).filter(Boolean)
    const interactive = blocks.find(b=> b.linking)
    let target = { kind:'next' }
    if(interactive){
      const lk = interactive.linking
      if(lk.mode==='always') target = lk.always || {kind:'next'}
      else if(lk.mode==='rules'){
        const matched = (lk.rules||[]).find(r=> r.conditions.every(c=> String(effectiveAnswers[c.sourceTrackingId] ?? '') === String(c.value ?? '')))
        target = matched ? matched.target : (lk.fallback || {kind:'next'})
      }
    }
    // Priority 1-2: accumulate score/tags and resolve result via rules before linking
    const { score, tags } = collectScoreAndTags(funnel, effectiveAnswers)
    const session = { score, tags, lastResultRef: null }
    // capture last assigned resultRef from chosen answers
    const answeredQuiz = blocks.find(b=> b.type==='quiz')
    if(answeredQuiz){
      const chosen = effectiveAnswers[answeredQuiz.trackingId]
      if(chosen){
        const ansBlock = funnel.blocksById[chosen]
        if(ansBlock?.resultRef) session.lastResultRef = ansBlock.resultRef
      }
    }
    // if any collected score/tags, try result selection rules — only at terminal
    let ruleResultId = null
    let hasRuleHit = false
    if(score>0 || tags.length>0){
      ruleResultId = resolveResultId(funnel, session)
      hasRuleHit = (funnel.results||[]).some(r=> (r.selectionRules||[]).length>0 && resolveResultId({ ...funnel, results:[r] }, session)===r.id)
    }
    const isLastPage = idx===funnel.pages.length-1
    if(hasRuleHit && ruleResultId && (isLastPage || target.kind==='result')){
      setResultId(ruleResultId); return
    }
    // removed early per-answer resultRef jump — now terminal-only via session.lastResultRef
    if(target.kind==='next'){
      if(idx < funnel.pages.length-1) setIdx(i=>i+1)
      else {
        // terminal: prefer rule result if any
        const terminalId = ruleResultId || session.lastResultRef || funnel.results[0]?.id
        if(terminalId) setResultId(terminalId)
      }
    } else if(target.kind==='page'){
      const pi = funnel.pages.findIndex(p=>p.id===target.id)
      if(pi>=0) setIdx(pi)
    } else if(target.kind==='result'){
      setResultId(target.id)
    } else if(target.kind==='url'){
      window.open(target.href,'_blank')
    }
  }
  if(resultId){
    const r = funnel.results.find(x=>x.id===resultId)
    const { score, tags } = collectScoreAndTags(funnel, answers)
    const ctx = { score, brandName: funnel.settings.brandName, quizName: funnel.name, funnelName: funnel.name, firstName:'there', email:'' }
    // collect report blocks from chosen answers
    const reportBlocks = Object.values(answers).map(aid=>{
      const blk = funnel.blocksById[aid]
      if(!blk || blk.type!=='answer') return null
      if(!blk.reportHeadline && !blk.reportBody && !blk.insightUrl) return null
      return blk
    }).filter(Boolean)
    return (
      <div style={{position:'fixed',inset:0,background:'#fafaf8',zIndex:85,display:'grid',placeItems:'center',padding:24}} onClick={onClose}>
        <div style={{width:'min(520px,100%)',background:'#fff',border:'1px solid var(--line)',borderRadius:20,padding:24,boxShadow:'var(--shadow-lg)',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
          <div style={{width:56,height:56,borderRadius:99,background:theme.colors[2],color:'#fff',display:'grid',placeItems:'center',margin:'0 auto 12px',fontSize:22}}>✓</div>
          <div style={{fontFamily: theme.font,fontSize:26,fontWeight:700,letterSpacing:'-.02em'}}>{interpolateTokens(r?.name || 'Your result', ctx)}</div>
          <div style={{fontSize:14,color:'var(--muted)',marginTop:6}}>You're classified as <strong>{r?.letter}</strong> · Score <strong>{score}</strong>{tags.length? <> · Tags {tags.join(', ')}</>:null}</div>
          {reportBlocks.length>0 && (
            <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:12,textAlign:'left'}}>
              {reportBlocks.map(b=>(
                <div key={b.id} style={{border:'1px solid var(--line)',borderRadius:12,padding:14,background:'#fafaf8'}}>
                  {b.reportHeadline && <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{interpolateTokens(b.reportHeadline, ctx)}</div>}
                  {b.reportBody && <div style={{fontSize:13,color:'var(--muted)',whiteSpace:'pre-wrap'}}>{interpolateTokens(b.reportBody, ctx)}</div>}
                  {b.insightUrl && <a href={b.insightUrl} target="_blank" rel="noreferrer" style={{display:'inline-block',marginTop:8,fontSize:12,fontWeight:600,color:theme.colors[2]}}>{b.insightLabel||'Learn more'} →</a>}
                </div>
              ))}
            </div>
          )}
          <button className="publish-btn" style={{marginTop:16}} onClick={onClose}>Back to builder</button>
        </div>
      </div>
    )
  }
  const animClass = (!theme.disableAnimation && theme.transition && theme.transition!=='none') ? `page-anim pt-${theme.transition}` : ''
  const PreviewContent = (
    <>
      <div key={page?.id} className={animClass} style={{display:'flex',flexDirection:'column',gap:10,marginTop:4}}>
        {(page?.blocks||[]).map(bid=>{
          const b = funnel.blocksById[bid]; if(!b) return null
          const ctx = { brandName: funnel.settings.brandName, quizName: funnel.name, funnelName: funnel.name, score: collectScoreAndTags(funnel, answers).score, firstName:'there', email:'' }
          if(b.type==='text') return <div key={bid} style={{fontFamily: theme.bodyFont||theme.font, fontSize: b.style.size, fontWeight: b.style.bold?700:400, textAlign:b.style.align}} dangerouslySetInnerHTML={{__html: interpolateTokens(b.content, ctx)}} />
          if(b.type==='button') return <button key={bid} className="btn btn-filled" style={{fontFamily: theme.font, background:buttonBg(theme),alignSelf: b.style.align==='center'?'center':'stretch'}} onClick={goNext} dangerouslySetInnerHTML={{__html: interpolateTokens(b.content, ctx)}} />
          if(b.type==='image') return <div key={bid} className="img-wrap"><img src={b.content} alt="" /></div>
          if(b.type==='quiz') {
            const q = b
            const display = q.optionDisplay||'text'
            const handlePick = (cid)=>{
              let nextAnswers
              setAnswers(a=>{ nextAnswers = {...a,[q.trackingId]:cid}; return nextAnswers })
              const isSingle = (q.children||[]).length===1
              const auto = isSingle ? true : (q.autoAdvance ?? funnel.settings.autoAdvance)
              const delay = q.autoAdvanceDelayMs ?? funnel.settings.autoAdvanceDelayMs ?? 600
              if(auto){
                setTimeout(()=> {
                  // use the just-picked answers so scoring is up to date
                  const toUse = nextAnswers || {...answers, [q.trackingId]:cid}
                  goNext(toUse)
                }, delay)
              }
            }
            return (
              <div key={bid} className="quiz-wrap">
                <div style={{fontFamily: theme.font, fontWeight:700,marginBottom:10}} dangerouslySetInnerHTML={{__html: interpolateTokens(q.content?.question||'', ctx)}} />
                <div className="quiz-grid" style={{gridTemplateColumns: device==='mobile'?'1fr':'1fr 1fr'}}>
                  {(q.children||[]).map(cid=>{
                    const ans = funnel.blocksById[cid]
                    const icon = ans?.icon
                    const showIcon = display==='icon' && icon
                    const showImg = display==='image'
                    return <button key={cid} className={`answer-card ${answers[q.trackingId]===cid?'selected':''}`} onClick={()=> handlePick(cid)} style={{textAlign:'left', display:'flex',gap:8,alignItems:'center'}}>
                      {showIcon ? <span style={{width:36,height:36,borderRadius:8,background:'#f2f0ed',flexShrink:0,display:'grid',placeItems:'center'}}>{icon.startsWith('lucide:') ? <LucideIcon name={icon} size={18}/> : <span style={{fontSize:18}}>{icon}</span>}</span>
                       : showImg ? <span style={{width:36,height:36,borderRadius:8,background:'#f2f0ed',overflow:'hidden',flexShrink:0,display:'grid',placeItems:'center'}}><img src={`https://picsum.photos/seed/${cid}/80/80`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/></span>
                       : <span style={{width:36,height:36,borderRadius:8,background:'#f2f0ed',overflow:'hidden',flexShrink:0,display:'grid',placeItems:'center'}}><img src={`https://picsum.photos/seed/${cid}/80/80`} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity: showIcon||showImg?1:0.3}}/></span>}
                      <span style={{flex:1,fontFamily: theme.bodyFont||theme.font}}>{interpolateTokens(ans?.content||'', ctx)}</span>
                    </button>
                  })}
                </div>
                {q.autoAdvance && <div style={{fontSize:11,color:'var(--faint)',marginTop:6}}>Auto-advances in {q.autoAdvanceDelayMs}ms — toggle off in quiz settings</div>}
              </div>
            )
          }
          if(b.type==='form') {
            const fields=b.content?.fields || (b.content?.label ? [{id:'legacy', type:'email', label:b.content.label, placeholder:b.content.placeholder, helperText:'', required:true, options:[]}] : [])
            return <div key={bid} className="form-box" style={{display:'flex',flexDirection:'column',gap:10, background:'#fff',border:'1px solid var(--line)',borderRadius:12,padding:14}}>
              {b.content?.formTitle && <div style={{fontWeight:700,fontSize:14}}>{b.content.formTitle}</div>}
              {fields.map(f=>(
                <div key={f.id} style={{display:'flex',flexDirection:'column',gap:4}}>
                  {f.label ? <label style={{fontSize:12,fontWeight:600}}>{f.label}{f.required && <span style={{color:'#dc2626'}}> *</span>}</label> : null}
                  {f.type==='textarea' ? <textarea placeholder={f.placeholder} required={f.required} style={{border:'1px solid var(--line)',borderRadius:8,padding:'8px 10px',fontSize:13,minHeight:70}} />
                  : f.type==='select' ? <select required={f.required} style={{border:'1px solid var(--line)',borderRadius:8,padding:'8px 10px',fontSize:13}}><option value="">{f.placeholder||'Select…'}</option>{(f.options||[]).map((o,i)=><option key={i} value={o}>{o}</option>)}</select>
                  : f.type==='checkbox' ? <label style={{display:'flex',gap:6,alignItems:'center',fontSize:13}}><input type="checkbox" required={f.required}/> {f.label||f.placeholder}</label>
                  : f.type==='file' ? <input type="file" required={f.required} style={{fontSize:13}} />
                  : <input type={f.type==='phone'?'tel':f.type} placeholder={f.placeholder} required={f.required} style={{border:'1px solid var(--line)',borderRadius:8,padding:'8px 10px',fontSize:13}} />}
                  {f.helperText && <div style={{fontSize:11,color:'var(--muted)'}}>{f.helperText}</div>}
                </div>
              ))}
              <button className="btn btn-filled" style={{background:buttonBg(theme),alignSelf:'stretch'}} onClick={goNext}>{b.content?.submitLabel||'Continue'}</button>
            </div>
          }
          return null
        })}
        {page?.blocks?.length===0 && <div className="empty">Empty page — add blocks in the builder</div>}
      </div>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        {idx>0 && <button className="chip" onClick={()=>setIdx(i=>Math.max(0,i-1))}>← Back</button>}
        <button className="publish-btn" style={{marginLeft:'auto', background:buttonBg(theme)}} onClick={goNext}>{idx===funnel.pages.length-1?'See my result →':'Continue →'}</button>
      </div>
    </>
  )

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,15,15,.58)',backdropFilter:'blur(10px)',zIndex:85,display:'flex',flexDirection:'column',alignItems:'center',gap:14,padding:'18px 16px',overflow:'auto'}} onClick={onClose}>
      <div style={{display:'flex',alignItems:'center',gap:12,background:'#111',color:'#fff',padding:'8px 12px',borderRadius:99,boxShadow:'0 8px 24px rgba(0,0,0,.3)'}} onClick={e=>e.stopPropagation()}>
        <span style={{fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',fontWeight:700,opacity:.7,display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:6,height:6,borderRadius:99,background:'#4ade80',display:'inline-block'}}/> Preview — not recording
        </span>
        <span style={{width:1,height:18,background:'rgba(255,255,255,.15)'}}/>
        <div style={{display:'flex',background:'rgba(255,255,255,.12)',borderRadius:99,padding:3,gap:2}}>
          {[
            ['mobile','📱 Phone'],
            ['tablet','▭ Tablet'],
            ['desktop','▭ Browser'],
          ].map(([id,label])=>(
            <button key={id} onClick={()=>setDevice(id)} style={{padding:'6px 12px',borderRadius:99,border:'none',background: device===id?'#fff':'transparent',color: device===id?'#111':'rgba(255,255,255,.8)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{label}</button>
          ))}
        </div>
        <span style={{fontSize:11,opacity:.6,fontWeight:600}}>{label} · {w}px</span>
        <button onClick={onClose} style={{width:28,height:28,borderRadius:99,border:'1px solid rgba(255,255,255,.2)',background:'transparent',color:'#fff',display:'grid',placeItems:'center',cursor:'pointer',marginLeft:4}}>✕</button>
      </div>
      <div style={{fontSize:12,color:'rgba(255,255,255,.75)',fontWeight:500}}>Page {idx+1} of {funnel.pages.length} · {page?.name}</div>

      <div onClick={e=>e.stopPropagation()} style={{ width: outerW, height: outerH, transform: `scale(${scale})`, transformOrigin:'top center', transition:'all .32s cubic-bezier(.2,.8,.2,1)', filter:'drop-shadow(0 24px 48px rgba(0,0,0,.35))'}}>
        <div style={{ background: device==='desktop' ? '#fff' : '#0a0a0a', borderRadius: radius, padding: pad, boxSizing:'content-box', width: w, height: h, border: device==='desktop' ? '1px solid #d6d2cc' : 'none', overflow:'hidden' }}>
          <div style={{ width: w, height: h, ...pageBgStyle, borderRadius: Math.max(0, radius - pad), overflow:'hidden', position:'relative', display:'flex', flexDirection:'column' }}>
            {device==='mobile' && (
              <>
                <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:90,height:22,background:'#0a0a0a',borderRadius:'0 0 14px 14px',zIndex:2}}/>
                <div style={{height:28,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'24px 18px 0',fontSize:11,fontWeight:700,borderBottom:'1px solid #f2f0ed', flexShrink:0, boxSizing:'border-box'}}><span>9:41</span><span style={{display:'flex',gap:4}}><span>●●●</span><span style={{opacity:.5}}>◧</span></span></div>
              </>
            )}
            {device==='tablet' && (
              <div style={{height:22,background:'#f5f4f1',display:'flex',alignItems:'center',justifyContent:'center',gap:6,borderBottom:'1px solid #e8e6e1', flexShrink:0}}><span style={{width:32,height:4,background:'#d6d2cc',borderRadius:99}}/><span style={{width:6,height:6,borderRadius:99,background:'#111',opacity:.2}}/></div>
            )}
            {device==='desktop' && (
              <div style={{height:36,background:'#f5f4f1',display:'flex',alignItems:'center',gap:8,padding:'0 12px',borderBottom:'1px solid #e8e6e1', flexShrink:0}}>
                <span style={{display:'flex',gap:6}}><span style={{width:12,height:12,borderRadius:99,background:'#ff5f56'}}/><span style={{width:12,height:12,borderRadius:99,background:'#ffbd2e'}}/><span style={{width:12,height:12,borderRadius:99,background:'#27c93f'}}/></span>
                <span style={{flex:1,background:'#fff',border:'1px solid #e8e6e1',borderRadius:99,padding:'5px 12px',fontSize:12,color:'#6b6b6b',display:'flex',alignItems:'center',gap:6}}><span style={{opacity:.5}}>🔒</span> perspective.test/{page?.slug || 'welcome'}</span>
              </div>
            )}
            <div style={{height:4,background:'#efede9', flexShrink:0, borderRadius:99, overflow:'hidden', margin:'6px 10px 0'}}><div style={{width:`${Math.round(((idx+1)/funnel.pages.length)*100)}%`,height:'100%',background:theme.colors[2], borderRadius:99}} /></div>
            <div style={{flex:1, overflowY:'auto', padding: device==='mobile' ? '12px 16px 18px' : device==='tablet' ? '18px' : '22px', display:'flex', flexDirection:'column', gap:12}}>
              {device==='mobile' && <div style={{width:36,height:4,background:'#e8e6e1',borderRadius:99,margin:'0 auto 2px', flexShrink:0}}/>}
              {PreviewContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TopBar({ onOpenLibrary }){
  const { funnel, dispatch, published, setPublished, setSelectedPageId, setSelectedBlockId } = useFunnel()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(funnel.name)
  const [showSettings,setShowSettings]=useState(false)
  const [showPreview,setShowPreview]=useState(false)
  useEffect(()=> setNameDraft(funnel.name),[funnel.name])
  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div className="brand"><div className="brand-mark">P</div> Perspective</div>
          <div className="funnel-name">
            {editingName ? (
              <input autoFocus value={nameDraft} onChange={e=>setNameDraft(e.target.value)} onBlur={()=>{ dispatch({type:'SET_FUNNEL_NAME', name:nameDraft}); setEditingName(false)}} onKeyDown={e=>{ if(e.key==='Enter'){dispatch({type:'SET_FUNNEL_NAME', name:nameDraft}); setEditingName(false)}}} />
            ) : (
              <span onClick={()=>setEditingName(true)} style={{cursor:'pointer'}}>{funnel.name}</span>
            )}
            <span style={{color:'var(--faint)'}}>·</span>
            <span className="pill">{published ? 'Live' : 'Draft'}</span>
          </div>
          <div className="tabs">
            <button className="tab active">Funnel</button>
            <button className="tab">Metrics</button>
            <button className="tab">Contacts</button>
            <button className="tab">Apps</button>
          </div>
        </div>
        <div className="topbar-right">
          <button className="chip" title="Load robust 7-question demo (scoring, tags, icons, report, tokens)" onClick={()=>{
            if(!confirm('Load 7-question robust demo? This replaces the current funnel (undoable).')) return
            const demo = createRobustDemoFunnel()
            dispatch({type:'REHYDRATE', payload: demo})
            setSelectedPageId(demo.pages[0].id)
            setSelectedBlockId(null)
          }} style={{background:'#fff7ed',borderColor:'#fdba74',color:'#9a3412',fontWeight:700,borderRadius:99,padding:'6px 12px',fontSize:12,cursor:'pointer'}}>✦ 7Q Demo</button>
          <button className="icon-btn" title="Preview funnel without recording data" onClick={()=>setShowPreview(true)} style={{width:'auto',height:36,borderRadius:99,display:'flex',alignItems:'center',gap:6,padding:'0 14px',fontSize:13,fontWeight:600,background:'#111',color:'#fff',borderColor:'#111'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview
          </button>
          <button className="icon-btn" title="Funnel settings" onClick={()=>setShowSettings(true)} style={{width:'auto',height:36,borderRadius:99,display:'flex',alignItems:'center',gap:6,padding:'0 14px',fontSize:13,fontWeight:600,background:'#fff',color:'#111',border:'1px solid var(--line)'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
            Settings
          </button>
          <button className="publish-btn" onClick={()=>setPublished()}>{published ? 'Unpublish' : 'Publish'}</button>
        </div>
      </div>
      {showSettings && <SettingsModal onClose={()=>setShowSettings(false)} />}
      {showPreview && <PreviewModal onClose={()=>setShowPreview(false)} />}
    </>
  )
}

const SIZE_RAMP = [14,16,18,20,24,30,40,48,64]
const SIZE_PRESETS = { S:16, M:20, L:24, XL:30 }

function SizeStepper({ value, onChange }){
  const isPreset = Object.values(SIZE_PRESETS).includes(value)
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="size-stepper">
        {Object.entries(SIZE_PRESETS).map(([k,v])=>(
          <button key={k} className={`chip ${value===v?'active':''}`} onClick={()=>onChange(v)}>{k}</button>
        ))}
        <button className={`chip ${!isPreset?'active':''}`} onClick={()=>setOpen(!open)}>•••</button>
      </div>
      {open && (
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
          {SIZE_RAMP.map(n=>(
            <button key={n} className={`chip ${value===n?'active':''}`} onClick={()=>onChange(n)}>{n}</button>
          ))}
        </div>
      )}
      <div style={{fontSize:11,color:'var(--faint)',marginTop:6}}>{value}px</div>
    </div>
  )
}

function ColorPicker({ value, onChange, themeColors }){
  const [tab,setTab]=useState('palette')
  const hex = value?.kind==='solid' ? value.hex : themeColors[0]
  const tokenSlot = value?.kind==='token' ? value.slot : null
  return (
    <div className="picker">
      <div className="picker-tabs">
        <button className={tab==='palette'?'active':''} onClick={()=>setTab('palette')}>Palette</button>
        <button className={tab==='solid'?'active':''} onClick={()=>setTab('solid')}>Solid</button>
        <button className={tab==='gradient'?'active':''} onClick={()=>setTab('gradient')}>Gradient</button>
      </div>
      {tab==='palette' && (
        <div>
          <div className="color-row">
            <button className={`swatch ${tokenSlot===0?'active':''}`} style={{background:'transparent', border:'1px dashed #aaa', position:'relative'}} onClick={()=>onChange({kind:'token', slot:0})} title="Transparent">
              <span style={{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:10}}>∅</span>
            </button>
            {themeColors.map((c,i)=>(
              <button key={i} className={`swatch ${tokenSlot===i+1?'active':''}`} style={{background:c}} onClick={()=>onChange({kind:'token', slot:i+1})} title={`Theme ${i+1} ${c}`} />
            ))}
          </div>
          {tokenSlot===0 && <div style={{fontSize:11, color:'var(--faint)', marginTop:6}}>Transparent</div>}
          {tokenSlot>0 && <div style={{fontSize:11, color:'var(--faint)', marginTop:6}}>Using theme color {tokenSlot}</div>}
        </div>
      )}
      {tab==='solid' && (
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input type="color" value={hex.startsWith('#')?hex:'#000000'} onChange={e=>onChange({kind:'solid', hex:e.target.value})} style={{width:36,height:36,padding:0,border:'none',borderRadius:8}} />
          <input className="input" value={hex} onChange={e=>onChange({kind:'solid', hex:e.target.value})} placeholder="#000000" />
        </div>
      )}
      {tab==='gradient' && (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="color" value={value?.kind==='gradient' ? (value.from||themeColors[0]) : themeColors[0]} onChange={e=>onChange({kind:'gradient', from:e.target.value, to: value?.to||themeColors[2], angle: value?.angle||90})} style={{width:36,height:36,padding:0,border:'none',borderRadius:8}}/>
            <span style={{fontSize:12}}>→</span>
            <input type="color" value={value?.kind==='gradient' ? (value.to||themeColors[2]) : themeColors[2]} onChange={e=>onChange({kind:'gradient', from: value?.from||themeColors[0], to:e.target.value, angle: value?.angle||90})} style={{width:36,height:36,padding:0,border:'none',borderRadius:8}}/>
            <div style={{flex:1,height:32,borderRadius:8,border:'1px solid var(--line)', background: value?.kind==='gradient' ? `linear-gradient(${value.angle||90}deg, ${value.from}, ${value.to})` : `linear-gradient(90deg, ${themeColors[0]}, ${themeColors[2]})`}} />
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--muted)'}}>Angle</span>
            <input type="range" min={0} max={360} value={value?.angle||90} onChange={e=>onChange({kind:'gradient', from: value?.from||themeColors[0], to: value?.to||themeColors[2], angle: Number(e.target.value)})} style={{flex:1}}/>
            <span style={{fontSize:11}}>{value?.angle||90}°</span>
          </div>
          <button className="chip" style={{alignSelf:'flex-start'}} onClick={()=>onChange({kind:'gradient', from: themeColors[0], to: themeColors[2], angle:90})}>Use gradient</button>
        </div>
      )}
    </div>
  )
}

function resolveColor(ref, theme){
  if(!ref) return 'transparent'
  if(ref.kind==='solid') return ref.hex || 'transparent'
  if(ref.kind==='token'){
    if(ref.slot===0) return 'transparent'
    return theme.colors[ref.slot-1] || 'transparent'
  }
  if(ref.kind==='gradient' && ref.from && ref.to) return `linear-gradient(${ref.angle||90}deg, ${ref.from}, ${ref.to})`
  return 'transparent'
}
function resolveBg(ref, theme){
  if(!ref) return null
  if(ref.kind==='token' && ref.slot===0) return null
  const v = resolveColor(ref, theme)
  if(v==='transparent') return null
  return v
}
function buttonBg(theme){
  const c = (theme.colors[1] || '#111').toLowerCase()
  if(c === '#0f0f0f' || c === '#111111' || c === '#0a0a0a' || c === '#000000') return '#4a4a4a'
  return c
}

function LeftRail({ onRequestAdd }){
  const { funnel, dispatch, selectedBlockId, setSelectedBlockId, selectedPageId, setSelectedPageId, makeBlock } = useFunnel()
  const [mode,setMode]=useState('overview')
  const [railMode,setRailMode]=useState('default')
  const [addCategory,setAddCategory]=useState(null)
  const [editingPageId,setEditingPageId]=useState(null)
  const [pageNameDraft,setPageNameDraft]=useState('')
  const [themeEditingId,setThemeEditingId]=useState(null)
  useEffect(()=>{
    const h=()=>{ setRailMode('add'); setAddCategory(null); setMode('overview') }
    window.addEventListener('open-library', h)
    return ()=> window.removeEventListener('open-library', h)
  },[])
  const [openMenuPage,setOpenMenuPage]=useState(null)
  const selectedBlock = selectedBlockId ? funnel.blocksById[selectedBlockId] : null
  const theme = funnel.themes.find(t=>t.id===funnel.themeId) || funnel.themes[0]
  const lastSwapRef = useRef(0)
  useEffect(()=>{
    if(selectedBlock){
      setMode('design')
      setRailMode('default')
      lastSwapRef.current = Date.now()
    }
  },[selectedBlockId])
  const guardedSetPage = (id)=>{
    if(Date.now()-lastSwapRef.current < 150) return
    setSelectedPageId(id)
  }

  if(railMode==='add'){
    return (
      <div className="rail">
        <div className="rail-head">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <strong style={{fontSize:13}}>Add block</strong>
            <button className="icon-btn" style={{width:28,height:28}} onClick={()=>{setRailMode('default'); setAddCategory(null)}}>✕</button>
          </div>
          {!addCategory ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button className="section-card" onClick={()=>setAddCategory('basic')}>Basic blocks →</button>
              <button className="section-card" onClick={()=>setAddCategory('interactive')}>Interactive blocks →</button>
              <button className="section-card" onClick={()=>setAddCategory('sections')}>Sections →</button>
            </div>
          ) : (
            <button className="chip" onClick={()=>setAddCategory(null)}>← Back</button>
          )}
        </div>
        <div className="rail-body">
          {!addCategory && <div className="empty">Choose a category above</div>}
          {addCategory==='basic' && (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700}}>Core Components</div>
              <div className="library-grid">
                {[
                  {type:'text',label:'Text',icon:'T'},
                  {type:'button',label:'Button',icon:'▭'},
                  {type:'image',label:'Image',icon:'🖼'},
                  {type:'list',label:'List',icon:'≡'},
                  {type:'divider',label:'Divider',icon:'—'},
                  {type:'logo',label:'Logo Bar',icon:'⬢'},
                  {type:'reviews',label:'Reviews',icon:'★'},
                  {type:'ai',label:'AI Block',icon:'✦', beta:true},
                ].map(b=>(
                  <button key={b.label} className="lib-tile" onClick={()=>{
                    const typeMap={ 'Logo Bar':'logo', 'Reviews':'reviews', 'AI Block':'text'}
                    const t = typeMap[b.label] || b.type
                    const blk = makeBlock(t, b.label==='AI Block'? {content:'AI-generated block — describe your section'}: {})
                    onRequestAdd(blk, null)
                  }}>
                    <span className="box">{b.icon}{b.beta && <span style={{fontSize:8,background:'#fff',color:'#4a4a4a',padding:'1px 4px',borderRadius:99,marginLeft:4,border:'1px solid var(--line)'}}>Beta</span>}</span>{b.label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700,marginTop:4}}>Media Elements</div>
              <div className="library-grid">
                {[
                  {type:'video',label:'Video',icon:'▶'},
                  {type:'testimonial',label:'Testimonial',icon:'💬'},
                  {type:'slider',label:'Slider',icon:'◫'},
                  {type:'graphic',label:'Graphic',icon:'⬣'},
                ].map(b=>(
                  <button key={b.label} className="lib-tile" onClick={()=> onRequestAdd(makeBlock(b.type), null)}>
                    <span className="box">{b.icon}</span>{b.label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700,marginTop:4}}>Informative Blocks</div>
              <div className="library-grid">
                {[
                  {type:'webinar',label:'Webinar',icon:'🎥'},
                  {type:'faq',label:'FAQ',icon:'?'},
                  {type:'countdown',label:'Countdown',icon:'⏳'},
                  {type:'loader',label:'Loader',icon:'◌'},
                ].map(b=>(
                  <button key={b.label} className="lib-tile" onClick={()=> onRequestAdd(makeBlock(b.type), null)}>
                    <span className="box">{b.icon}</span>{b.label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700,marginTop:4}}>Embed Blocks</div>
              <div className="library-grid">
                {[
                  {type:'kununu',label:'Kununu',icon:'K'},
                  {type:'trustpilot',label:'Trustpilot',icon:'T'},
                  {type:'proven',label:'Proven Expert',icon:'P'},
                  {type:'maps',label:'Google Maps',icon:'📍'},
                  {type:'html',label:'HTML',icon:'</>'},
                ].map(b=>(
                  <button key={b.label} className="lib-tile" onClick={()=> onRequestAdd(makeBlock('embed', {content:{provider:b.label, url:'https://example.com'}}), null)}>
                    <span className="box">{b.icon}</span>{b.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {addCategory==='interactive' && (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700}}>Questions</div>
              <div className="library-grid">
                {[
                  {type:'multiple',label:'Multiple-Choice',icon:'☑'},
                  {type:'choice',label:'Choice',icon:'○'},
                  {type:'quiz',label:'Quiz',icon:'?'},
                  {type:'videoq',label:'Video question',icon:'🎬'},
                ].map(b=>(
                  <button key={b.label} className="lib-tile" onClick={()=>{
                    if(b.type==='quiz' || b.type==='multiple' || b.type==='choice'){
                      const q = makeBlock('quiz', { children: [] })
                      const answers = ['Option A','Option B','Option C','Option D'].map(t=>{
                        const a = makeBlock('answer', { content:t })
                        a.parentId=q.id
                        return a
                      })
                      q.children = answers.map(a=>a.id)
                      const extra={}; answers.forEach(a=> extra[a.id]=a)
                      q._extra = extra
                      onRequestAdd(q, extra)
                    } else {
                      onRequestAdd(makeBlock('video'), null)
                    }
                  }}>
                    <span className="box">{b.icon}</span>{b.label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700,marginTop:4}}>Forms</div>
              <div className="library-grid">
                {[
                  {type:'form',label:'Form',icon:'✉'},
                  {type:'appointment',label:'Appointment',icon:'📅'},
                  {type:'upload',label:'Upload',icon:'⬆'},
                  {type:'message',label:'Message',icon:'💬'},
                  {type:'date',label:'Date',icon:'📆'},
                  {type:'dropdown',label:'Dropdown',icon:'▼'},
                  {type:'payment',label:'Payment',icon:'€'},
                ].map(b=>(
                  <button key={b.label} className="lib-tile" onClick={()=>{
                    const uid2=()=>Math.random().toString(36).slice(2,7)
                    if(b.type==='form') onRequestAdd(makeBlock('form'), null)
                    else if(b.type==='appointment') onRequestAdd(makeBlock('form', {content:{formTitle:'Book an appointment', submitLabel:'Schedule', fields:[
                      {id:uid2(), type:'text', label:'Name', placeholder:'Alex', helperText:'', required:true, options:[]},
                      {id:uid2(), type:'email', label:'Email', placeholder:'you@company.com', helperText:'', required:true, options:[]},
                      {id:uid2(), type:'date', label:'Preferred date', placeholder:'', helperText:'', required:true, options:[]},
                      {id:uid2(), type:'select', label:'Time', placeholder:'Select time', helperText:'', required:false, options:['09:00','11:00','14:00','16:00']},
                    ]}}), null)
                    else if(b.type==='upload') onRequestAdd(makeBlock('form', {content:{formTitle:'Upload file', submitLabel:'Upload', fields:[
                      {id:uid2(), type:'file', label:'File', placeholder:'', helperText:'Max 10MB — pdf, png, jpg', required:true, options:[]},
                      {id:uid2(), type:'text', label:'Description', placeholder:'What is this file?', helperText:'', required:false, options:[]},
                    ]}}), null)
                    else if(b.type==='message') onRequestAdd(makeBlock('form', {content:{formTitle:'Send a message', submitLabel:'Send', fields:[
                      {id:uid2(), type:'text', label:'Name', placeholder:'Alex', helperText:'', required:false, options:[]},
                      {id:uid2(), type:'email', label:'Email', placeholder:'you@company.com', helperText:'', required:true, options:[]},
                      {id:uid2(), type:'textarea', label:'Message', placeholder:'Your message…', helperText:'We’ll reply within 24h', required:true, options:[]},
                    ]}}), null)
                    else if(b.type==='date') onRequestAdd(makeBlock('form', {content:{formTitle:'Pick a date', submitLabel:'Confirm', fields:[
                      {id:uid2(), type:'date', label:'Date', placeholder:'', helperText:'', required:true, options:[]},
                    ]}}), null)
                    else if(b.type==='dropdown') onRequestAdd(makeBlock('form', {content:{formTitle:'Choose an option', submitLabel:'Continue', fields:[
                      {id:uid2(), type:'select', label:'Options', placeholder:'Select…', helperText:'', required:true, options:['Option A','Option B','Option C']},
                    ]}}), null)
                    else if(b.type==='payment') onRequestAdd(makeBlock('form', {content:{formTitle:'Payment', submitLabel:'Pay now', fields:[
                      {id:uid2(), type:'text', label:'Card number', placeholder:'4242 4242 4242 4242', helperText:'', required:true, options:[]},
                      {id:uid2(), type:'text', label:'Expiry', placeholder:'MM / YY', helperText:'', required:true, options:[]},
                      {id:uid2(), type:'text', label:'CVC', placeholder:'123', helperText:'', required:true, options:[]},
                    ]}}), null)
                    else onRequestAdd(makeBlock('form', {content:{formTitle:b.label, submitLabel:'Continue', fields:[{id:uid2(), type:'text', label:b.label, placeholder:b.label, helperText:'', required:false, options:[]}]}}), null)
                  }}>
                    <span className="box">{b.icon}</span>{b.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {addCategory==='sections' && (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                {name:'Hero', blocks:['text','button','image']},
                {name:'Product', blocks:['image','text','list','button']},
                {name:'Call to action', blocks:['text','button']},
                {name:'About us', blocks:['text','image','list']},
                {name:'Quiz', blocks:['quiz']},
                {name:'Team', blocks:['image','text','text']},
                {name:'Testimonials', blocks:['text','list']},
                {name:'Trust', blocks:['image','list']},
              ].map(s=>(
                <button key={s.name} className="section-card" onClick={()=>{
                  const sectionBlocks = []
                  s.blocks.forEach(t=>{
                    if(t==='quiz'){
                      const q = makeBlock('quiz'); const ans = [1,2,3,4].map(()=>{ const a=makeBlock('answer'); a.parentId=q.id; return a })
                      q.children=ans.map(a=>a.id); const extra={}; ans.forEach(a=> extra[a.id]=a); q._extra=extra
                      sectionBlocks.push(q)
                    } else {
                      sectionBlocks.push(makeBlock(t))
                    }
                  })
                  onRequestAdd(sectionBlocks, null)
                }}>
                  <strong style={{fontSize:13}}>{s.name}</strong>
                  <div style={{fontSize:11,color:'var(--muted)'}}>{s.blocks.join(' · ')}</div>
                  <div style={{height:64,background:'#fff',border:'1px solid var(--line)',borderRadius:8,marginTop:6,padding:6,display:'flex',flexDirection:'column',gap:4,overflow:'hidden'}}>
                    {s.blocks.slice(0,3).map((b,i)=>(
                      <div key={i} style={{height: b==='image'? 22: 8, background: b==='image'? '#f5f4f1' : i===0?'#111':'#e8e6e1', borderRadius:4, opacity: b==='image'?1:0.9}} />
                    ))}
                    <div style={{fontSize:8,color:'var(--faint)',textAlign:'center',marginTop:'auto'}}>Live section preview</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if(railMode==='themeEdit'){
    const t = funnel.themes.find(x=>x.id===themeEditingId) || theme
    return (
      <div className="rail">
        <div className="rail-head">
          <button className="chip" onClick={()=>setRailMode('default')}>← Back to Overview</button>
          <strong style={{fontSize:14}}>{t.name}</strong>
        </div>
        <div className="rail-body">
          <div className="panel">
            <div className="control-row">
              <div className="control-label">Name</div>
              <input className="input" value={t.name} onChange={e=>dispatch({type:'UPDATE_THEME', id:t.id, patch:{name:e.target.value}})} />
            </div>
            <div className="control-row">
              <div className="control-label">Headline font</div>
              <select className="select" value={t.font} onChange={e=>dispatch({type:'UPDATE_THEME', id:t.id, patch:{font:e.target.value}})}>
                <optgroup label="Sans — most popular">
                  <option>Inter</option>
                  <option>DM Sans</option>
                  <option>Outfit</option>
                  <option>Space Grotesk</option>
                  <option>Plus Jakarta Sans</option>
                  <option>Sora</option>
                </optgroup>
                <optgroup label="Serif — editorial">
                  <option>Fraunces</option>
                  <option>Playfair Display</option>
                  <option>Newsreader</option>
                  <option>Cormorant Garamond</option>
                  <option>Instrument Serif</option>
                  <option>Libre Baskerville</option>
                </optgroup>
                <optgroup label="Whimsical / Display">
                  <option>Caveat</option>
                  <option>Pacifico</option>
                  <option>Fredoka</option>
                  <option>Bricolage Grotesque</option>
                </optgroup>
                <optgroup label="Mono">
                  <option>JetBrains Mono</option>
                </optgroup>
              </select>
            </div>
            <div className="control-row">
              <div className="control-label">Body font <span style={{fontWeight:400,color:'var(--faint)'}}>(optional — defaults to headline)</span></div>
              <select className="select" value={t.bodyFont||t.font} onChange={e=>dispatch({type:'UPDATE_THEME', id:t.id, patch:{bodyFont:e.target.value}})}>
                <optgroup label="Sans — most popular">
                  <option>Inter</option>
                  <option>DM Sans</option>
                  <option>Outfit</option>
                  <option>Space Grotesk</option>
                  <option>Plus Jakarta Sans</option>
                  <option>Sora</option>
                </optgroup>
                <optgroup label="Serif — editorial">
                  <option>Fraunces</option>
                  <option>Playfair Display</option>
                  <option>Newsreader</option>
                  <option>Cormorant Garamond</option>
                  <option>Instrument Serif</option>
                  <option>Libre Baskerville</option>
                </optgroup>
                <optgroup label="Whimsical / Display">
                  <option>Caveat</option>
                  <option>Pacifico</option>
                  <option>Fredoka</option>
                  <option>Bricolage Grotesque</option>
                </optgroup>
                <optgroup label="Mono">
                  <option>JetBrains Mono</option>
                </optgroup>
              </select>
            </div>
            <div className="control-row">
              <div className="control-label">Colors (4 slots)</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {t.colors.map((c,i)=>(
                  <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input type="color" value={c} onChange={e=>{
                      const nc=[...t.colors]; nc[i]=e.target.value; dispatch({type:'UPDATE_THEME', id:t.id, patch:{colors:nc}})
                    }} style={{width:36,height:36,border:'none',borderRadius:8,padding:0}} />
                    <input className="input" value={c} onChange={e=> dispatch({type:'UPDATE_THEME', id:t.id, patch:{colors: t.colors.map((col,idx)=> idx===i ? e.target.value : col)}})} />
                    <span style={{fontSize:11,color:'var(--faint)'}}>Slot {i+1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="control-row">
              <div className="control-label">Rounded corners</div>
              <div className="size-stepper">
                {[1,2,3,4].map(n=>(
                  <button key={n} className={`chip ${t.radius===n?'active':''}`} onClick={()=>dispatch({type:'UPDATE_THEME', id:t.id, patch:{radius:n}})}>{n}</button>
                ))}
              </div>
            </div>
            <div className="control-row">
              <div className="control-label">Page transition</div>
              <select className="select" value={t.transition} onChange={e=>dispatch({type:'UPDATE_THEME', id:t.id, patch:{transition:e.target.value}})}>
                <option value="none">None</option><option value="fade">Fade</option><option value="slide">Slide</option><option value="slide-up">Slide Up</option><option value="scale">Scale</option><option value="flip">Flip</option>
              </select>
              <div style={{fontSize:11,color:'var(--muted)'}}>Animates how pages arrive/leave in builder + Preview</div>
            </div>
            <label className="row" style={{gap:10, fontSize:13, fontWeight:500}}>
              <span className={`toggle ${t.disableAnimation?'on':''}`} onClick={()=>dispatch({type:'UPDATE_THEME', id:t.id, patch:{disableAnimation:!t.disableAnimation}})}><i/></span>
              Disable animation on page load
            </label>
            <div style={{background:'#efede9',borderRadius:12,padding:12,display:'flex',flexDirection:'column',gap:8}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--muted)'}}>Skeleton preview</div>
              <div className="skeleton" style={{width:'70%'}}/>
              <div className="skeleton w2"/><div className="skeleton w3"/>
              <div style={{height:56,background:'#fff',borderRadius:8,border:'1px solid var(--line)'}}/>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rail">
      <div className="rail-head">
        <div className="seg">
          <button className={mode==='overview'?'active':''} onClick={()=>setMode('overview')}>Overview</button>
          <button className={mode==='design'?'active':''} onClick={()=>setMode('design')}>Design</button>
        </div>
      </div>
      <div className="rail-body">
        {mode==='overview' ? (
          <>
            <div>
              <div className="panel-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>Pages</span>
                <button className="chip" onClick={()=>dispatch({type:'ADD_PAGE'})}>+ Add page</button>
              </div>
              <div className="tree" style={{marginTop:8}}>
                {funnel.pages.map(p=>(
                  <div key={p.id} style={{display:'flex',gap:6,alignItems:'center', position:'relative'}}>
                    <button className={`tree-item ${selectedPageId===p.id?'active':''}`} onClick={()=>guardedSetPage(p.id)} style={{flex:1}}>
                      <span className="num">{p.index}</span>
                      {editingPageId===p.id ? (
                        <input autoFocus className="input" style={{padding:'4px 8px',fontSize:13}} value={pageNameDraft} onChange={e=>setPageNameDraft(e.target.value)} onBlur={()=>{
                          dispatch({type:'RENAME_PAGE', id:p.id, name:pageNameDraft}); setEditingPageId(null)
                        }} onKeyDown={e=>{ if(e.key==='Enter'){dispatch({type:'RENAME_PAGE', id:p.id, name:pageNameDraft}); setEditingPageId(null)}}} />
                      ) : (
                        <span style={{fontSize:13,fontWeight:600}}>{p.name}</span>
                      )}
                      {p.confetti && <span>🎉</span>}
                    </button>
                    <button title="More" style={{border:'none',background:'#f2f0ed',width:28,height:28,borderRadius:99,display:'grid',placeItems:'center',cursor:'pointer',fontSize:14, flexShrink:0}} onClick={()=> setOpenMenuPage(openMenuPage===p.id?null:p.id)}>⋯</button>
                    {openMenuPage===p.id && (
                      <div className="page-menu" onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>{ setEditingPageId(p.id); setPageNameDraft(p.name); setOpenMenuPage(null)}}>Rename page</button>
                        <button onClick={()=>{ dispatch({type:'DUPLICATE_PAGE', id:p.id}); setOpenMenuPage(null)}}>Duplicate</button>
                        <button onClick={()=>{ alert('Automatic redirect — URL: /'+p.slug+' → configure in settings'); setOpenMenuPage(null)}}>Automatic redirect</button>
                        <button onClick={()=>{ alert('Create A/B test — duplicate page as variant'); dispatch({type:'DUPLICATE_PAGE', id:p.id}); setOpenMenuPage(null)}}>Create A/B test</button>
                        <button onClick={()=>{ const s=prompt('Edit URL slug', p.slug); if(s) dispatch({type:'RENAME_PAGE', id:p.id, name:p.name}); setOpenMenuPage(null)}}>Edit URL</button>
                        <button onClick={()=>{ navigator.clipboard.writeText(JSON.stringify(p)); setOpenMenuPage(null)}}>Copy to funnel</button>
                        <button onClick={()=>{ const c=prompt('Tracking code (head)', p.trackingCode||''); if(c!==null){ const next=JSON.parse(JSON.stringify(funnel)); const pg=next.pages.find(x=>x.id===p.id); if(pg) pg.trackingCode=c; dispatch({type:'REHYDRATE', payload:next}) } setOpenMenuPage(null)}}>Tracking code</button>
                        <button onClick={()=>{ const next=JSON.parse(JSON.stringify(funnel)); const pg=next.pages.find(x=>x.id===p.id); if(pg) pg.confetti=!pg.confetti; dispatch({type:'REHYDRATE', payload:next}); setOpenMenuPage(null)}} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span>{p.confetti?'Disable confetti':'Confetti'}</span><span className={`toggle ${p.confetti?'on':''}`} style={{width:28,height:18, pointerEvents:'none'}}><i style={{width:14,height:14}}/></span></button>
                        <button className="danger" onClick={()=>{ if(confirm(`Delete "${p.name}"?`)) dispatch({type:'DELETE_PAGE', id:p.id}); setOpenMenuPage(null)}}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {openMenuPage && <div style={{position:'fixed',inset:0,zIndex:5}} onClick={()=>setOpenMenuPage(null)} />}
            </div>

            <div>
              <div className="panel-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>Results</span>
                <button className="chip" onClick={()=>dispatch({type:'ADD_RESULT'})}>+ Add result</button>
              </div>
              <div className="tree" style={{marginTop:8}}>
                {funnel.results.map(r=>(
                  <ResultRow key={r.id} result={r} funnel={funnel} />
                ))}
              </div>
            </div>

            <div>
              <div className="panel-title">Messages</div>
              <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:8}}>
                {funnel.messages.map(m=>(
                  <MessageCard key={m.id} message={m} />
                ))}
                <div className="empty">Create sequence — messages reuse the same block editor model</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {!selectedBlock ? (
              <div className="panel">
                {funnel.pages.find(p=>p.id===selectedPageId) && (
                  <>
                    <div className="control-row">
                      <div className="control-label">Page background — {funnel.pages.find(p=>p.id===selectedPageId)?.name} (entire page)</div>
                      <ColorPicker value={funnel.pages.find(p=>p.id===selectedPageId)?.background} onChange={v=>dispatch({type:'UPDATE_PAGE_BACKGROUND', pageId:selectedPageId, background:v})} themeColors={theme.colors} />
                      <div style={{fontSize:11,color:'var(--faint)'}}>Solid or gradient — fills the whole page behind blocks</div>
                    </div>
                    <div className="control-row">
                      <div className="control-label">Funnel background (entire funnel, behind page)</div>
                      <ColorPicker value={funnel.settings.funnelBackground} onChange={v=>dispatch({type:'UPDATE_FUNNEL_BACKGROUND', background:v})} themeColors={theme.colors} />
                    </div>
                    <div style={{height:1,background:'var(--line)',margin:'4px 0'}}/>
                  </>
                )}
                <div className="panel-title">Your themes</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {funnel.themes.filter(t=>!t.isSystem).map(t=>(
                    <div key={t.id} className={`section-card ${funnel.themeId===t.id?'':' '}`} style={{borderColor: funnel.themeId===t.id?'#111':'var(--line)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <strong style={{fontSize:13}}>{t.name}</strong>
                        {funnel.themeId===t.id && <span className="pill">Active</span>}
                      </div>
                      <div style={{display:'flex',gap:6,marginTop:8}}>
                        {t.colors.map((c,i)=>(<span key={i} style={{width:22,height:22,borderRadius:99,background:c,border:'1px solid var(--line)'}}/>))}
                      </div>
                      <div style={{display:'flex',gap:6,marginTop:8}}>
                        <button className="chip" onClick={()=>{ setThemeEditingId(t.id); setRailMode('themeEdit')}}>Edit</button>
                        <button className="chip" onClick={()=>{
                          if(confirm(`Delete theme "${t.name}"?`)) dispatch({type:'DELETE_THEME', id:t.id})
                        }}>Delete</button>
                        <button className="chip" onClick={()=>dispatch({type:'SET_THEME', id:t.id})}>Use</button>
                      </div>
                    </div>
                  ))}
                  <button className="chip" onClick={()=>dispatch({type:'CREATE_THEME'})}>+ New theme</button>
                </div>
                <div className="panel-title" style={{marginTop:8}}>Perspective themes</div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {funnel.themes.filter(t=>t.isSystem).map(t=>(
                    <div key={t.id} className="section-card">
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <strong style={{fontSize:13}}>{t.name}</strong>
                        <span style={{fontSize:11,color:'var(--faint)'}}>{t.font}</span>
                      </div>
                      <div style={{display:'flex',gap:6,marginTop:8}}>
                        {t.colors.map((c,i)=>(<span key={i} style={{width:20,height:20,borderRadius:99,background:c,border:'1px solid var(--line)'}}/>))}
                      </div>
                      <div style={{display:'flex',gap:6,marginTop:8}}>
                        <button className="chip" onClick={()=>dispatch({type:'SET_THEME', id:t.id})}>Use</button>
                        <button className="chip" onClick={()=>dispatch({type:'FORK_THEME', id:t.id})}>Edit copy</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <PropertyPanel block={selectedBlock} theme={theme} funnel={funnel} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PropertyPanel({ block, theme, funnel }){
  const { dispatch, setSelectedBlockId } = useFunnel()
  const [logicOpen,setLogicOpen]=useState(false)
  const isTextLike = ['text','button','answer'].includes(block.type)
  const isQuiz = block.type==='quiz'
  const isAnswer = block.type==='answer'
  const isImage = block.type==='image'
  const isVideo = block.type==='video'
  const isButton = block.type==='button'
  const isForm = block.type==='form'
  const toEmbed = (url)=>{
    if(!url || typeof url!=='string') return null
    const s=url.trim(); if(!s) return null
    if(s.includes('/embed/')) return s
    let m=s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/\s]+)/); if(m) return `https://www.youtube.com/embed/${m[1]}`
    m=s.match(/vimeo\.com\/(\d+)/); if(m) return `https://player.vimeo.com/video/${m[1]}`
    if(/\.(mp4|webm|mov)(\?|$)/i.test(s)) return { mp4:s }
    if(/^https?:\/\//.test(s)) return s
    return null
  }
  const [mediaMode,setMediaMode]=useState('media')
  const [cachedSrc,setCachedSrc]=useState(block.content)
  useEffect(()=>{ if(block.type==='image' && typeof block.content==='string' && !block.content.startsWith('icon:')) setCachedSrc(block.content)},[block.content])
  const linking = block.linking || { mode:'always', always:{kind:'next'} }
  const typeLabel = block.type.charAt(0).toUpperCase()+block.type.slice(1)
  return (
    <div className="panel">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <strong style={{fontSize:13}}>{typeLabel}</strong>
          <span title="Type info" style={{width:18,height:18,borderRadius:99,border:'1px solid var(--line)',display:'grid',placeItems:'center',fontSize:11,color:'var(--muted)',cursor:'help'}}>ⓘ</span>
        </div>
        <button className="chip" onClick={()=>setSelectedBlockId(null)}>Done</button>
      </div>

      {isTextLike && (
        <>
          <div className="control-row">
            <div className="control-label">Font</div>
            <select className="select" value={block.style.font || theme.font} onChange={e=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{ font: e.target.value }})}>
              <optgroup label="Sans — most popular">
                <option value="Inter">Inter</option>
                <option value="DM Sans">DM Sans</option>
                <option value="Outfit">Outfit</option>
                <option value="Space Grotesk">Space Grotesk</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Sora">Sora</option>
              </optgroup>
              <optgroup label="Serif — editorial">
                <option value="Fraunces">Fraunces</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Newsreader">Newsreader</option>
                <option value="Cormorant Garamond">Cormorant Garamond</option>
                <option value="Instrument Serif">Instrument Serif</option>
                <option value="Libre Baskerville">Libre Baskerville</option>
              </optgroup>
              <optgroup label="Whimsical / Display">
                <option value="Caveat">Caveat — handwritten</option>
                <option value="Pacifico">Pacifico — brush</option>
                <option value="Fredoka">Fredoka — bouncy</option>
                <option value="Bricolage Grotesque">Bricolage Grotesque — quirky</option>
              </optgroup>
              <optgroup label="Mono">
                <option value="JetBrains Mono">JetBrains Mono</option>
              </optgroup>
            </select>
            <div style={{fontSize:11,color:'var(--faint)'}}>Theme default: {theme.font}</div>
          </div>
          <div className="control-row">
            <div className="control-label">Size</div>
            <SizeStepper value={SIZE_PRESETS[block.style.size] ?? block.style.size ?? 20} onChange={v=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{ size: v }})} />
          </div>
          <div className="row">
            {['bold','italic','underline'].map(k=>(
              <button key={k} className={`chip ${block.style[k]?'active':''}`} onClick={()=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{[k]: !block.style[k]}})}>{k==='bold'?'B':k==='italic'?'I':'U'}</button>
            ))}
            <button className="chip" onClick={()=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{align: block.style.align==='center'?'left':'center'}})}>
              {block.style.align==='center'?'Center':'Left'} ⇄
            </button>
          </div>
          <div className="control-row">
            <div className="control-label">Text color</div>
            <ColorPicker value={block.style.color} onChange={v=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{color:v}})} themeColors={theme.colors} />
          </div>
          <div className="control-row">
            <div className="control-label">Line height — select words then use highlight, or adjust whole block</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:11,color:'var(--muted)'}}>Tight</span>
              <input className="slider" type="range" min={1} max={2.2} step={0.05} value={block.style.lineHeight ?? 1.45} onChange={e=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{lineHeight: Number(e.target.value)}})} style={{flex:1}} />
              <span style={{fontSize:11,color:'var(--muted)'}}>Loose</span>
              <span style={{fontSize:12,fontWeight:600,minWidth:32,textAlign:'right'}}>{(block.style.lineHeight ?? 1.45).toFixed(2)}</span>
            </div>
            <div style={{fontSize:11,color:'var(--faint)'}}>For word-level bold/underline: double-click text in the canvas, highlight words, use the floating B I U toolbar (or ⌘B/⌘I).</div>
          </div>
        </>
      )}

      {isImage && (
        <>
          <div className="control-row">
            <div className="control-label">Source</div>
            <div className="seg">
              <button className={mediaMode==='media'?'active':''} onClick={()=>{
                setMediaMode('media')
                if(cachedSrc) dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:cachedSrc})
              }}>Media library</button>
              <button className={mediaMode==='icon'?'active':''} onClick={()=>{
                setMediaMode('icon')
                setCachedSrc(block.content)
                dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:'icon:star'})
              }}>Icon library</button>
            </div>
          </div>
          {mediaMode==='media' ? (
            <div className="control-row">
              <div className="control-label">Image URL</div>
              <input className="input" value={typeof block.content==='string' && !block.content.startsWith('icon:')?block.content:''} onChange={e=>dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:e.target.value})} placeholder="https://..." />
              <div style={{fontSize:11,color:'var(--muted)'}}>Drag & drop · Max 10MB; .png .jpg .webp .gif</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:6}}>
                {['persp','nature','city','art'].map(s=>(
                  <button key={s} style={{height:56,borderRadius:8,overflow:'hidden',border:'1px solid var(--line)',padding:0}} onClick={()=>dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:`https://picsum.photos/seed/${s}-${Math.floor(Math.random()*999)}/400/300`})}>
                    <img src={`https://picsum.photos/seed/${s}/120/80`} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="control-row">
              <div className="control-label">Icon</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                {['★','♥','◆','●','▲','■','⬢','✦'].map(ic=>(
                  <button key={ic} className="lib-tile" style={{padding:8}} onClick={()=>dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:`icon:${ic}`})}>{ic}</button>
                ))}
              </div>
              <label className="row" style={{fontSize:12}}><input type="checkbox"/> Animated icons</label>
            </div>
          )}
          <div className="control-row">
            <div className="control-label">Crop</div>
            <select className="select" defaultValue="cover"><option>Cover</option><option>Contain</option></select>
          </div>
          <div className="control-row">
            <div className="control-label">Appearance</div>
            <label className="row" style={{fontSize:12,gap:8}}>
              <span className={`toggle ${block.dropShadow ?? true ? 'on':''}`} onClick={()=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{dropShadow: !(block.dropShadow ?? true)}})}><i/></span>
              Clean drop shadow
            </label>
            <div style={{fontSize:11,color:'var(--muted)'}}>{block.dropShadow ?? true ? 'On — subtle elevation' : 'Off — flat, no shadow'}</div>
          </div>
        </>
      )}

      {isVideo && (
        <>
          <div className="control-row">
            <div className="control-label">Video URL</div>
            <input className="input" value={typeof block.content==='string' ? block.content : (block.content?.url || '')} onChange={e=>dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:e.target.value})} placeholder="https://youtube.com/watch?v=... or https://.../video.mp4" />
            <div style={{fontSize:11,color:'var(--faint)'}}>YouTube, Vimeo, or direct MP4. Paste any link — we convert to embed automatically.</div>
            <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
              <button className="chip" onClick={()=>dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:'https://www.youtube.com/watch?v=dQw4w9WgXcQ'})}>Demo YouTube</button>
              <button className="chip" onClick={()=>dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:'https://vimeo.com/76979871'})}>Demo Vimeo</button>
              <button className="chip" onClick={()=>dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content:'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'})}>Demo MP4</button>
            </div>
          </div>
          {(()=>{
            const emb = toEmbed(typeof block.content==='string' ? block.content : block.content?.url)
            if(!emb) return <div style={{fontSize:11,color:'#dc2626',background:'#fef2f2',border:'1px solid #fecaca',padding:'6px 8px',borderRadius:8}}>Enter a valid https:// URL above to render video.</div>
            if(typeof emb==='string' && emb) return <div style={{fontSize:11,color:'var(--muted)',background:'#f5f4f1',border:'1px solid var(--line)',padding:'6px 8px',borderRadius:8,wordBreak:'break-all'}}>Embed: {emb}</div>
            if(emb?.mp4) return <div style={{fontSize:11,color:'var(--muted)',background:'#f5f4f1',border:'1px solid var(--line)',padding:'6px 8px',borderRadius:8}}>Direct video file — will play natively.</div>
            return null
          })()}
          <div className="control-row">
            <div className="control-label">Advanced</div>
            <label className="row" style={{fontSize:12}}><input type="checkbox" defaultChecked/> Autoplay muted on scroll</label>
            <label className="row" style={{fontSize:12}}><input type="checkbox"/> Loop</label>
          </div>
        </>
      )}

      {isQuiz && (
        <>
          <div className="row">
            <button className="chip" onClick={()=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{align: block.style.align==='center'?'left':'center'}})}>
              {block.style.align==='center'?'Center':'Left'} ⇄
            </button>
            <span style={{fontSize:11,color:'var(--faint)'}}>Align</span>
          </div>
          <div className="control-row">
            <div className="control-label">Color</div>
            <ColorPicker value={block.style.color} onChange={v=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{color:v}})} themeColors={theme.colors} />
          </div>
          <div className="control-row">
            <div className="control-label">Line height</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:11,color:'var(--muted)'}}>Tight</span>
              <input className="slider" type="range" min={1} max={2.2} step={0.05} value={block.style.lineHeight ?? 1.45} onChange={e=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{lineHeight: Number(e.target.value)}})} style={{flex:1}} />
              <span style={{fontSize:11,color:'var(--muted)'}}>Loose</span>
              <span style={{fontSize:12,fontWeight:600,minWidth:32,textAlign:'right'}}>{(block.style.lineHeight ?? 1.45).toFixed(2)}</span>
            </div>
          </div>
          <label className="row" style={{fontSize:13, fontWeight:500}}>
            <span className={`toggle ${block.content?.revealAnswers?'on':''}`} onClick={()=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, revealAnswers: !block.content?.revealAnswers}}})}><i/></span>
            Reveal answers (social proof)
          </label>
          <div className="control-row">
            <div className="control-label">Display mode</div>
            <div className="seg" style={{display:'flex',gap:4}}>
              {[
                ['text','Text'],
                ['icon','Icon + text'],
                ['image','Image + text'],
              ].map(([id,label])=> (
                <button key={id} className={block.optionDisplay===id?'active':''} onClick={()=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{optionDisplay:id}})} style={{flex:1,padding:'6px 8px',borderRadius:8,border:'1px solid var(--line)',background: block.optionDisplay===id?'#111':'#fff',color: block.optionDisplay===id?'#fff':'var(--muted)',fontWeight:600,fontSize:12,cursor:'pointer'}}>{label}</button>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--faint)'}}>Set once per quiz — controls how each answer renders</div>
          </div>
          <div className="control-row">
            <div className="control-label">Behavior</div>
            <label className="row" style={{fontSize:12,gap:8}}>
              <span className={`toggle ${block.autoAdvance?'on':''}`} onClick={()=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{autoAdvance: !block.autoAdvance}})}><i/></span>
              Auto-advance on choice
            </label>
            {block.autoAdvance && (
              <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}>
                <span style={{fontSize:11,color:'var(--muted)'}}>Delay</span>
                <input className="slider" type="range" min={0} max={2000} step={100} value={block.autoAdvanceDelayMs} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{autoAdvanceDelayMs: Number(e.target.value)}})} style={{flex:1}} />
                <span style={{fontSize:12,fontWeight:600,minWidth:48,textAlign:'right'}}>{block.autoAdvanceDelayMs}ms</span>
              </div>
            )}
          </div>
          <div className="control-row">
            <div className="control-label">Personalization</div>
            <select className="select" defaultValue=""><option value="">None</option><option>First name</option><option>City</option></select>
            <div style={{fontSize:11,color:'var(--faint)'}}>Tokens: {'{{firstName}} {{email}} {{brandName}} {{score}}'} — also available in result content</div>
          </div>
        </>
      )}

      {(isButton || isAnswer) && (
        <div className="control-row">
          <div className="control-label">Linking</div>
          <div style={{display:'flex',gap:6}}>
            <button className={`chip ${linking.mode==='always'?'active':''}`} onClick={()=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ linking:{...linking, mode:'always'}}})}>Always link to</button>
            <button className={`chip ${linking.mode==='rules'?'active':''}`} onClick={()=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ linking:{...linking, mode:'rules', rules: linking.rules || [], fallback: linking.fallback || {kind:'next'}}}})}>Rules</button>
          </div>
          {linking.mode==='always' ? (
            <select className="select" value={JSON.stringify(linking.always||{kind:'next'})} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ linking:{...linking, always: JSON.parse(e.target.value)}}})}>
              <optgroup label="General">
                <option value={JSON.stringify({kind:'next'})}>Next Page</option>
                <option value={JSON.stringify({kind:'url', href:'https://example.com'})}>External URL</option>
                <option value={JSON.stringify({kind:'scroll', blockId: block.id})}>Scroll to Block</option>
              </optgroup>
              <optgroup label="Pages">
                {funnel.pages.map(p=> <option key={p.id} value={JSON.stringify({kind:'page', id:p.id})}>Page {p.index}: {p.name}</option>)}
              </optgroup>
              <optgroup label="Results">
                {funnel.results.map(r=> <option key={r.id} value={JSON.stringify({kind:'result', id:r.id})}>Result {r.letter}: {r.name}</option>)}
              </optgroup>
            </select>
          ) : (
            <button className="chip" onClick={()=>setLogicOpen(!logicOpen)}>{logicOpen?'Hide rules':'Edit rules…'}</button>
          )}
          {isAnswer && (
            <>
              <div className="control-row" style={{marginTop:8}}>
                <div className="control-label">Result assignment</div>
                <select className="select" value={block.resultRef||''} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ resultRef: e.target.value || null}})}>
                  <option value="">No result</option>
                  {funnel.results.map(r=> <option key={r.id} value={r.id}>{r.letter}: {r.name}</option>)}
                </select>
              </div>
              <div style={{border:'1px solid var(--line)',borderRadius:10,padding:10,background:'#fafaf8',marginTop:8}}>
                <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700,marginBottom:6}}>Scoring</div>
                <div className="control-row">
                  <div className="control-label">Score</div>
                  <input className="input" type="number" value={block.score ?? 0} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{score: Number(e.target.value)||0}})} />
                </div>
                <div className="control-row">
                  <div className="control-label">Tags <span style={{fontWeight:400,color:'var(--faint)'}}>(comma-separated)</span></div>
                  <input className="input" value={(block.tags||[]).join(', ')} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}})} placeholder="e.g. qualified, enterprise" />
                </div>
                <div className="control-row">
                  <div className="control-label">Icon <span style={{fontWeight:400,color:'var(--faint)'}}>(Lucide name or emoji)</span></div>
                  <div style={{display:'flex',gap:6}}>
                    <input className="input" style={{flex:1}} value={block.icon||''} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{icon: e.target.value}})} placeholder="star or 😀 or lucide:check" />
                    {block.icon && <button className="chip" onClick={()=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{icon:''}})}>Clear</button>}
                  </div>
                </div>
                <details style={{marginTop:8}}>
                  <summary style={{fontSize:12,fontWeight:600,cursor:'pointer',color:'var(--muted)'}}>Result content (optional)</summary>
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
                    <input className="input" value={block.reportHeadline||''} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{reportHeadline:e.target.value}})} placeholder="Report headline" />
                    <textarea className="input" rows={2} value={block.reportBody||''} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{reportBody:e.target.value}})} placeholder="Report body — supports {{firstName}} {{score}} {{brandName}}" />
                    <div style={{display:'flex',gap:6}}>
                      <input className="input" style={{flex:1}} value={block.insightLabel||''} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{insightLabel:e.target.value}})} placeholder="Insight label" />
                      <input className="input" style={{flex:1}} value={block.insightUrl||''} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{insightUrl:e.target.value}})} placeholder="https://…" />
                    </div>
                    <div style={{fontSize:11,color:'var(--faint)'}}>Tokens: {'{{firstName}} {{fullName}} {{email}} {{brandName}} {{quizName}} {{score}}'}</div>
                  </div>
                </details>
              </div>
            </>
          )}
        </div>
      )}

      {isButton && (
        <div className="control-row">
          <div className="control-label">Advanced</div>
          <div style={{display:'flex',gap:6}}>
            <button className="chip">Filled</button><button className="chip">Outline</button>
          </div>
          <label className="row" style={{fontSize:12,marginTop:6}}><input type="checkbox"/> Take full width on Desktop</label>
        </div>
      )}

      {isForm && (
        <div style={{display:'flex',flexDirection:'column',gap:10, border:'1px solid var(--line)',borderRadius:12,padding:12,background:'#fff'}}>
          <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700}}>Form — fields</div>
          <div className="control-row">
            <div className="control-label">Form title <span style={{fontWeight:400,color:'var(--faint)'}}>(optional heading)</span></div>
            <input className="input" value={block.content?.formTitle||''} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, formTitle: e.target.value}}})} placeholder="Your details" />
          </div>
          <div className="control-row">
            <div className="control-label">Submit button label</div>
            <input className="input" value={block.content?.submitLabel||'Continue'} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, submitLabel: e.target.value}}})} placeholder="Continue" />
          </div>
          <div style={{height:1,background:'var(--line)'}}/>
          {(block.content?.fields||[]).map((f,idx)=>(
            <div key={f.id} style={{border:'1px solid var(--line)',borderRadius:10,padding:10,background:'#fafaf8',display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:700,color:'var(--muted)'}}>Field {idx+1} · {f.type}</span>
                <span style={{display:'flex',gap:4}}>
                  <button className="chip" disabled={idx===0} onClick={()=>{
                    const fs=[...block.content.fields]; const [m]=fs.splice(idx,1); fs.splice(idx-1,0,m)
                    dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                  }}>↑</button>
                  <button className="chip" disabled={idx===(block.content.fields.length-1)} onClick={()=>{
                    const fs=[...block.content.fields]; const [m]=fs.splice(idx,1); fs.splice(idx+1,0,m)
                    dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                  }}>↓</button>
                  <button className="chip" style={{background:'#fff',borderColor:'#fecaca',color:'#dc2626'}} onClick={()=>{
                    if(!confirm(`Delete field "${f.label||f.placeholder||f.type}"?`)) return
                    const fs=block.content.fields.filter(x=>x.id!==f.id)
                    dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                  }}>Delete</button>
                </span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                <label style={{display:'flex',flexDirection:'column',gap:4}}>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--muted)'}}>Type</span>
                  <select className="select" value={f.type} onChange={e=>{
                    const fs=block.content.fields.map(x=> x.id===f.id ? {...x, type:e.target.value}: x)
                    dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                  }}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select / Dropdown</option>
                    <option value="date">Date</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="file">File upload</option>
                    <option value="number">Number</option>
                    <option value="url">URL</option>
                  </select>
                </label>
                <label style={{display:'flex',gap:6,alignItems:'center',fontSize:12,justifyContent:'flex-end'}}>
                  <span className={`toggle ${f.required?'on':''}`} onClick={()=>{
                    const fs=block.content.fields.map(x=> x.id===f.id ? {...x, required: !x.required}: x)
                    dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                  }}><i/></span> Required
                </label>
              </div>
              <label style={{display:'flex',flexDirection:'column',gap:4}}>
                <span style={{fontSize:11,fontWeight:600,color:'var(--muted)'}}>Label <span style={{fontWeight:400,color:'var(--faint)'}}>(leave empty for no label)</span></span>
                <input className="input" value={f.label} onChange={e=>{
                  const fs=block.content.fields.map(x=> x.id===f.id ? {...x, label:e.target.value}: x)
                  dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                }} placeholder="e.g. First name" />
              </label>
              <label style={{display:'flex',flexDirection:'column',gap:4}}>
                <span style={{fontSize:11,fontWeight:600,color:'var(--muted)'}}>Placeholder</span>
                <input className="input" value={f.placeholder||''} onChange={e=>{
                  const fs=block.content.fields.map(x=> x.id===f.id ? {...x, placeholder:e.target.value}: x)
                  dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                }} placeholder="e.g. Alex" />
              </label>
              <label style={{display:'flex',flexDirection:'column',gap:4}}>
                <span style={{fontSize:11,fontWeight:600,color:'var(--muted)'}}>Helper text <span style={{fontWeight:400,color:'var(--faint)'}}>(small text below field)</span></span>
                <input className="input" value={f.helperText||''} onChange={e=>{
                  const fs=block.content.fields.map(x=> x.id===f.id ? {...x, helperText:e.target.value}: x)
                  dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                }} placeholder="We’ll never share your email." />
              </label>
              {f.type==='select' && (
                <label style={{display:'flex',flexDirection:'column',gap:4}}>
                  <span style={{fontSize:11,fontWeight:600,color:'var(--muted)'}}>Options <span style={{fontWeight:400,color:'var(--faint)'}}>(comma-separated)</span></span>
                  <input className="input" value={(f.options||[]).join(', ')} onChange={e=>{
                    const opts=e.target.value.split(',').map(s=>s.trim()).filter(Boolean)
                    const fs=block.content.fields.map(x=> x.id===f.id ? {...x, options:opts}: x)
                    dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
                  }} placeholder="Option A, Option B, Option C" />
                </label>
              )}
            </div>
          ))}
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            <button className="chip" style={{background:'#111',color:'#fff'}} onClick={()=>{
              const nid=Math.random().toString(36).slice(2,7)
              const fs=[...(block.content.fields||[]), {id:nid, type:'text', label:'New field', placeholder:'', helperText:'', required:false, options:[]}]
              dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
            }}>+ Add field</button>
            <button className="chip" onClick={()=>{
              const nid=Math.random().toString(36).slice(2,7)
              const fs=[...(block.content.fields||[]), {id:nid, type:'email', label:'Email', placeholder:'you@company.com', helperText:'', required:true, options:[]}]
              dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
            }}>+ Email</button>
            <button className="chip" onClick={()=>{
              const nid=Math.random().toString(36).slice(2,7)
              const fs=[...(block.content.fields||[]), {id:nid, type:'phone', label:'Phone', placeholder:'+1 …', helperText:'Optional', required:false, options:[]}]
              dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
            }}>+ Phone</button>
            <button className="chip" onClick={()=>{
              const nid=Math.random().toString(36).slice(2,7)
              const fs=[...(block.content.fields||[]), {id:nid, type:'select', label:'Select', placeholder:'Choose…', helperText:'', required:false, options:['Option A','Option B']}]
              dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, fields:fs}}})
            }}>+ Dropdown</button>
          </div>
          <div style={{fontSize:11,color:'var(--faint)'}}>Tip: leave <em>Label</em> empty and use <em>Helper text</em> for a caption-only line. Toggle <em>Required</em> per field — validated in Preview + demo persistence hook.</div>
        </div>
      )}

      <div className="control-row">
        <div className="control-label">Background</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--muted)'}}>Top</span>
          <input className="slider" type="range" min={0} max={32} value={block.style.spacingTop} onChange={e=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{spacingTop: Number(e.target.value)}})} />
          <span style={{fontSize:12,color:'var(--muted)'}}>Bottom</span>
          <input className="slider" type="range" min={0} max={32} value={block.style.spacingBottom} onChange={e=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{spacingBottom: Number(e.target.value)}})} />
        </div>
        <ColorPicker value={block.style.background} onChange={v=>dispatch({type:'UPDATE_BLOCK_STYLE', id:block.id, patch:{background:v}})} themeColors={theme.colors} />
      </div>

      <div className="control-row">
        <div className="control-label">Tracking ID</div>
        <input className="input" value={block.trackingId} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{trackingId:e.target.value}})} />
      </div>

      {logicOpen && linking.mode==='rules' && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,15,15,.45)',backdropFilter:'blur(4px)',display:'grid',placeItems:'center',zIndex:70,padding:20}} onClick={()=>setLogicOpen(false)}>
          <div style={{width:'min(560px,100%)',maxHeight:'80vh',overflow:'auto',background:'#fff',borderRadius:16,padding:16,boxShadow:'0 20px 60px rgba(0,0,0,.25)'}} onClick={e=>e.stopPropagation()}>
            <RuleBuilder block={block} funnel={funnel} onClose={()=>setLogicOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function RuleBuilder({ block, funnel, onClose }){
  const { dispatch } = useFunnel()
  const linking = block.linking
  const rules = linking.rules || []
  const addRule = ()=>{
    const vars = funnel.pages.flatMap(p=>p.blocks).map(id=>funnel.blocksById[id]?.trackingId).filter(Boolean)
    const newRule = { conditions:[{ sourceTrackingId: vars[0] || block.trackingId, operator:'equals', value:'' }], target:{kind:'next'} }
    dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ linking:{...linking, rules:[...rules,newRule]}}})
  }
  const updateRule = (idx, patch)=>{
    const nr=[...rules]; nr[idx]={...nr[idx],...patch}; dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ linking:{...linking, rules:nr}}})
  }
  const removeRule = (idx)=>{
    const nr=rules.filter((_,i)=>i!==idx); dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ linking:{...linking, rules:nr}}})
  }
  const variables = funnel.pages.flatMap(p=> p.blocks.map(id=> funnel.blocksById[id]).filter(b=> b && ['quiz','form','button','answer','text'].includes(b.type))).map(b=> ({ id:b.trackingId, label:`${b.type} · ${b.trackingId} (p${funnel.pages.find(p=>p.blocks.includes(b.id))?.index})`, type: b.type }))

  const operatorFor = (type)=>{
    if(type==='quiz' || type==='answer') return 'equals'
    if(type==='form') return 'is filled'
    if(type==='button') return 'is clicked'
    return 'equals'
  }

  return (
    <div className="rules-builder" data-testid="rules-builder">
      <strong style={{fontSize:12}}>Rules — first match wins</strong>
      {rules.length>0 && rules.map((r,idx)=>(
        <div key={idx} className="rule-card" data-testid="rule-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)'}}>Rule {idx+1}</span>
            <button className="chip" onClick={()=>removeRule(idx)}>Remove</button>
          </div>
          {r.conditions.map((c,ci)=>(
            <div key={ci} style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}} className="rule-condition" data-testid="rule-condition">
              <span style={{fontSize:12,fontWeight:600}}>When</span>
              <select className="select" style={{flex:1,minWidth:120}} value={c.sourceTrackingId} onChange={e=>{
                const v = variables.find(v=> v.id===e.target.value)
                const op = v ? operatorFor(v.type) : 'equals'
                const nr=[...r.conditions]; nr[ci]={...nr[ci], sourceTrackingId:e.target.value, operator: op}; updateRule(idx,{conditions:nr})
              }}>
                {variables.map(v=> <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
              <span style={{fontSize:11,padding:'4px 8px',background:'#f2f0ed',borderRadius:6, border:'1px solid var(--line)'}}>{c.operator}</span>
              <input className="input" style={{flex:1,minWidth:80}} value={c.value} placeholder="value" onChange={e=>{
                const nr=[...r.conditions]; nr[ci]={...nr[ci], value:e.target.value}; updateRule(idx,{conditions:nr})
              }} />
              {r.conditions.length>1 && <button className="chip" onClick={()=>{
                const nr=r.conditions.filter((_,i)=>i!==ci); updateRule(idx,{conditions:nr})
              }}>✕</button>}
            </div>
          ))}
          <button className="chip" onClick={()=>{
            const v = variables[0]
            const nr=[...r.conditions, { sourceTrackingId: v?.id || block.trackingId, operator: v ? operatorFor(v.type) : 'equals', value:'' }]
            updateRule(idx,{conditions:nr})
          }}>+ Add Condition (AND)</button>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:12,fontWeight:600}}>Then go to</span>
            <select className="select" value={JSON.stringify(r.target)} onChange={e=>updateRule(idx,{target: JSON.parse(e.target.value)})}>
              <optgroup label="General">
                <option value={JSON.stringify({kind:'next'})}>Next Page</option>
                <option value={JSON.stringify({kind:'url', href:'https://example.com'})}>External URL</option>
                <option value={JSON.stringify({kind:'scroll', blockId:block.id})}>Scroll to Block</option>
              </optgroup>
              <optgroup label="Pages">
                {funnel.pages.map(p=> <option key={p.id} value={JSON.stringify({kind:'page', id:p.id})}>Page {p.index}: {p.name}</option>)}
              </optgroup>
              <optgroup label="Results">
                {funnel.results.map(rr=> <option key={rr.id} value={JSON.stringify({kind:'result', id:rr.id})}>Result {rr.letter}</option>)}
              </optgroup>
            </select>
          </div>
        </div>
      ))}
      {rules.length===0 && <div style={{fontSize:12,color:'var(--muted)',textAlign:'center',padding:8}}>No rules yet — add one to branch visitors.</div>}
      <button className="chip" onClick={addRule}>+ Add rule</button>
      <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontSize:12,fontWeight:600}}>In all other cases →</span>
        <select className="select" style={{flex:1,minWidth:140}} value={JSON.stringify(linking.fallback||{kind:'next'})} onChange={e=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ linking:{...linking, fallback: JSON.parse(e.target.value)}}})}>
          <optgroup label="General">
            <option value={JSON.stringify({kind:'next'})}>Next Page</option>
            <option value={JSON.stringify({kind:'url', href:'https://example.com'})}>External URL</option>
          </optgroup>
          <optgroup label="Pages">
            {funnel.pages.map(p=> <option key={p.id} value={JSON.stringify({kind:'page', id:p.id})}>Page {p.index}: {p.name}</option>)}
          </optgroup>
          <optgroup label="Results">
            {funnel.results.map(rr=> <option key={rr.id} value={JSON.stringify({kind:'result', id:rr.id})}>Result {rr.letter}</option>)}
          </optgroup>
        </select>
      </div>
      <div style={{display:'flex',gap:6}}>
        <button className="chip" onClick={()=>dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ linking:{...linking, mode:'always', rules:[], fallback:{kind:'next'}}}})}>Reset</button>
        <button className="chip" onClick={onClose}>Cancel</button>
        <button className="chip" style={{background:'#111',color:'#fff',marginLeft:'auto'}} onClick={onClose}>Save</button>
      </div>
      <div style={{fontSize:11,color:'var(--faint)'}}></div>
    </div>
  )
}

function ResultRow({ result, funnel }){
  const { dispatch } = useFunnel()
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState(false)
  const [draft,setDraft]=useState(result.name)
  const rules = result.selectionRules||[]
  return (
    <div className="section-card" style={{padding:8}}>
      <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'space-between'}}>
        <span style={{display:'flex',gap:8,alignItems:'center',flex:1}}>
          <span className="num">{result.letter}</span>
          {editing ? (
            <input className="input" style={{flex:1,padding:'4px 8px',fontSize:13}} value={draft} autoFocus onChange={e=>setDraft(e.target.value)} onBlur={()=>{ dispatch({type:'UPDATE_RESULT', id:result.id, patch:{name:draft}}); setEditing(false)}} onKeyDown={e=>{ if(e.key==='Enter'){dispatch({type:'UPDATE_RESULT', id:result.id, patch:{name:draft}}); setEditing(false)}}}/>
          ) : (
            <span style={{fontSize:13,fontWeight:600,flex:1}} onClick={()=>setEditing(true)} title="Click to rename">{result.name}</span>
          )}
        </span>
        <span style={{display:'flex',gap:4,alignItems:'center'}}>
          <button className="chip" style={{fontSize:11,padding:'4px 8px'}} onClick={()=>setOpen(o=>!o)}>{open?'Hide rules':`Rules${rules.length?` · ${rules.length}`:''}`}</button>
          <button className="chip" style={{padding:'4px 6px'}} onClick={()=>{ if(confirm(`Delete result "${result.name}"?`)) dispatch({type:'DELETE_RESULT', id:result.id})}}>×</button>
        </span>
      </div>
      {rules.length>0 && !open && <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{rules.length} rule{rules.length>1?'s':''} — score/tag logic</div>}
      {open && <ResultRulesEditor result={result} />}
    </div>
  )
}

function ResultRulesEditor({ result }){
  const { funnel, dispatch } = useFunnel()
  const rules = result.selectionRules||[]
  const addRule = ()=>{
    const nr=[...rules, {conditions:[{operator:'score_gte', value:'10'}]}]
    dispatch({type:'UPDATE_RESULT', id:result.id, patch:{selectionRules:nr}})
  }
  const updateRule = (idx, patch)=>{
    const nr=[...rules]; nr[idx]={...nr[idx],...patch}; dispatch({type:'UPDATE_RESULT', id:result.id, patch:{selectionRules:nr}})
  }
  const removeRule = (idx)=>{
    const nr=rules.filter((_,i)=>i!==idx); dispatch({type:'UPDATE_RESULT', id:result.id, patch:{selectionRules:nr}})
  }
  return (
    <div style={{marginTop:8,borderTop:'1px solid var(--line)',paddingTop:8,display:'flex',flexDirection:'column',gap:8}}>
      <div style={{fontSize:11,letterSpacing:'.06em',textTransform:'uppercase',color:'var(--faint)',fontWeight:700}}>Result selection — first match wins (score/tag)</div>
      {rules.map((r,idx)=>(
        <div key={idx} style={{border:'1px solid var(--line)',borderRadius:8,padding:8,background:'#fff',display:'flex',flexDirection:'column',gap:6}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:11,fontWeight:700,color:'var(--faint)'}}>Rule {idx+1}</span>
            <button className="chip" onClick={()=>removeRule(idx)}>Remove</button>
          </div>
          {(r.conditions||[]).map((c,ci)=>(
            <div key={ci} style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
              <select className="select" style={{minWidth:120}} value={c.operator} onChange={e=>{
                const nr=[...(r.conditions||[])]; nr[ci]={...nr[ci], operator:e.target.value}; updateRule(idx,{conditions:nr})
              }}>
                <option value="score_gte">score ≥</option>
                <option value="score_lte">score ≤</option>
                <option value="score_between">score between (a,b)</option>
                <option value="has_tag">has tag</option>
                <option value="equals">equals (tag or score)</option>
              </select>
              <input className="input" style={{flex:1,minWidth:80}} value={c.value||''} onChange={e=>{
                const nr=[...(r.conditions||[])]; nr[ci]={...nr[ci], value:e.target.value}; updateRule(idx,{conditions:nr})
              }} placeholder={c.operator==='has_tag'?'tag name': c.operator==='score_between'?'e.g. 10,20':'value'} />
              {(r.conditions||[]).length>1 && <button className="chip" onClick={()=>{ const nr=(r.conditions||[]).filter((_,i)=>i!==ci); updateRule(idx,{conditions:nr})}}>✕</button>}
            </div>
          ))}
          <button className="chip" onClick={()=>{
            const nr=[...(r.conditions||[]), {operator:'has_tag', value:''}]; updateRule(idx,{conditions:nr})
          }}>+ Add Condition (AND)</button>
        </div>
      ))}
      <button className="chip" onClick={addRule}>+ Add rule</button>
      <div style={{fontSize:11,color:'var(--faint)'}}>Reuses the same first-match-wins dialog as answer linking. Manual result assignment remains the fallback.</div>
    </div>
  )
}

function MessageCard({ message }){
  const { funnel, dispatch } = useFunnel()
  const [openId,setOpenId]=useState(null)
  const updateNode = (nodeId, patch)=>{
    const seq = message.sequence.map(n=> n.id===nodeId ? {...n, ...patch} : n)
    dispatch({type:'UPDATE_MESSAGE_SEQUENCE', messageId: message.id, sequence: seq})
  }
  return (
    <div className="section-card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <strong style={{fontSize:13}}>{message.name}</strong>
        <span className="pill" style={{background: message.status==='offline'?'#f2f0ed':'#e6f4ea', color: message.status==='offline'?'var(--muted)':'#137333'}}>{message.status}</span>
      </div>
      <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:6}}>
        {message.sequence.map(n=>(
          <div key={n.id} style={{border:'1px solid var(--line)',borderRadius:8,background:'#fff',overflow:'hidden'}}>
            <div style={{display:'flex',gap:8,alignItems:'center',fontSize:12,padding:'6px 8px',cursor: n.type==='email'?'pointer':'default'}} onClick={()=> setOpenId(openId===n.id?null:n.id)}>
              <span style={{width:6,height:6,borderRadius:99,background: n.type==='trigger'?'#111': n.type==='delay'?'#f59e0b':'#2563eb'}}/>
              <span style={{fontWeight:600,flex:1}}>{n.label}</span>
              <span style={{color:'var(--faint)',fontSize:11}}>{n.type}</span>
              {n.type==='email' && <span style={{fontSize:11,color:'var(--muted)'}}>{openId===n.id?'▴':'▾'}</span>}
            </div>
            {n.type==='email' && openId===n.id && (
              <div style={{padding:8,borderTop:'1px solid var(--line)',display:'flex',flexDirection:'column',gap:8,background:'#fafaf8'}}>
                <label style={{fontSize:11,fontWeight:600}}>Subject</label>
                <input className="input" value={n.subject||''} onChange={e=> updateNode(n.id,{subject:e.target.value, label:e.target.value||'Email'})} placeholder="Your personalized plan" />
                <label style={{fontSize:11,fontWeight:600}}>Body <span style={{fontWeight:400,color:'var(--faint)'}}>— supports {'{{firstName}} {{score}} {{brandName}}'}</span></label>
                <textarea className="input" rows={3} value={n.body||''} onChange={e=> updateNode(n.id,{body:e.target.value})} placeholder="Hi {{firstName}}, …" />
                <label style={{fontSize:11,fontWeight:600}}>Recipient</label>
                <div style={{display:'flex',gap:6}}>
                  <button className={`chip ${n.recipientMode==='lead'?'active':''}`} onClick={()=>updateNode(n.id,{recipientMode:'lead'})}>Send to lead</button>
                  <button className={`chip ${n.recipientMode==='staff'?'active':''}`} onClick={()=>updateNode(n.id,{recipientMode:'staff'})}>Send to staff</button>
                </div>
                {n.recipientMode==='staff' && (
                  <input className="input" value={n.staffEmails||''} onChange={e=> updateNode(n.id,{staffEmails:e.target.value})} placeholder="staff@acme.com, team@acme.com" />
                )}
                <div style={{display:'flex',gap:6}}>
                  <button className="chip" onClick={()=>alert(`Test send\nTo: ${n.recipientMode==='staff'? (n.staffEmails||'staff') : 'lead'}\nSubject: ${n.subject}`)}>Test send</button>
                </div>
              </div>
            )}
            {n.type==='delay' && openId===n.id && (
              <div style={{padding:8,borderTop:'1px solid var(--line)',display:'flex',gap:8,alignItems:'center',background:'#fafaf8'}}>
                <span style={{fontSize:11,color:'var(--muted)'}}>Delay</span>
                <input className="input" type="number" style={{flex:1}} value={Math.round((n.delayMs||3600000)/60000)} onChange={e=> updateNode(n.id,{delayMs: Number(e.target.value)*60000, label:`Wait ${e.target.value} min`})} />
                <span style={{fontSize:11,color:'var(--muted)'}}>minutes</span>
              </div>
            )}
            {n.type!=='email' && openId===n.id && n.type!=='delay' && (
              <div style={{padding:8,borderTop:'1px solid var(--line)',background:'#fafaf8',fontSize:11,color:'var(--muted)'}}>Trigger — fires when funnel completed</div>
            )}
          </div>
        ))}
      </div>
      <button className="chip" style={{marginTop:8}} onClick={()=>alert('Test send — headless demo; email body uses {{tokens}} from Priority 6')}>Test send</button>
    </div>
  )
}

function InlineToolbar({ targetRef }){
  const [visible,setVisible]=useState(false)
  const [pos,setPos]=useState({top:0,left:0})
  useEffect(()=>{
    const onSel=()=>{
      const sel=window.getSelection()
      if(!sel.rangeCount || sel.isCollapsed){ setVisible(false); return }
      const range=sel.getRangeAt(0)
      const target=targetRef.current
      if(!target) { setVisible(false); return }
      const anchor = sel.anchorNode, focus = sel.focusNode
      const inside = (n)=> n && (target.contains(n) || n===target)
      if(!inside(anchor) && !inside(range.commonAncestorContainer)) { setVisible(false); return }
      const rect=range.getBoundingClientRect()
      const tRect=target.getBoundingClientRect()
      if(!rect.width && !rect.height){ setVisible(false); return }
      setPos({ top: rect.top - tRect.top - 38, left: rect.left - tRect.left + rect.width/2 })
      setVisible(true)
    }
    document.addEventListener('selectionchange', onSel)
    document.addEventListener('mouseup', onSel)
    return ()=>{ document.removeEventListener('selectionchange', onSel); document.removeEventListener('mouseup', onSel) }
  },[targetRef])
  if(!visible) return null
  const b = (label, cmd, title)=>(
    <button key={cmd} onMouseDown={e=>e.preventDefault()} onClick={()=>document.execCommand(cmd,false,null)} title={title} style={{width:28,height:28,borderRadius:6,border:'1px solid #2a2a2a',background:'#fff',fontWeight:700,cursor:'pointer',fontSize:12,display:'grid',placeItems:'center'}}>{label}</button>
  )
  return (
    <div style={{position:'absolute', left: pos.left, top: pos.top, transform:'translateX(-50%)', background:'#111', padding:'4px', borderRadius:99, display:'flex', gap:4, boxShadow:'0 8px 24px rgba(0,0,0,.3)', zIndex:10, border:'1px solid #222'}}>
      {b('B','bold','Bold — select words then B or ⌘B')}
      <button onMouseDown={e=>e.preventDefault()} onClick={()=>document.execCommand('italic',false,null)} title="Italic — ⌘I" style={{width:28,height:28,borderRadius:6,border:'1px solid #2a2a2a',background:'#fff',fontStyle:'italic',fontWeight:600,cursor:'pointer',fontSize:12,display:'grid',placeItems:'center'}}>I</button>
      <button onMouseDown={e=>e.preventDefault()} onClick={()=>document.execCommand('underline',false,null)} title="Underline — ⌘U" style={{width:28,height:28,borderRadius:6,border:'1px solid #2a2a2a',background:'#fff',textDecoration:'underline',fontWeight:600,cursor:'pointer',fontSize:12,display:'grid',placeItems:'center'}}>U</button>
      <button onMouseDown={e=>e.preventDefault()} onClick={()=>document.execCommand('hiliteColor',false,'#fff176')} title="Highlight" style={{width:28,height:28,borderRadius:6,border:'1px solid #2a2a2a',background:'#fff176',cursor:'pointer',fontSize:11,display:'grid',placeItems:'center'}}>◧</button>
      <button onMouseDown={e=>e.preventDefault()} onClick={()=>document.execCommand('removeFormat',false,null)} title="Clear formatting" style={{width:28,height:28,borderRadius:99,border:'1px solid #333',background:'#222',color:'#fff',cursor:'pointer',fontSize:11,display:'grid',placeItems:'center'}}>✕</button>
    </div>
  )
}

function BlockRenderer({ blockId, depth=0, onSelect }){
  const { funnel, dispatch, selectedBlockId, setSelectedBlockId } = useFunnel()
  const block = funnel.blocksById[blockId]
  const theme = funnel.themes.find(t=>t.id===funnel.themeId) || funnel.themes[0]
  const [editing,setEditing]=useState(false)
  const [editingAnswerId,setEditingAnswerId]=useState(null)
  const ref=useRef(null)
  const blockRef=useRef(null)
  if(!block) return null
  const isSelected = selectedBlockId===block.id
  const bg = resolveColor(block.style.background, theme)
  const color = resolveColor(block.style.color, theme) || '#0f0f0f'
  const fontFamily = block.style.font || theme.font
  const radius = [8,12,16,20][(theme.radius||2)-1] || 12
  // preserve selection on device toggle: no side effect
  const handleSelect = (e)=>{
    e.stopPropagation()
    setSelectedBlockId(block.id)
    if(isSelected && ['text','button','answer'].includes(block.type)){
      setEditing(true)
      setTimeout(()=>{ if(ref.current) { ref.current.focus(); const r=document.createRange(); r.selectNodeContents(ref.current); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r) } },0)
    }
    if(onSelect) onSelect(block.id, blockRef.current)
  }
  const contentEditableProps = editing ? {
    contentEditable:true,
    suppressContentEditableWarning:true,
    onBlur: (e)=>{
      const html = e.currentTarget.innerHTML || ''
      const clean = html === '<br>' ? '' : html
      if(block.type==='quiz'){
        dispatch({type:'UPDATE_BLOCK', id:block.id, patch:{ content:{...block.content, question: clean || html}}})
      } else if(['text','button','answer'].includes(block.type)){
        dispatch({type:'UPDATE_BLOCK_CONTENT', id:block.id, content: clean || html})
      }
      setEditing(false)
    },
    onKeyDown: (e)=>{
      if((e.key==='b' || e.key==='i') && (e.metaKey||e.ctrlKey)){
        // let browser handle bold/italic natively — will produce <b>/<i> and be saved as HTML on blur
        return
      }
      if(e.key==='Enter' && !e.shiftKey){
        e.preventDefault()
        e.currentTarget.blur()
      }
      if(e.key==='Escape'){
        setEditing(false)
        e.currentTarget.blur()
      }
    }
  } : {}

  // P6, P8: interpolation + bodyFont split
  const scoreCtx = { score: 0, brandName: funnel.settings.brandName, quizName: funnel.name, funnelName: funnel.name, firstName:'there', email:'' }
  // bodyFont for body copy, headline font for titles/CTAs
  const headlineFont = theme.font
  const bodyFont = theme.bodyFont||theme.font
  let inner=null
  if(block.type==='text'){
    const txtFont = block.style.font ? fontFamily : bodyFont
    inner = (
      <div style={{position:'relative'}}>
        <div ref={ref} className="t-text" style={{ fontFamily: txtFont, color, lineHeight: block.style.lineHeight ?? 1.45, fontSize: (typeof block.style.size==='number'? block.style.size : SIZE_PRESETS[block.style.size]||20), fontWeight: block.style.bold?700:400, fontStyle:block.style.italic?'italic':'normal', textDecoration:block.style.underline?'underline':'none', textAlign:block.style.align }} {...contentEditableProps} dangerouslySetInnerHTML={{__html: interpolateTokens(block.content || '', scoreCtx)}} />
        {editing && <InlineToolbar targetRef={ref} />}
      </div>
    )
  } else if(block.type==='button'){
    inner = <div style={{textAlign:block.style.align, position:'relative'}}><div ref={ref} className="btn btn-filled" style={{ background: buttonBg(theme), color:'#fff', borderRadius: radius, fontFamily: headlineFont, lineHeight: block.style.lineHeight ?? 1.45, display:'inline-flex' }} {...contentEditableProps} dangerouslySetInnerHTML={{__html: interpolateTokens(block.content || '', scoreCtx)}} />{editing && <InlineToolbar targetRef={ref} />}</div>
  } else if(block.type==='image'){
    if(String(block.content).startsWith('icon:')){
      inner = <div style={{fontSize:48, textAlign:'center', padding:20, color}}>{String(block.content).slice(5)}</div>
    } else {
      const hasShadow = block.dropShadow ?? true
      inner = <div className="img-wrap" style={{borderRadius: radius, boxShadow: hasShadow ? '0 4px 16px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.05)' : 'none', overflow:'hidden'}}><img src={block.content} alt="" draggable={false} style={{display:'block', width:'100%', height:'auto'}} /></div>
    }
  } else if(block.type==='divider'){
    inner = <div className="divider" />
  } else if(block.type==='list'){
    inner = <ul className="list" style={{color, fontFamily}}>{(Array.isArray(block.content)?block.content:[]).map((li,i)=>(
      <li key={i} style={{fontSize:14}}><span ref={i===0?ref:null} {...(i===0?contentEditableProps:{})}>{li}</span></li>
    ))}</ul>
  } else if(block.type==='video'){
    const raw = typeof block.content==='string' ? block.content : (block.content?.url || '')
    const getEmbed = (url)=>{
      if(!url || typeof url!=='string') return null
      const s=url.trim(); if(!s) return null
      if(s.includes('/embed/')) return s
      let m=s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/\s]+)/); if(m) return `https://www.youtube.com/embed/${m[1]}`
      m=s.match(/vimeo\.com\/(\d+)/); if(m) return `https://player.vimeo.com/video/${m[1]}`
      if(/\.(mp4|webm|mov)(\?|$)/i.test(s)) return { mp4:s }
      if(/^https?:\/\//.test(s)) return s
      return null
    }
    const emb = getEmbed(raw)
    if(!raw || !emb){
      inner = <div style={{border:'1px dashed var(--line)',borderRadius:radius,padding:20,textAlign:'center',background:'#fcfcfa'}}><div style={{fontSize:13,fontWeight:600}}>No video link</div><div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Select this block → paste a YouTube / Vimeo / MP4 URL on the left.</div><div style={{fontSize:11,color:'var(--faint)',marginTop:6,wordBreak:'break-all'}}>{String(raw||'—')}</div></div>
    } else if(emb?.mp4){
      inner = <div className="video-box" style={{borderRadius:radius, padding:0, overflow:'hidden', background:'#000'}}><video src={emb.mp4} controls style={{width:'100%',height:'auto',display:'block', aspectRatio:'16/9'}} /></div>
    } else {
      const src = typeof emb==='string' ? emb : raw
      inner = <div className="video-box" style={{borderRadius:radius, padding:0, overflow:'hidden', background:'#000', aspectRatio:'16/9'}}><iframe src={src} title="Video" style={{width:'100%',height:'100%',border:'none'}} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
    }
  } else if(block.type==='form'){
    const fields = block.content?.fields || []
    const legacyLabel = block.content?.label
    const legacyPlaceholder = block.content?.placeholder
    const effectiveFields = fields.length ? fields : (legacyLabel || legacyPlaceholder ? [{id:'legacy', type:'email', label: legacyLabel||'Email', placeholder: legacyPlaceholder||'', helperText:'', required:true, options:[]}] : [])
    inner = <div className="form-box" style={{borderRadius: radius, display:'flex',flexDirection:'column',gap:12}}>
      {block.content?.formTitle && <div style={{fontWeight:700,fontSize:15,fontFamily: headlineFont}}>{block.content.formTitle}</div>}
      {effectiveFields.map(f=>(
        <div key={f.id} style={{display:'flex',flexDirection:'column',gap:4}}>
          {f.label ? <label style={{fontSize:12,fontWeight:600,display:'flex',gap:4}}>{f.label}{f.required && <span style={{color:'#dc2626'}}>*</span>}</label> : null}
          {f.type==='textarea' ? (
            <textarea placeholder={f.placeholder} required={f.required} style={{border:'1px solid var(--line)',borderRadius:8,padding:'8px 10px',fontSize:13,minHeight:80,resize:'vertical'}} />
          ) : f.type==='select' ? (
            <select required={f.required} style={{border:'1px solid var(--line)',borderRadius:8,padding:'8px 10px',fontSize:13,background:'#fff'}}>
              <option value="">{f.placeholder||'Select…'}</option>
              {(f.options||[]).map((o,i)=><option key={i} value={o}>{o}</option>)}
            </select>
          ) : f.type==='checkbox' ? (
            <label style={{display:'flex',gap:8,alignItems:'center',fontSize:13}}><input type="checkbox" required={f.required} /> <span>{f.label || f.placeholder || 'I agree'}</span>{f.required && <span style={{color:'#dc2626'}}>*</span>}</label>
          ) : f.type==='file' ? (
            <input type="file" required={f.required} style={{fontSize:13}} />
          ) : (
            <input type={f.type==='phone' ? 'tel' : f.type} placeholder={f.placeholder} required={f.required} style={{border:'1px solid var(--line)',borderRadius:8,padding:'8px 10px',fontSize:13}} />
          )}
          {f.helperText && <div style={{fontSize:11,color:'var(--muted)'}}>{f.helperText}</div>}
        </div>
      ))}
      <button className="btn btn-filled" style={{background:buttonBg(theme),fontFamily: headlineFont}}>{block.content?.submitLabel||'Continue'}</button>
    </div>
  } else if(block.type==='quiz'){
    inner = (
      <div className="quiz-wrap" style={{borderRadius: radius, fontFamily: headlineFont}}>
        <div style={{position:'relative'}}>
          <div className="quiz-title" style={{fontFamily: headlineFont, color, lineHeight: block.style.lineHeight ?? 1.45, textAlign:block.style.align, fontSize: (typeof block.style.size==='number'? block.style.size : 20)}} ref={ref} {...(editing?contentEditableProps:{})} dangerouslySetInnerHTML={{__html: interpolateTokens(block.content?.question || '', scoreCtx)}}
            onClick={e=>{
              e.stopPropagation()
              if(isSelected){
                setEditing(true)
                setTimeout(()=>{ if(ref.current) ref.current.focus()},0)
              } else {
                setSelectedBlockId(block.id)
              }
            }}
          />
          {editing && <InlineToolbar targetRef={ref} />}
        </div>
        <div className="quiz-grid">
          {(block.children||[]).map(cid=>{
            const ans = funnel.blocksById[cid]
            if(!ans) return null
            const isAnsSelected = selectedBlockId===cid
            const isEditingAns = editingAnswerId===cid
            const display = block.optionDisplay||'text'
            const icon = ans.icon||''
            const showIcon = display==='icon' && !!icon
            const showImg = display==='image'
            return (
              <div key={cid}
                className={`answer-card ${isAnsSelected?'selected':''}`}
                onClick={(e)=>{
                  e.stopPropagation();
                  if(isAnsSelected){
                    setEditingAnswerId(cid)
                    setTimeout(()=>{
                      const el=document.querySelector(`[data-answer-id="${cid}"]`)
                      if(el){ el.focus(); const r=document.createRange(); r.selectNodeContents(el); const s=window.getSelection(); s.removeAllRanges(); s.addRange(r) }
                    },0)
                  } else {
                    setSelectedBlockId(cid)
                  }
                }}
                style={{borderRadius: radius-4, position:'relative', cursor:'pointer', userSelect: isEditingAns?'text':'none'}}
              >
                {showIcon ? (
                  <span style={{width:36,height:36,borderRadius:8,background:'#f2f0ed',flexShrink:0,display:'grid',placeItems:'center',pointerEvents:'none'}}>{icon.startsWith('lucide:') ? <LucideIcon name={icon} size={18}/> : <span style={{fontSize:18}}>{icon}</span>}</span>
                ) : showImg ? (
                  <div className="answer-thumb" style={{pointerEvents:'none'}}><img src={`https://picsum.photos/seed/${cid}/80/80`} alt="" style={{pointerEvents:'none'}}/></div>
                ) : (
                  <div className="answer-thumb" style={{pointerEvents:'none',opacity: ans.icon?0.4:1}}><img src={`https://picsum.photos/seed/${cid}/80/80`} alt="" style={{pointerEvents:'none'}}/></div>
                )}
                <div
                  data-answer-id={cid}
                  contentEditable={isEditingAns}
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{__html: interpolateTokens(ans.content || '', scoreCtx)}}
                  onBlur={(e)=>{
                    const html=e.currentTarget.innerHTML||''
                    if(html!==ans.content) dispatch({type:'UPDATE_BLOCK_CONTENT', id:cid, content: html})
                    setEditingAnswerId(null)
                  }}
                  onKeyDown={(e)=>{
                    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); e.currentTarget.blur() }
                    if(e.key==='Escape'){ setEditingAnswerId(null); e.currentTarget.blur() }
                  }}
                  onClick={(e)=>{ if(isEditingAns) e.stopPropagation() }}
                  style={{fontSize: (ans.style?.size ? (SIZE_PRESETS[ans.style.size] ?? ans.style.size) : 13), lineHeight: ans.style?.lineHeight ?? block.style.lineHeight ?? 1.45, fontFamily: ans.style?.font || bodyFont, fontWeight: ans.style?.bold ? 700 : 600, fontStyle: ans.style?.italic ? 'italic':'normal', textDecoration: ans.style?.underline ? 'underline':'none', color: resolveColor(ans.style?.color, theme) || undefined, flex:1, outline:'none', cursor: isEditingAns?'text':'pointer', minWidth:0}}
                />
                {isAnsSelected && !isEditingAns && <span className="badge" style={{opacity:1, position:'absolute', top:-8, left:10, background:'var(--blue)', color:'#fff', borderColor:'var(--blue)'}}>Answer{ans.score?` · ${ans.score}pt`:''}{ans.tags?.length?` · ${ans.tags.join(',')}`:''}</span>}
                {ans.resultRef && <span style={{fontSize:10,background:'#111',color:'#fff',padding:'2px 6px',borderRadius:99, pointerEvents:'none'}}>{funnel.results.find(r=>r.id===ans.resultRef)?.letter || '→'}</span>}
                {ans.icon && !showIcon && <span style={{fontSize:10,color:'var(--faint)',pointerEvents:'none'}} title={ans.icon}>{ans.icon.slice(0,2)}</span>}
              </div>
            )
          })}
        </div>
        {block.content?.revealAnswers && <div style={{marginTop:10, fontSize:11, color:'var(--muted)'}}>Reveal answers: 42% chose option A · 28% B · 18% C · 12% D</div>}
        {block.autoAdvance && <div style={{fontSize:11,color:'var(--faint)',marginTop:6}}>Auto-advance after {block.autoAdvanceDelayMs}ms</div>}
      </div>
    )
  } else if(block.type==='answer'){
    inner = <div>{block.content}</div>
  } else if(block.type==='reviews'){
    const r = block.content || { rating:5, text:'“Great!”' }
    inner = <div style={{border:'1px solid var(--line)',borderRadius:12,padding:12,background:'#fff', textAlign:'center'}}>
      <div style={{color:'#f59e0b',fontSize:14}}>{'★'.repeat(r.rating||5)}</div>
      <div style={{fontSize:13,marginTop:6, fontStyle:'italic'}}>{r.text}</div>
      <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{r.author||''}</div>
    </div>
  } else if(block.type==='logo'){
    const logos = block.content?.logos || ['ACME','Globex']
    inner = <div style={{display:'flex',gap:12,justifyContent:'center',padding:10,background:'#f5f4f1',borderRadius:12, flexWrap:'wrap'}}>{logos.map((l,i)=><span key={i} style={{fontWeight:700,fontSize:12,padding:'6px 10px',background:'#fff',border:'1px solid var(--line)',borderRadius:8}}>{l}</span>)}</div>
  } else if(block.type==='testimonial'){
    const t = block.content || {text:'“Amazing”', author:'— You'}
    inner = <div style={{borderLeft:'3px solid #4a4a4a',padding:'8px 12px',fontStyle:'italic',background:'#fcfcfa',borderRadius:8}}><div style={{fontSize:14}}>{t.text}</div><div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{t.author}</div></div>
  } else if(block.type==='slider' || block.type==='graphic'){
    inner = <div className="img-wrap" style={{borderRadius: radius}}><img src={block.content} alt="" style={{width:'100%'}}/></div>
  } else if(block.type==='webinar'){
    const w = block.content||{title:'Webinar', date:''}
    inner = <div style={{border:'1px solid var(--line)',borderRadius:12,padding:12,background:'#fff'}}><div style={{fontWeight:700}}>{w.title}</div><div style={{fontSize:12,color:'var(--muted)'}}>{w.date}</div><button className="btn btn-filled" style={{background:buttonBg(theme),marginTop:8}}>Register</button></div>
  } else if(block.type==='faq'){
    const faqs = Array.isArray(block.content)? block.content : []
    inner = <div style={{display:'flex',flexDirection:'column',gap:6}}>{faqs.map((f,i)=><div key={i} style={{border:'1px solid var(--line)',borderRadius:8,padding:8,background:'#fff'}}><div style={{fontWeight:600,fontSize:13}}>{f.q}</div><div style={{fontSize:12,color:'var(--muted)'}}>{f.a}</div></div>)}</div>
  } else if(block.type==='countdown'){
    const c = block.content||{label:'Ends in', target:''}
    inner = <div style={{textAlign:'center',padding:12,background:'#111',color:'#fff',borderRadius:12}}><div style={{fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',opacity:.7}}>{c.label}</div><div style={{fontSize:22,fontWeight:700,marginTop:4}}>02 : 14 : 33</div></div>
  } else if(block.type==='loader'){
    const l = block.content||{label:'Loading…'}
    inner = <div style={{textAlign:'center',padding:16}}><div style={{width:24,height:24,border:'2px solid var(--line)',borderTopColor:'#4a4a4a',borderRadius:99,margin:'0 auto',animation:'spin 1s linear infinite'}}/><div style={{fontSize:12,marginTop:8}}>{l.label}</div></div>
  } else if(block.type==='embed'){
    const e = block.content||{provider:'Embed'}
    inner = <div style={{border:'1px dashed var(--line)',borderRadius:12,padding:16,textAlign:'center',background:'#fcfcfa'}}><div style={{fontSize:12,fontWeight:700}}>{e.provider}</div><div style={{fontSize:11,color:'var(--muted)'}}>{e.url||'https://example.com'}</div></div>
  }
  const isChildAnswer = block.parentId && funnel.blocksById[block.parentId]?.type==='quiz'
  if(isChildAnswer && depth===0) return null
  const bgStyle = bg==='transparent' ? {} : { background: bg }
  return (
    <div
      ref={blockRef}
      className={`block ${isSelected?'selected':''}`}
      style={{ ...bgStyle, paddingTop: block.style.spacingTop, paddingBottom: block.style.spacingBottom }}
      onClick={handleSelect}
    >
      <span className="badge">{block.type}</span>
      {inner}
    </div>
  )
}

// Portal toolbar — positioned over canvas-wrap, not clipped by frame
function FloatingToolbar({ selectedId }){
  const { funnel, dispatch, setSelectedBlockId } = useFunnel()
  const [pos,setPos]=useState(null)
  const block = selectedId ? funnel.blocksById[selectedId] : null
  useEffect(()=>{
    if(!selectedId) { setPos(null); return }
    const updatePos = ()=>{
      const found = document.querySelector(`[data-block-id="${selectedId}"]`)
      if(found){
        const r = found.getBoundingClientRect()
        // fixed positioning is viewport-relative
        setPos({ top: r.top + 8, left: r.right + 8 })
      }
    }
    updatePos()
    const wrap = document.querySelector('.canvas-wrap')
    const ro = new ResizeObserver(updatePos)
    if(wrap) ro.observe(wrap)
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    const t = setInterval(updatePos, 100)
    return ()=>{ ro.disconnect(); window.removeEventListener('scroll', updatePos, true); window.removeEventListener('resize', updatePos); clearInterval(t)}
  },[selectedId])
  if(!block || !pos) return null
  // child answers lose add/copy
  const isChild = !!block.parentId
  return (
    <div className="block-toolbar-portal" style={{ left: pos.left, top: pos.top }}>
      <div className="block-toolbar" onClick={e=>e.stopPropagation()}>
        {!isChild && <button title={`Add new block underneath ${block.type}`} onClick={()=>{
          const page = funnel.pages.find(p=>p.blocks.includes(block.id))
          if(page){
            const nb = { id: Math.random().toString(36).slice(2,9), type:'text', parentId:null, order:Date.now(), content:'New block — click to edit', style:{...block.style}, styleOverrides:{}, trackingId:`text_${Math.random().toString(36).slice(2,6)}`, linking:{mode:'always', always:{kind:'next'}}, children:[] }
            dispatch({type:'ADD_BLOCK', pageId: page.id, block: nb, afterId: block.id })
            setSelectedBlockId(nb.id)
          }
        }}>+<span className="tip">Add new block underneath {block.type}</span></button>}
        <button title={`Move ${block.type}`} draggable onDragStart={e=>{ e.dataTransfer.setData('text/plain', block.id) }}>≡<span className="tip">Move {block.type}</span></button>
        <button title={`Duplicate ${block.type}`} onClick={()=>{ dispatch({type:'DUPLICATE_BLOCK', id:block.id}); }} >⧉<span className="tip">Duplicate {block.type} — ⌘D</span></button>
        {!isChild && <button title={`Copy ${block.type}`} onClick={async()=>{
          try{ await navigator.clipboard.writeText(JSON.stringify(block)); }catch{}
        }}>📋<span className="tip">Copy {block.type} — ⌘C</span></button>}
        <button title={`Delete ${block.type}`} onClick={()=>{ dispatch({type:'DELETE_BLOCK', id:block.id}); setSelectedBlockId(null)}}>🗑<span className="tip">Delete {block.type} — Del</span></button>
      </div>
    </div>
  )
}

function Canvas({ previewBlock, setPreviewBlock, previewBlocks, setPreviewBlocks, safeSetPreview }){
  const { funnel, selectedPageId, selectedBlockId, setSelectedBlockId, device, setDevice, dispatch, canUndo, canRedo, undo, redo, makeBlock } = useFunnel()
  const page = funnel.pages.find(p=>p.id===selectedPageId) || funnel.pages[0]
  const theme = funnel.themes.find(t=>t.id===funnel.themeId) || funnel.themes[0]
  const [dragOverIdx,setDragOverIdx]=useState(null)
  const wrapRef=useRef(null)
  const deviceChrome = {
    mobile:  { label:'Phone', w:390, h:844, pad:10, radius:44 },
    tablet:  { label:'Tablet', w:834, h:1194, pad:14, radius:28 },
    desktop: { label:'Browser', w:960, h:640, pad:0, radius:12 },
  }[device] || { label:'Phone', w:390, h:844, pad:10, radius:44 }
  const { w, h, pad, radius } = deviceChrome
  const outerW = w + pad*2
  const outerH = h + pad*2
  const [win,setWin]=useState({ w: typeof window!=='undefined'? window.innerWidth:1280, h: typeof window!=='undefined'? window.innerHeight:800 })
  useEffect(()=>{
    const onR=()=> setWin({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onR)
    return ()=> window.removeEventListener('resize', onR)
  },[])
  const railW = 320
  const topbarH = 56
  const availW = Math.max(320, win.w - railW - 48)
  const availH = Math.max(400, win.h - topbarH - 48)
  const scale = Math.min(1, availW / outerW, availH / outerH)

  useEffect(()=>{
    const onPaste = async ()=>{
      if(!page) return
      try{
        const txt = await navigator.clipboard.readText()
        const data = JSON.parse(txt)
        if(data && data.type && data.content !== undefined){
          const nb = { ...data, id: Math.random().toString(36).slice(2,9), trackingId:`${data.type}_${Math.random().toString(36).slice(2,5)}` }
          if(nb.children && Array.isArray(nb.children)){
            // quiz paste: children are ids, not blocks — strip to avoid orphan
            nb.children=[]
          }
          dispatch({type:'ADD_BLOCK', pageId: page.id, block: nb})
        }
      }catch{}
    }
    const onKey = (e)=>{
      if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='v'){
        if(document.activeElement?.isContentEditable) return
        onPaste()
      }
    }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[page,dispatch])

  const progress = page ? Math.round((page.index / funnel.pages.length)*100) : 0

  const pageBg = resolveBg(page?.background, theme)
  const funnelBg = resolveBg(funnel.settings.funnelBackground, theme)
  const frameBgStyle = pageBg ? (pageBg.includes('gradient') ? { background: pageBg } : { backgroundColor: pageBg }) : {}
  const wrapBgStyle = funnelBg ? (funnelBg.includes('gradient') ? { background: funnelBg } : { backgroundColor: funnelBg }) : {}

  const pageBgInner = pageBg ? (pageBg.includes('gradient') ? { background: pageBg } : { background: pageBg }) : { background:'#fff' }
  return (
    <div ref={wrapRef} className={`canvas-wrap ${device==='desktop'?'device-desktop':''}`} onClick={()=>setSelectedBlockId(null)} style={{...wrapBgStyle, overflow:'auto', display:'flex', justifyContent:'center', alignItems:'flex-start', padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{ width: outerW, height: outerH, transform:`scale(${scale})`, transformOrigin:'top center', transition:'all .32s cubic-bezier(.2,.8,.2,1)', filter:'drop-shadow(0 20px 48px rgba(0,0,0,.18))', flexShrink:0}}>
        <div style={{ background: device==='desktop' ? '#fff' : '#0a0a0a', borderRadius: radius, padding: pad, boxSizing:'content-box', width: w, height: h, border: device==='desktop' ? '1px solid #d6d2cc' : 'none', overflow:'hidden'}}>
          <div style={{ width: w, height: h, ...pageBgInner, borderRadius: Math.max(0, radius - pad), overflow:'hidden', position:'relative', display:'flex', flexDirection:'column', fontFamily: theme.font }}>
            {device==='mobile' && (
              <>
                <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:90,height:22,background:'#0a0a0a',borderRadius:'0 0 14px 14px',zIndex:2}}/>
                <div style={{height:28,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'24px 18px 0',fontSize:11,fontWeight:700,borderBottom:'1px solid #f2f0ed', flexShrink:0, boxSizing:'border-box', background:'rgba(255,255,255,.92)'}}><span>9:41</span><span style={{display:'flex',gap:4}}><span>●●●</span><span style={{opacity:.5}}>◧</span></span></div>
              </>
            )}
            {device==='tablet' && (
              <div style={{height:22,background:'#f5f4f1',display:'flex',alignItems:'center',justifyContent:'center',gap:6,borderBottom:'1px solid #e8e6e1', flexShrink:0}}><span style={{width:32,height:4,background:'#d6d2cc',borderRadius:99}}/><span style={{width:6,height:6,borderRadius:99,background:'#111',opacity:.2}}/></div>
            )}
            {device==='desktop' && (
              <div style={{height:36,background:'#f5f4f1',display:'flex',alignItems:'center',gap:8,padding:'0 12px',borderBottom:'1px solid #e8e6e1', flexShrink:0}}>
                <span style={{display:'flex',gap:6}}><span style={{width:12,height:12,borderRadius:99,background:'#ff5f56'}}/><span style={{width:12,height:12,borderRadius:99,background:'#ffbd2e'}}/><span style={{width:12,height:12,borderRadius:99,background:'#27c93f'}}/></span>
                <span style={{flex:1,background:'#fff',border:'1px solid #e8e6e1',borderRadius:99,padding:'5px 12px',fontSize:12,color:'#6b6b6b',display:'flex',alignItems:'center',gap:6}}><span style={{opacity:.5}}>🔒</span> perspective.test/{page?.slug || 'welcome'}</span>
              </div>
            )}
            {(funnel.settings.progressStyle ? funnel.settings.progressStyle!=='hidden' : funnel.settings.progressBar) && (
              <div style={{height: (funnel.settings.progressStyle==='thin'?2:4), background:'#efede9', flexShrink:0, borderRadius:99, overflow:'hidden', margin:'6px 10px 0'}}>
                <div style={{width:`${progress}%`, height:'100%', background: theme.colors[2], transition:'width .3s', borderRadius:99}}/>
              </div>
            )}
            {funnel.settings.legal?.bannerText && (
              <div style={{background: theme.colors[2], color:'#fff', textAlign:'center', padding:'6px 10px', fontSize:11, fontWeight:600, flexShrink:0}}>{funnel.settings.legal.bannerText}</div>
            )}
            <div key={page?.id} className={`canvas-inner ${(!theme.disableAnimation && theme.transition && theme.transition!=='none') ? `page-anim pt-${theme.transition}` : ''}`} onDragOver={e=>e.preventDefault()} style={{flex:1, overflowY:'auto', padding: device==='mobile' ? '12px 16px 18px' : device==='tablet' ? '18px' : '20px', display:'flex', flexDirection:'column', gap:0}}>
              {device==='mobile' && <div style={{width:36,height:4,background:'#e8e6e1',borderRadius:99,margin:'0 auto 10px', flexShrink:0}}/>}
          {(page?.blocks||[]).map((bid, idx)=>(
            <div key={bid} data-block-id={bid}
              onDragOver={e=>{ e.preventDefault(); setDragOverIdx(idx)}}
              onDrop={e=>{
                const fromId = e.dataTransfer.getData('text/plain')
                const fromIdx = page.blocks.indexOf(fromId)
                if(fromIdx>=0 && fromIdx!==idx){
                  dispatch({type:'MOVE_BLOCK', pageId: page.id, from: fromIdx, to: idx})
                }
                setDragOverIdx(null)
              }}
              style={{ borderTop: dragOverIdx===idx?'2px solid var(--blue)':'2px solid transparent'}}
            >
              <BlockRenderer blockId={bid} />
            </div>
          ))}
          {previewBlock && (
            <div className="block preview" style={{position:'relative', marginBottom:24}}>
              <span className="badge" style={{opacity:1}}>Preview</span>
              <div style={{padding:'8px 0', color:'var(--muted)', fontSize:13}}>
                {previewBlock.type==='text' && <div style={{color:'#0f0f0f'}} dangerouslySetInnerHTML={{__html: previewBlock.content}} />}
                {previewBlock.type==='button' && <button className="btn btn-filled" style={{background:buttonBg(theme)}} dangerouslySetInnerHTML={{__html: previewBlock.content}} />}
                {previewBlock.type==='image' && <div className="img-wrap"><img src={previewBlock.content} alt="" /></div>}
                {previewBlock.type==='reviews' && <div style={{textAlign:'center',padding:8,border:'1px solid var(--line)',borderRadius:8,background:'#fff'}}><div style={{color:'#f59e0b'}}>{'★'.repeat(5)}</div><div style={{fontSize:12,marginTop:4, color:'#111'}}>{previewBlock.content?.text || 'Reviews preview'}</div></div>}
                {previewBlock.type==='logo' && <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>{(previewBlock.content?.logos||['ACME','Globex']).map((l,i)=><span key={i} style={{fontSize:11,padding:'4px 8px',background:'#f5f4f1',borderRadius:6,border:'1px solid var(--line)'}}>{l}</span>)}</div>}
                {previewBlock.type==='testimonial' && <div style={{borderLeft:'3px solid #4a4a4a',padding:'6px 8px',fontStyle:'italic',background:'#fcfcfa',borderRadius:6, color:'#111'}}>{previewBlock.content?.text || 'Testimonial preview'}</div>}
                {previewBlock.type==='slider' && <div className="img-wrap"><img src={previewBlock.content} alt="" /></div>}
                {previewBlock.type==='graphic' && <div className="img-wrap"><img src={previewBlock.content} alt="" /></div>}
                {previewBlock.type==='webinar' && <div style={{fontWeight:700, color:'#111'}}>{previewBlock.content?.title || 'Webinar preview'}</div>}
                {previewBlock.type==='faq' && <div style={{fontSize:12, color:'#111'}}>FAQ — {Array.isArray(previewBlock.content)? previewBlock.content.length:2} items</div>}
                {previewBlock.type==='countdown' && <div style={{textAlign:'center',background:'#111',color:'#fff',padding:8,borderRadius:8}}>02 : 14 : 33</div>}
                {previewBlock.type==='loader' && <div style={{textAlign:'center',color:'#111'}}>Loading…</div>}
                {previewBlock.type==='embed' && <div style={{textAlign:'center',padding:8,border:'1px dashed var(--line)',borderRadius:8, color:'#111'}}>{previewBlock.content?.provider || 'Embed'} preview</div>}
                {previewBlock.type==='quiz' && (
                  <div className="quiz-wrap">
                    <div style={{fontWeight:700, color:'#111'}}>{previewBlock.content.question}</div>
                    <div style={{marginTop:8, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                      {(previewBlock.children||[]).map(cid=> <div key={cid} className="answer-card" style={{padding:8,fontSize:12, color:'#111'}}>{ (previewBlock._extra && previewBlock._extra[cid]?.content) || 'Option'}</div>)}
                    </div>
                  </div>
                )}
                {previewBlock.type==='divider' && <div className="divider"/>}
                {previewBlock.type==='list' && <ul className="list" style={{color:'#111'}}><li>{Array.isArray(previewBlock.content)? previewBlock.content[0] : 'List preview'}</li></ul>}
                {previewBlock.type==='video' && <div className="video-box">Video preview</div>}
                {previewBlock.type==='form' && (
                  <div className="form-box" style={{border:'1px solid var(--line)',borderRadius:8,padding:10,background:'#fafaf8',display:'flex',flexDirection:'column',gap:6}}>
                    {previewBlock.content?.formTitle && <div style={{fontWeight:600,fontSize:12}}>{previewBlock.content.formTitle}</div>}
                    {(previewBlock.content?.fields||[]).slice(0,3).map(f=>(
                      <div key={f.id} style={{display:'flex',flexDirection:'column',gap:2}}>
                        {f.label ? <span style={{fontSize:11,fontWeight:600}}>{f.label}{f.required?' *':''}</span>:null}
                        <div style={{height:28,background:'#fff',border:'1px solid var(--line)',borderRadius:6,display:'flex',alignItems:'center',padding:'0 8px',fontSize:11,color:'var(--faint)'}}>{f.placeholder||f.type}</div>
                        {f.helperText && <span style={{fontSize:10,color:'var(--faint)'}}>{f.helperText}</span>}
                      </div>
                    ))}
                    {(previewBlock.content?.fields||[]).length>3 && <div style={{fontSize:11,color:'var(--faint)'}}>+{(previewBlock.content.fields.length-3)} more fields</div>}
                    <button className="btn btn-filled" style={{background:buttonBg(theme),fontSize:12,padding:'6px 10px'}}>{previewBlock.content?.submitLabel||'Continue'}</button>
                  </div>
                )}
              </div>
              <div className="confirm-bar vertical">
                <button className="confirm-yes" title="Confirm (save)" onClick={()=>{
                  const extra = previewBlock._extra || null
                  const toAdd = { ...previewBlock }; delete toAdd._extra
                  const targetPageId = page?.id || funnel.pages[0]?.id
                  if(!targetPageId) return
                  dispatch({type:'ADD_BLOCK', pageId: targetPageId, block: toAdd, extraBlocks: extra})
                  setSelectedBlockId(toAdd.id)
                  setPreviewBlock(null)
                }}>✓</button>
                <button className="confirm-no" title="Cancel" onClick={()=>setPreviewBlock(null)}>✕</button>
              </div>
            </div>
          )}
          {previewBlocks && (
            <div className="block preview" style={{position:'relative', marginBottom:24}}>
              <span className="badge" style={{opacity:1}}>Preview — {previewBlocks.length} blocks</span>
              <div style={{padding:'8px 0', display:'flex', flexDirection:'column', gap:8}}>
                {previewBlocks.map(pb=>(
                  <div key={pb.id} style={{border:'1px dashed #d6d2cc', borderRadius:8, padding:8, background:'#fff'}}>
                    {pb.type==='text' && <div style={{color:'#0f0f0f'}} dangerouslySetInnerHTML={{__html: pb.content}} />}
                    {pb.type==='button' && <button className="btn btn-filled" style={{background:buttonBg(theme), display:'inline-flex'}} dangerouslySetInnerHTML={{__html: pb.content}} />}
                    {pb.type==='image' && <div className="img-wrap" style={{borderRadius:8}}><img src={pb.content} alt="" /></div>}
                    {pb.type==='list' && <ul className="list" style={{color:'#111', margin:0}}>{(Array.isArray(pb.content)?pb.content:[]).slice(0,3).map((li,i)=><li key={i} style={{fontSize:13}}>{li}</li>)}</ul>}
                    {pb.type==='divider' && <div className="divider"/>}
                    {pb.type==='reviews' && <div style={{textAlign:'center',padding:6,border:'1px solid var(--line)',borderRadius:8,background:'#fff'}}><div style={{color:'#f59e0b',fontSize:12}}>{'★'.repeat(5)}</div><div style={{fontSize:11,marginTop:2,color:'#111'}}>{pb.content?.text || 'Reviews'}</div></div>}
                    {pb.type==='logo' && <div style={{display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap'}}>{(pb.content?.logos||['ACME','Globex']).slice(0,4).map((l,i)=><span key={i} style={{fontSize:10,padding:'3px 6px',background:'#f5f4f1',borderRadius:6,border:'1px solid var(--line)'}}>{l}</span>)}</div>}
                    {pb.type==='testimonial' && <div style={{borderLeft:'3px solid #4a4a4a',padding:'4px 8px',fontStyle:'italic',background:'#fcfcfa',borderRadius:6,color:'#111',fontSize:12}}>{pb.content?.text || '“Amazing”'}</div>}
                    {pb.type==='slider' && <div className="img-wrap"><img src={pb.content} alt="" /></div>}
                    {pb.type==='graphic' && <div className="img-wrap"><img src={pb.content} alt="" /></div>}
                    {pb.type==='webinar' && <div style={{fontWeight:600,color:'#111',fontSize:12}}>{pb.content?.title || 'Webinar'}</div>}
                    {pb.type==='faq' && <div style={{fontSize:11,color:'#111'}}>FAQ — {Array.isArray(pb.content)?pb.content.length:2} items</div>}
                    {pb.type==='countdown' && <div style={{textAlign:'center',background:'#111',color:'#fff',padding:6,borderRadius:6,fontSize:12}}>02 : 14 : 33</div>}
                    {pb.type==='loader' && <div style={{textAlign:'center',color:'#111',fontSize:12}}>Loading…</div>}
                    {pb.type==='embed' && <div style={{textAlign:'center',padding:6,border:'1px dashed var(--line)',borderRadius:6,color:'#111',fontSize:11}}>{pb.content?.provider || 'Embed'}</div>}
                    {pb.type==='video' && <div style={{textAlign:'center',padding:6,background:'#000',color:'#fff',borderRadius:6,fontSize:11}}>Video</div>}
                    {pb.type==='form' && (
                      <div style={{border:'1px solid var(--line)',borderRadius:6,padding:6,background:'#fafaf8',display:'flex',flexDirection:'column',gap:4}}>
                        {pb.content?.formTitle && <div style={{fontSize:11,fontWeight:600}}>{pb.content.formTitle}</div>}
                        {(pb.content?.fields||[{label:pb.content?.label}]).slice(0,2).map((f,i)=>(
                          <div key={f.id||i} style={{fontSize:11}}>{f.label ? <span style={{fontWeight:600}}>{f.label}{f.required?' *':''}</span> : <span style={{fontSize:11,color:'var(--faint)'}}>{f.placeholder||f.type||'Field'}</span>}{f.helperText ? <div style={{fontSize:10,color:'var(--faint)'}}>{f.helperText}</div> : null}</div>
                        ))}
                        {(pb.content?.fields||[]).length>2 && <div style={{fontSize:10,color:'var(--faint)'}}>+{pb.content.fields.length-2} more</div>}
                        <div style={{height:24,background:'#fff',border:'1px solid var(--line)',borderRadius:6,marginTop:2}} />
                      </div>
                    )}
                    {pb.type==='quiz' && (
                      <div>
                        <div style={{fontWeight:700,color:'#111',fontSize:13}} dangerouslySetInnerHTML={{__html: pb.content?.question || 'Question'}} />
                        <div style={{marginTop:6, display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
                          {(pb.children||[]).map(cid=> <div key={cid} style={{padding:'6px 8px',fontSize:11,background:'#f5f4f1',border:'1px solid var(--line)',borderRadius:6,color:'#111'}}>{ (pb._extra && pb._extra[cid]?.content) || 'Option'}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="confirm-bar vertical">
                <button className="confirm-yes" title="Confirm section (add all blocks)" onClick={()=>{
                  const targetPageId = page?.id || funnel.pages[0]?.id
                  if(!targetPageId) return
                  let firstId=null
                  previewBlocks.forEach(pb=>{
                    const extra = pb._extra || null
                    const toAdd = { ...pb }; delete toAdd._extra
                    if(!firstId) firstId=toAdd.id
                    dispatch({type:'ADD_BLOCK', pageId: targetPageId, block: toAdd, extraBlocks: extra})
                  })
                  if(firstId) setSelectedBlockId(firstId)
                  setPreviewBlocks(null)
                }}>✓</button>
                <button className="confirm-no" title="Cancel" onClick={()=>setPreviewBlocks(null)}>✕</button>
              </div>
            </div>
          )}
          <button className="add-block-btn" title="New Block" onClick={()=>{
            if(previewBlock || previewBlocks){
              const bar = document.querySelector('.confirm-bar')
              if(bar){ bar.animate([{transform:'translateX(-50%) scale(1)'},{transform:'translateX(-50%) scale(1.08)'},{transform:'translateX(-50%) scale(1)'}],{duration:300}) }
              return
            }
            window.dispatchEvent(new CustomEvent('open-library'))
          }}>+</button>
          {funnel.settings.legal?.footerDisclaimer && (
            <div style={{marginTop:16,padding:'10px 12px',background:'#f5f4f1',border:'1px solid var(--line)',borderRadius:8,fontSize:11,color:'var(--muted)',textAlign:'center'}}>{funnel.settings.legal.footerDisclaimer} {funnel.settings.legal?.privacyUrl && <><a href={funnel.settings.legal.privacyUrl} target="_blank" rel="noreferrer" style={{color:theme.colors[2],fontWeight:600}}>Privacy</a> </>}{funnel.settings.legal?.termsUrl && <a href={funnel.settings.legal.termsUrl} target="_blank" rel="noreferrer" style={{color:theme.colors[2],fontWeight:600}}>Terms</a>}</div>
          )}
          </div>
        </div>
      </div>
    </div>

      <FloatingToolbar selectedId={selectedBlockId} />

      <div className="canvas-toolbar">
        <button className={device==='mobile'?'active':''} title="Phone" onClick={()=>setDevice('mobile')}>◱</button>
        <button className={device==='tablet'?'active':''} title="Tablet" onClick={()=>setDevice('tablet')}>▭</button>
        <button className={device==='desktop'?'active':''} title="Browser" onClick={()=>setDevice('desktop')}>▭</button>
        <span style={{width:1,height:18,background:'var(--line)',margin:'0 4px'}}/>
        <button onClick={undo} style={{opacity: canUndo?1:.35}} title="Undo ⌘Z">↺</button>
        <button onClick={redo} style={{opacity: canRedo?1:.35}} title="Redo ⇧⌘Z">↻</button>
      </div>
    </div>
  )
}

function Shell(){
  const { funnel, published } = useFunnel()
  const theme = funnel.themes.find(t=>t.id===funnel.themeId) || funnel.themes[0]
  const [previewBlock,setPreviewBlock]=useState(null)
  const [previewBlocks,setPreviewBlocks]=useState(null)
  const safeSetPreview = (blk)=>{
    if((previewBlock || previewBlocks) && blk){
      const bar = document.querySelector('.confirm-bar')
      if(bar){ bar.animate([{transform:'translateX(-50%) scale(1)'},{transform:'translateX(-50%) scale(1.08)'},{transform:'translateX(-50%) scale(1)'}],{duration:300}) }
      return
    }
    if(Array.isArray(blk)){
      setPreviewBlocks(blk)
    } else {
      setPreviewBlock(blk)
    }
  }
  useEffect(()=>{
    document.documentElement.style.setProperty('--theme-bg', theme.colors[0])
    document.documentElement.style.setProperty('--theme-fg', theme.colors[1])
    document.documentElement.style.setProperty('--theme-accent', theme.colors[2])
    document.documentElement.style.setProperty('--theme-accent2', theme.colors[3])
    // P8: headline vs body font variables
    document.documentElement.style.setProperty('--theme-font', theme.font)
    document.documentElement.style.setProperty('--theme-body-font', theme.bodyFont||theme.font)
  },[theme])

  return (
    <div className="shell">
      <TopBar />
      <div className="main">
        <LeftRail onRequestAdd={(blk, extra)=>{
          if(Array.isArray(blk)){
            // attach extra map to any quiz blocks if provided (sections don't use separate extra)
            if(extra && Object.keys(extra).length){
              blk.forEach(b=>{ if(b.type==='quiz' && !b._extra) b._extra = extra })
            }
            safeSetPreview(blk)
          } else {
            if(extra) blk._extra=extra
            safeSetPreview(blk)
          }
        }} />
        <Canvas previewBlock={previewBlock} setPreviewBlock={setPreviewBlock} previewBlocks={previewBlocks} setPreviewBlocks={setPreviewBlocks} safeSetPreview={safeSetPreview} />
      </div>
      {published && <div className="toast">Funnel is live — draft vs. live split active</div>}
    </div>
  )
}

export default function App(){
  return (
    <FunnelProvider>
      <Shell/>
    </FunnelProvider>
  )
}
