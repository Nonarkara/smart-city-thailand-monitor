export type Purpose = "live" | "business" | "industrial" | "invest";
export const purposes: Record<Purpose, string> = {live:"Live",business:"Business",industrial:"Industry",invest:"Buy to let"};
export type Scenario = {
  activity?:string; rent?:number; size?:number; fixed?:number; ownerPay?:number;
  margin?:number; receipt?:number; days?:number; salesLow?:number; salesBase?:number; salesHigh?:number;
  fitout?:number; recoveryMonths?:number; workingCapital?:number; targetSurplus?:number;
  permitted?:"unknown"|"yes"|"no"; access?:"unknown"|"yes"|"no"; checkedNote?:string;
  acquisition?:number; initialCosts?:number; vacancy?:number; annualOperating?:number;
  annualDebt?:number; annualIncomeTax?:number; targetYield?:number;
};
const valid=(x:unknown):x is number=>typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=1e12;
const positive=(x:unknown):x is number=>valid(x)&&x>=0.000001;
export function operating(s:Scenario){
  const missing:string[]=[];
  for(const [k,label] of [["rent","rent"],["fixed","other fixed costs"],["ownerPay","owner pay"],["fitout","fit-out cost"],["workingCapital","working capital"],["targetSurplus","target monthly surplus"]] as const)if(!valid(s[k]))missing.push(label);
  if(!positive(s.margin)||s.margin>100)missing.push("contribution margin between 0 and 100%");
  if(!positive(s.receipt))missing.push("average sale/order value");
  if(!Number.isInteger(s.days)||!positive(s.days)||s.days>31)missing.push("open days from 1 to 31");
  if(positive(s.fitout)&&(!positive(s.recoveryMonths)||s.recoveryMonths<1))missing.push("fit-out recovery months");
  const ready=missing.length===0;
  const recovery=valid(s.fitout)&&s.fitout===0?0:positive(s.fitout)&&positive(s.recoveryMonths)&&s.recoveryMonths>=1?s.fitout/s.recoveryMonths:null;
  const fixed=valid(s.fixed)&&valid(s.ownerPay)&&recovery!==null?s.fixed+s.ownerPay+recovery:null;
  const breakEven=ready?(s.rent!+fixed!)/(s.margin!/100):null;
  const cases=(["salesLow","salesBase","salesHigh"] as const).map((key)=>({key,sales:valid(s[key])?s[key]!:null,surplus:ready&&valid(s[key])?s[key]!*(s.margin!/100)-fixed!-s.rent!:null,affordableRent:ready&&valid(s[key])?s[key]!*(s.margin!/100)-fixed!-s.targetSurplus!:null}));
  const ordered=cases.every(c=>c.sales!==null)?cases[0].sales!<=cases[1].sales!&&cases[1].sales!<=cases[2].sales!:null;
  return {missing,breakEven,transactionsPerDay:breakEven===null?null:Math.ceil(breakEven/s.receipt!/s.days!),recovery,cases,ordered,capital:valid(s.fitout)&&valid(s.workingCapital)?s.fitout+s.workingCapital:null};
}
export function investment(s:Scenario){
  const missing:string[]=[];
  for(const [k,label] of [["acquisition","purchase price"],["initialCosts","initial fees and fit-out"],["rent","potential monthly rent"],["annualOperating","annual operating costs"],["annualDebt","annual debt service"],["annualIncomeTax","annual owner income tax"]] as const)if(!valid(s[k]))missing.push(label);
  if(!positive(s.acquisition))missing.push("positive purchase price");
  if(!positive(s.rent))missing.push("positive potential rent");
  if(!valid(s.vacancy)||s.vacancy>100)missing.push("vacancy/credit loss from 0 to 100%");
  if(missing.length)return {missing,noi:null,yield:null,cashFlow:null,allIn:null,stressCashFlow:null};
  const allIn=s.acquisition!+s.initialCosts!,gross=s.rent!*12;
  const noi=gross*(1-s.vacancy!/100)-s.annualOperating!;
  return {missing,allIn,noi,yield:100*noi/allIn,cashFlow:noi-s.annualDebt!-s.annualIncomeTax!,stressCashFlow:gross*(1-Math.min(100,s.vacancy!+10)/100)-s.annualOperating!-s.annualDebt!-s.annualIncomeTax!};
}
export function gates(s:Scenario){return {blocked:[s.permitted==="no"?"Use is not permitted":null,s.access==="no"?"Required access or utilities do not work":null].filter(Boolean) as string[],missing:[!s.activity?.trim()?"Name the planned activity or tenant type":null,s.permitted!=="yes"&&s.permitted!=="no"?"Confirm permitted use and lease terms":null,s.access!=="yes"&&s.access!=="no"?"Check required access and utilities":null,!s.checkedNote?.trim()?"Record where and when you checked the premises":null].filter(Boolean) as string[]};}
export function summary(purpose:Purpose,s:Scenario){
  const g=gates(s), op=operating(s), inv=investment(s);
  const missing=purpose==="invest"?inv.missing:op.missing;
  if(g.blocked.length)return {status:"Does not meet your checks",why:g.blocked};
  if(missing.length)return {status:"Scenario incomplete",why:[`Enter ${missing.slice(0,3).join(", ")}${missing.length>3?" and remaining costs":""}.`]};
  if(purpose!=="invest"&&op.ordered===false)return {status:"Check sales scenarios",why:["Sales must run from low to base to high."]};
  if(purpose!=="invest"&&op.cases[1].surplus!==null&&op.cases[1].surplus!<0)return {status:"Base case loses money",why:["Your assumed base sales do not cover the entered costs.",...g.missing]};
  if(purpose==="invest"&&inv.cashFlow!==null&&inv.cashFlow<0)return {status:"Negative annual cash flow",why:["After entered costs, debt and income tax.",...g.missing]};
  if(purpose==="invest"&&valid(s.targetYield)&&inv.yield!==null&&inv.yield<s.targetYield)return {status:"Below your yield target",why:["The entered operating yield is below your own target.",...g.missing]};
  if(purpose!=="invest"&&op.cases[1].surplus!==null&&valid(s.targetSurplus)&&op.cases[1].surplus<s.targetSurplus)return {status:"Below your surplus target",why:["Base-case surplus is below your entered monthly target.",...g.missing]};
  if(purpose!=="invest"&&op.cases[1].sales===null)return {status:"Break-even calculated",why:["Add sales cases to test rent affordability and surplus.",...g.missing,"Local demand remains unverified."]};
  if(g.missing.length)return {status:"Premises checks incomplete",why:[...g.missing,purpose==="invest"?"Rent, vacancy and expenses still need independent evidence.":"Local demand is not established by these calculations."]};
  return {status:"Assumptions calculated",why:[...g.missing,purpose==="invest"?"Rent, vacancy and expenses still need independent evidence.":"Local demand is not established by these calculations."]};
}
export function economicsReport(purpose:Purpose,s:Scenario){
  const r=summary(purpose,s),op=operating(s),inv=investment(s);
  return `${purposes[purpose]} · ${s.activity||"Activity not named"}\n${r.status}\n${r.why.join("\n")}\nUser-entered assumptions (not verified): ${JSON.stringify(s)}\n${purpose==="invest"?`Annual NOI: ${inv.noi??"unknown"}; operating yield %: ${inv.yield??"unknown"}; annual after-debt/tax cash flow: ${inv.cashFlow??"unknown"}; cash flow at +10 percentage points vacancy: ${inv.stressCashFlow??"unknown"}`:`Break-even monthly sales: ${op.breakEven??"unknown"}; transactions per open day: ${op.transactionsPerDay??"unknown"}; cases: ${JSON.stringify(op.cases)}`}\nNo appreciation or proven customer-demand assumption.\n`;
}
export type Comparable={url:string;observed:string;rent:number;size:number;matched:boolean;kind:"asking"|"quoted"|"agreed"};
export function compareRents(rows:Comparable[],subject:Scenario,kind:Comparable["kind"],now=Date.now()){
 const seen=new Set<string>();let rejected=0;const eligible=rows.filter(r=>{let key="";try{const u=new URL(r.url);if(!["https:","http:"].includes(u.protocol))throw 0;for(const k of [...u.searchParams.keys()])if(k.startsWith("utm_")||["fbclid","gclid","msclkid"].includes(k))u.searchParams.delete(k);u.searchParams.sort();key=u.origin+u.pathname.replace(/\/$/,"")+u.search;}catch{rejected++;return false;}const t=Date.parse(r.observed+"T00:00:00+07:00");if(seen.has(key)||!r.matched||r.kind!==kind||!positive(r.rent)||!positive(r.size)||!Number.isFinite(t)||t>now||now-t>90*86400000||!positive(subject.size)||r.size<subject.size*.8||r.size>subject.size*1.2){rejected++;return false;}seen.add(key);return true;});
 const values=eligible.map(r=>r.rent/r.size).sort((a,b)=>a-b);const q=(p:number)=>{const i=(values.length-1)*p,lo=Math.floor(i);return values[lo]+(values[Math.ceil(i)]-values[lo])*(i-lo);};const enough=values.length>=5;
 return {count:values.length,rejected,median:enough?q(.5):null,p25:enough?q(.25):null,p75:enough?q(.75):null,premium:enough&&positive(subject.rent)&&positive(subject.size)?100*(subject.rent/subject.size/q(.5)-1):null};
}

export function readPurpose(value:unknown):Purpose { return typeof value==="string"&&Object.hasOwn(purposes,value)?value as Purpose:"live"; }
