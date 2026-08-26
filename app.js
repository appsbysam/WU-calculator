const AGENT_KEEP = 0.98;
const DEFAULT_RATE = 0.7153;
const amountEl = document.querySelector('#recipientAmount');
const rateEl = document.querySelector('#rateInput');
const rateDisplay = document.querySelector('#rateDisplay');
const statusEl = document.querySelector('#rateStatus');
const audResult = document.querySelector('#audResult');
const resultSummary = document.querySelector('#resultSummary');

const usd = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
const aud = new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'});

function calculate(){
  const target = Math.max(0, Number(amountEl.value)||0);
  const rate = Math.max(0, Number(rateEl.value)||0);
  rateDisplay.textContent = rate ? rate.toFixed(4) : '—';
  if(!target || !rate){
    audResult.textContent='A$0.00';
    resultSummary.textContent='Enter a valid recipient amount and exchange rate.';
    return;
  }
  // If the agent retains 2%, target = gross USD * 0.98.
  const grossUsd = target / AGENT_KEEP;
  const deduction = grossUsd - target;
  // Rate is expressed as USD received for each AUD.
  const audNeeded = grossUsd / rate;
  audResult.textContent = aud.format(audNeeded);
  resultSummary.textContent = `Send about ${aud.format(audNeeded)} so the recipient nets ${usd.format(target)} after the 2% deduction.`;
  document.querySelector('#targetLine').textContent=usd.format(target);
  document.querySelector('#grossLine').textContent=usd.format(grossUsd);
  document.querySelector('#deductionLine').textContent=usd.format(deduction);
  document.querySelector('#audLine').textContent=aud.format(audNeeded);
}

async function refreshRate(){
  statusEl.textContent='Refreshing current AUD → USD market rate…';
  try{
    const res=await fetch('https://api.frankfurter.app/latest?from=AUD&to=USD',{cache:'no-store'});
    if(!res.ok) throw new Error('Rate service unavailable');
    const data=await res.json();
    const rate=Number(data?.rates?.USD);
    if(!rate) throw new Error('Invalid rate');
    rateEl.value=rate.toFixed(4);
    statusEl.textContent=`Market reference updated ${data.date || 'today'}. You can replace it with your WU quoted rate.`;
  }catch(err){
    if(!Number(rateEl.value)) rateEl.value=DEFAULT_RATE.toFixed(4);
    statusEl.textContent='Live rate unavailable. Using the displayed fallback rate — edit it to match your WU quote.';
  }
  calculate();
}

amountEl.addEventListener('input',calculate);
rateEl.addEventListener('input',()=>{statusEl.textContent='Manual rate selected.';calculate();});
document.querySelector('#refreshRate').addEventListener('click',refreshRate);
document.querySelector('#resetBtn').addEventListener('click',()=>{amountEl.value='1000';rateEl.value=DEFAULT_RATE.toFixed(4);refreshRate();});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
calculate();
refreshRate();