/** Wall Street 2.0 website controller: PowerPoint slide viewer, lab and source explorer. */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const htmlEscape = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let slides = window.SLIDE_DATA || [];
let slideIndex = 0;
let scenario = 'success', run = null, shown = 0;
let activeFile = 'python', activeSection = 'intro';
const slideTips = [
 'The full interactive simulator starts in the Transaction lab.',
 'Actual 2026 proof of concept: EUR liquidity. Our USD/KRW case is invented for teaching.',
 'One concrete transaction: Hyundai buys $100,000 USD for ₩145 million.',
 'Agent reasoning is not the same as executing a banking action.',
 'Select “Chat only” in the lab: the ledger will stay untouched.',
 'Every tool is an authenticated interface to a trusted service.',
 'Hyundai cannot debit or override a bank account by chatting.',
 'JPMorgan checks client permissions before quoting or executing.',
 'Agents exchange typed messages; the bank’s controls remain authoritative.',
 'System prompts teach behavior, but permissions enforce real authority.',
 'Typed requests include identity, currency, account, quote ID and request ID.',
 'Try the “Public forum” scenario to see why a Reddit post is unsafe.',
 'Sender identity requires verification; a displayed name is insufficient.',
 'Try “Too large” and “Bank tighter” to see separate policy vetoes.',
 'Business policy values are versioned; deterministic checks are implemented in code.',
 'Run the six-step narrative in the transaction lab, then drill down into source.',
 'Try failure scenarios including stale quotes, unapproved accounts and retries.',
 'The Python FXRequest explicitly types the money and the settlement account.',
 'Read check_policy to see independent per-trade, daily and account checks.',
 'The LLM proposes; bank-owned tools quote and settle.',
 'A request ID protects against accidental second debits on retries.',
 'Run the Python demo locally: python agent_fx_demo.py.',
 'Scaling introduces cascades and operational risk; controls must scale first.',
 'The takeaway: a convincing conversation is not a bank payment.'
];
const slideViews = {0:'deck',1:'deck',2:'lab',3:'code',4:'lab',5:'lab',6:'code',7:'code',8:'lab',9:'code',10:'lab',11:'lab',12:'lab',13:'policies',14:'policies',15:'lab',16:'lab',17:'code',18:'code',19:'code',20:'code',21:'lab',22:'policies',23:'lab'};
const codeSections = {
 python: [
  ['intro','File overview',1,'Two simulated agents and the trusted services that enforce all financial actions.'],
  ['identity','Agent identity',14,'The identity contains an agent ID, organization and demo credential. Real deployments require short-lived cryptographic identity.'],
  ['request','FX request + quote',20,'Every request is bound to a unique ID, explicit currencies and an allowlisted settlement account.'],
  ['policy','Policy data model',40,'Hyundai and JPMorgan have independently approved transaction limits and eligible accounts.'],
  ['services','Trusted service',49,'These tools are the security boundary. The model cannot bypass their checks to touch a ledger.'],
  ['auth','Authenticate sender',63,'Only registered, authenticated service identities may access the banking APIs.'],
  ['checks','Enforce two policies',69,'Both policy objects are checked deterministically, including currency pair, per-trade limit, account and daily amount.'],
  ['balance','Read balance',81,'The available balance is retrieved from a trusted service—not invented by a language model.'],
  ['quote','Issue verified quote',85,'The quote is constructed using bank-owned pricing and expires after 30 seconds.'],
  ['execution','Execute and audit',93,'Execution authenticates both parties, repeats controls, verifies quote binding, then changes simulated balances.'],
  ['hyundai','Hyundai agent',125,'The treasury agent creates a request using the approved tool and its service identity.'],
  ['jpmorgan','JPMorgan agent',140,'The bank agent authenticates the customer and delegates pricing and settlement to trusted services.'],
  ['demo','Runnable scenarios',156,'The main example executes a permitted trade, retries safely, and denies a $600,000 request.']
 ],
 web:[['intro','Web simulator',1,'This is a browser-only demonstration. It never connects to the bank or transfers money.'],['policy','Independent policies',23,'Hyundai and JPMorgan policies are separate constants; a bank-tightened test illustrates independent rejection.'],['check','checkPolicy()',39,'A deterministic function, rather than generated text, decides whether the action is authorized.'],['run','createRun()',52,'Every simulator run produces an event trace and a final verdict.'],['chat','No-tools outcome',71,'Agents can chat but have no trusted ledger or action tool.'],['forum','Public-forum spoof',85,'Public posts are untrusted and cannot be treated as bank-issued quotes.'],['execution','Ledger + retry',140,'A successful trade posts exactly once; replay returns the original receipt.']],
 notes:[['intro','Architecture and use',1,'Read the simulation limitations and security controls needed for a real production banking architecture.']]
};
const sectionLineRegex = {python:{identity:/^class AgentIdentity/,request:/^class FXRequest/,policy:/^class Policy:/,services:/^class TrustedServices:/,auth:/^    def authenticate\(/,checks:/^    def check_policy\(/,balance:/^    def get_balance\(/,quote:/^    def request_quote\(/,execution:/^    def execute\(/,hyundai:/^class HyundaiAgent:/,jpmorgan:/^class JPMorganAgent:/,demo:/^def demo\(/},web:{policy:/^  const HYUNDAI_POLICY/,check:/^  function checkPolicy/,run:/^  function createRun/,chat:/^    if \(scenario === 'noTools'/,forum:/^    if \(scenario === 'spoof'/,execution:/^    balance -= quote\.sellKrw/}};

function showView(view){
 $$('.view').forEach(x=>x.classList.toggle('active',x.id===view+'View'));
 $$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
 $('#currentViewName').textContent=({deck:'Presentation',lab:'Transaction lab',code:'Source explorer',policies:'Guardrails'})[view];
 $('#sidebar').classList.remove('open');
 window.scrollTo({top:0,behavior:'smooth'});
 if(view==='code') showCode();
}
function drawSlide(){const s=slides[slideIndex];if(!s)return;
 $('#mainSlide').src=s.image; $('#mainSlide').alt=`PowerPoint slide ${s.id}: ${s.title.replace(/\n/g,' ')}`;
 $('#slideKicker').textContent=s.kicker;$('#slideNumber').textContent='SLIDE '+String(s.id).padStart(2,'0')+' / '+slides.length;
 $('#slideProgress').textContent=String(s.id).padStart(2,'0')+' / '+slides.length;
 $('#slideTitle').textContent=s.title.replace(/\n/g,' ');$('#slideSubtitle').textContent=s.subtitle;
 $('#slideTip').textContent=slideTips[slideIndex]||'Open the simulator to practice this concept.';
 $$('#slideNav button').forEach((b,i)=>b.classList.toggle('active',i===slideIndex));
 $('#prevSlide').disabled=slideIndex===0;$('#nextSlide').disabled=slideIndex===slides.length-1;
}
function selectSlide(i){slideIndex=Math.max(0,Math.min(slides.length-1,i));drawSlide();showView('deck');}
function selectScenario(next){scenario=next;run=null;shown=0;
 $$('.scenario').forEach(b=>b.classList.toggle('active',b.dataset.scenario===scenario));
 $('#trace').innerHTML='<div class="empty-state">Select <strong>Run transaction</strong> or <strong>Next event</strong> to examine the outcome.</div>';
 $('#runState').textContent='Ready to simulate';$('#eventCounter').textContent='0 EVENTS';
 $('#verdict').textContent='NOT STARTED';$('#verdict').className='verdict idle';$('#verdictExplain').textContent='No transaction has been submitted.';
 const sample=FX.createRun(scenario);$('#usdValue').textContent=FX.formatted(sample.usd);
 $('#krwValue').textContent=FX.formatted(sample.usd*FX.KRW_PER_USD);
 $('#accountValue').textContent=sample.account;$('#bankCap').textContent='$'+FX.formatted(sample.bankCap);
 $('#ledgerBalance').textContent='₩'+FX.formatted(FX.INITIAL_BALANCE_KRW);$('#ledgerPosts').textContent='0';
}
function renderEvent(e){const el=document.createElement('div');el.className='trace-event '+e.type;
 el.innerHTML=`<header><b>${htmlEscape(e.by)}</b><span>EVENT ${String(e.numbered).padStart(2,'0')}</span></header><p><strong>${htmlEscape(e.title)}</strong><br>${htmlEscape(e.body)}</p><code>${htmlEscape(e.tool)}</code><p style="color:#7c8da0;font-size:11px;margin-bottom:0">WHY: ${htmlEscape(e.explanation)}</p><button type="button">↳ Inspect source for this step</button>`;
 el.querySelector('button').addEventListener('click',()=>{
  const sec=e.type==='denied'?'checks':e.type==='replay'?'execution':e.type==='chat'?'hyundai':e.type==='policy'?'checks':e.tool.includes('quote')?'quote':e.tool.includes('balance')?'balance':e.type==='jp'?'jpmorgan':'hyundai';
  activeFile='python';activeSection=sec;showView('code');
 });return el;}
function stepRun(all=false){if(!run){run=FX.createRun(scenario);shown=0;$('#trace').innerHTML='';}
 if(all){shown=run.events.length;$('#trace').replaceChildren(...run.events.map(renderEvent));}
 else if(shown<run.events.length){$('#trace').appendChild(renderEvent(run.events[shown]));shown++;}
 if(shown){const latest=run.events[shown-1];$('#ledgerBalance').textContent='₩'+FX.formatted(latest.balance);$('#ledgerPosts').textContent=String(latest.postings);}
 $('#eventCounter').textContent=shown+' / '+run.events.length+' EVENTS';
 if(shown>=run.events.length){$('#verdict').textContent=run.verdict;$('#verdict').className='verdict '+(run.verdict==='SIMULATED_SETTLED'?'approved':'blocked');$('#verdictExplain').textContent=run.reason;$('#runState').textContent='Simulation finished';}
 else $('#runState').textContent='Step '+shown+' of '+run.events.length;
 $('#trace').scrollTop=$('#trace').scrollHeight;
}
function tokenized(line,language){
 // Each token gets its own span. Original characters are always HTML-escaped.
 // Order is important: strings/comments must not be keyword-highlighted inside.
 const re=language==='python'
 ? /(#[^\n]*|""".*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[A-Za-z_]+|\b(?:class|def|return|if|elif|else|raise|not|in|and|or|from|import|True|False|None|try|except|for|while|with|as|pass|self)\b|\b\d+(?:_\d+)*(?:\.\d+)?\b|\b[A-Za-z_]\w*(?=\())/g
 : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|function|return|if|else|throw|new|class|true|false|null|undefined|try|catch)\b|\b\d+(?:_\d+)*(?:\.\d+)?\b|\b[A-Za-z_]\w*(?=\())/g;
 let out='',last=0,match;
 while((match=re.exec(line))){out+=htmlEscape(line.slice(last,match.index));const t=match[0];const cat=/^(#|\/\/|\/\*)/.test(t)?'comment':/^("|'|`)/.test(t)?'string':/^@/.test(t)?'decorator':/^\d/.test(t)?'number':/^(class|def|return|if|elif|else|raise|not|in|and|or|from|import|True|False|None|try|except|for|while|with|as|pass|self|const|let|function|throw|new|true|false|null|undefined|catch)$/.test(t)?'keyword':'function';out+=`<span class="token ${cat}">${htmlEscape(t)}</span>`;last=match.index+t.length;}
 return out+htmlEscape(line.slice(last));
}
function sectionLine(file,section){let re=sectionLineRegex[file]?.[section];if(!re)return 1;const rows=(window.SOURCE_FILES?.[file]||'').split('\n');const at=rows.findIndex(x=>re.test(x));return at<0?1:at+1;}
function showCode(){
 $$('.file-select').forEach(b=>b.classList.toggle('active',b.dataset.file===activeFile));
 const options=codeSections[activeFile]||[];
 $('#codeSections').innerHTML='';options.forEach(([key,label,,description])=>{const b=document.createElement('button');b.className='section-link '+(activeSection===key?'active':'');b.textContent='↳ '+label;b.addEventListener('click',()=>{activeSection=key;showCode()});$('#codeSections').appendChild(b);});
 const source=window.SOURCE_FILES?.[activeFile] || '# Source file unavailable.\n';const lines=source.replace(/\r/g,'').split('\n');const target=sectionLine(activeFile,activeSection);
 $('#codeDisplay').innerHTML=lines.map((line,i)=>`<span class="code-line ${i+1>=target&&i+1<target+8?'highlight':''}" id="L${i+1}"><span class="line-number">${i+1}</span>${tokenized(line,activeFile)}</span>`).join('');
 $('#fileBadge').textContent=activeFile==='python'?'agent_fx_demo.py':activeFile==='web'?'simulator.js':'ARCHITECTURE.md';
 $('#codeLineInfo').textContent=lines.length+' lines · highlighted syntax';
 const matching=options.find(o=>o[0]===activeSection)||options[0];$('#codeExplanationTitle').textContent=matching[1];$('#codeExplanation').textContent=matching[3];
 const targetEl=$('#L'+target);if(targetEl){$('#codeDisplay').parentElement.scrollTop=Math.max(0,targetEl.offsetTop-$('#codeDisplay').offsetTop-35);}
}
function init(){
 const nav=$('#slideNav');slides.forEach((s,i)=>{const b=document.createElement('button');b.innerHTML=`<span class="num">${String(s.id).padStart(2,'0')}</span><span>${htmlEscape(s.title.replace(/\n/g,' '))}</span>`;b.addEventListener('click',()=>selectSlide(i));nav.appendChild(b);});
 drawSlide();$$('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
 $('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
 $('#nextSlide').addEventListener('click',()=>selectSlide(slideIndex+1));$('#prevSlide').addEventListener('click',()=>selectSlide(slideIndex-1));
 $('#slideAction').addEventListener('click',()=>{if(slideViews[slideIndex]==='code'){activeFile='python';activeSection=slideIndex>=20?'execution':slideIndex>=18?'checks':slideIndex===17?'request':'hyundai';}showView(slideViews[slideIndex]||'lab')});
 document.addEventListener('keydown',e=>{if(!$('#deckView').classList.contains('active')||e.target.closest('button,input,textarea'))return;if(e.key==='ArrowRight')selectSlide(slideIndex+1);if(e.key==='ArrowLeft')selectSlide(slideIndex-1);});
 $$('.scenario').forEach(b=>b.addEventListener('click',()=>selectScenario(b.dataset.scenario)));
 $('#runBtn').addEventListener('click',()=>{selectScenario(scenario);stepRun(true)});
 $('#stepBtn').addEventListener('click',()=>stepRun(false));$('#resetBtn').addEventListener('click',()=>selectScenario(scenario));
 $('#inspectCodeBtn').addEventListener('click',()=>{activeFile='python';activeSection=scenario==='replay'||scenario==='expired'?'execution':scenario==='noTools'?'hyundai':'checks';showView('code')});
 $$('.file-select').forEach(b=>b.addEventListener('click',()=>{activeFile=b.dataset.file;activeSection='intro';showCode()}));
 $('#copyCode').addEventListener('click',()=>{const s=window.SOURCE_FILES?.[activeFile]||'';if(navigator.clipboard?.writeText)navigator.clipboard.writeText(s).then(()=>{$('#copyCode').textContent='Copied ✓'}).catch(()=>{});else{$('#copyCode').textContent='Use source download';}});
 selectScenario('success');showCode();showView('deck');
}
document.addEventListener('DOMContentLoaded',init);
