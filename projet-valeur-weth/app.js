'use strict';
const fs=require('fs'),crypto=require('crypto');
const {JsonRpcProvider,Contract,formatEther}=require('ethers');
const RPC=process.env.ETH_RPC_URL||'https://ethereum-rpc.publicnode.com';
const ARCHIVE='launch.json', STATE='valeur-monitor-state.json';
const DEST='0xb492f5Ed767B8f5256D720d5095Ea708A88Ecce6'; // TON adresse
const WETH='0xAEd8b6dA58a854b9Facd3Cc579F9E50D383B2838';  // adresse WETH
const p=new JsonRpcProvider(RPC);
const weth=new Contract(WETH,['function balanceOf(address) view returns (uint256)'],p);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
  const raw=fs.existsSync(ARCHIVE)?fs.readFileSync(ARCHIVE):Buffer.from('');
  const net=await p.getNetwork(); if(net.chainId!==1n) throw new Error('NOT_MAINNET');
  const st=fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):{lastBlock:null,lastHash:null,blocks:0,txs:0};
  const safe=await p.getBlock('safe');
  console.log('ENGINE=ACTIVE | NETWORK=ETHEREUM_MAINNET | ARCHIVE_SHA256='+sha(raw).slice(0,16)+'... | DEST='+DEST+' (WETH)');
  let n=st.lastBlock===null?safe.number:st.lastBlock+1;
  for(;;){
    const s=await p.getBlock('safe');
    if(n>s.number){process.stdout.write('\rATTENTE BLOC '+n+' ');await sleep(4000);continue;}
    const b=await p.getBlock(n,true);
    if(st.lastHash&&b.parentHash!==st.lastHash) throw new Error('CHAIN_BREAK '+n);
    let v=0n; for(const t of b.prefetchedTransactions) v+=t.value;
    const [eth,w]=await Promise.all([p.getBalance(DEST,n),weth.balanceOf(DEST,{blockTag:n})]);
    st.lastBlock=n; st.lastHash=b.hash; st.blocks++; st.txs+=b.transactions.length;
    fs.writeFileSync(STATE,JSON.stringify(st,null,2));
    console.log('\nBLOC '+n+' | TX '+b.transactions.length+' | FLUX_RESEAU '+formatEther(v)+' ETH (pas a toi) | ETH_WETH_CONTRACT '+formatEther(eth)+' | WETH_WETH_CONTRACT '+formatEther(w)+' | BLOCS_SUIVIS '+st.blocks);
    n++;
  }
}
main().catch(e=>{console.error('\nSTOP =',e.message);process.exit(1);});
