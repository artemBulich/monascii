import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { hexlify, getBytes } from "ethers";

const DEAD   = "0x000000000000000000000000000000000000dead";
const TAG    = getBytes("0x4d4f4e5343523031");
const LS_KEY = "monascii-cache";
const EXPL   = "https://testnet.monadexplorer.com/tx/";

interface MonItem { art: string; tx?: string; }

const ART_POOL = [
  // classic
  "(^_^)", "(•‿•)", "(｡◕‿◕｡)", "(ᵔᴥᵔ)", "(>‿<)",
  "(✿◠‿◠)", "(ʘ‿ʘ)", "(｡♥‿♥｡)", "(✧ω✧)", "¯\\_(ツ)_/¯",
  // trolls / shrug
  "(ಠ_ಠ)", "(¬‿¬)", "(ง'̀-'́)ง", "ᕦ(ò_óˇ)ᕤ", "(っ◞‸◟c)",
  "(ಠ‿ಠ)", "(ノಠ益ಠ)ノ彡┻━┻", "(つ▀¯▀)つ", "(ง ° ͜ ʖ °)ง", "(ᵔ ͜ʖᵔ)",
  // animals
  "(=^･ω･^=)", "(ʕ•ᴥ•ʔ)", "(❍ᴥ❍ʋ)", "(•ㅅ•)", "(•ө•)♡",
  "／(=ﾟ‥ﾟ)＼", "(>ᴗ•)", "(ꈍᴗꈍ)", "(=^‥^=)", "(•‿•)ﾉ",
  // battle / flex
  "(ง •̀_•́)ง✧", "ᕙ(⇀‸↼‶)ᕗ", "ʕง•ᴥ•ʔง", "ʕ •̀ o •́ ʔ", "ᕦ╏ ͡ ͜ʖ ͡ ╏ᕤ",
  "(งツ)ว", "(ง°ل͜°)ง", "(ง ⚆ᗜ⚆)ง", "(ง⌐□ل͜□)ง", "(ง. •̀_•́.)ง",
];

const encode = (art: string) => {
  const b = new TextEncoder().encode(art);
  const payload = new Uint8Array(TAG.length + 1 + b.length);
  payload.set(TAG);
  payload[TAG.length] = b.length;
  payload.set(b, TAG.length + 1);
  return payload;
};

const Page: NextPage = () => {
  const { address }      = useAccount();
  const { data: wc }     = useWalletClient();
  const addrKey          = address?.toLowerCase() ?? "";

  const [mons, setMons]  = useState<MonItem[]>([]);
  const [minting, setMint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !addrKey) return;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) { setMons([]); return; }
    const all: Record<string, MonItem[]> = JSON.parse(raw);
    setMons(all[addrKey] ?? []);
  }, [addrKey]);

  const persist = (arr: MonItem[]) => {
    const raw = localStorage.getItem(LS_KEY);
    const all: Record<string, MonItem[]> = raw ? JSON.parse(raw) : {};
    all[addrKey] = arr;
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  };

  const mint = async () => {
    if (!wc || !addrKey) return alert("Connect wallet first");
    const art = ART_POOL[Math.floor(Math.random() * ART_POOL.length)];
    try {
      setMint(true);
      const tx = await wc.sendTransaction({
        to: DEAD,
        data: hexlify(encode(art)) as `0x${string}`,
        value: 0n,
      });
      const next = [{ art, tx }, ...mons];
      setMons(next);
      persist(next);
    } finally {
      setMint(false);
    }
  };

  const openTx = (item: MonItem) => {
    if (item.tx) window.open(EXPL + item.tx, "_blank");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#e5e5e5",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <Head>
        <title>MonASCII — smart-contract-less NFTs</title>
      </Head>

      <ConnectButton />
      <h1 style={{ margin: "1rem 0 0.5rem" }}>👾 MonASCII</h1>
      <p style={{ opacity: 0.85, maxWidth: 400, textAlign: "center" }}>
        First <b>smart-contract-less NFTs</b> on Monad:<br/> ASCII art stored entirely in transaction data.
      </p>

      <button
        onClick={mint}
        disabled={minting}
        style={{
          marginTop: "1.5rem",
          padding: "12px 28px",
          background: "#00b37e",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: 8,
          cursor: minting ? "not-allowed" : "pointer",
        }}
      >
        Mint
      </button>

      <section style={{ width: "100%", maxWidth: 900, marginTop: 40 }}>
        <h2 style={{ textAlign: "center", marginBottom: 16 }}>My MonASCIIs</h2>
        {mons.length === 0 && (
          <p style={{ textAlign: "center" }}>
            {address ? "No mints yet." : "Connect your wallet to see mints."}
          </p>
        )}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 14,
          }}
        >
          {mons.map((m, i) => (
            <li
              key={i}
              onClick={() => openTx(m)}
              style={{
                background: "#1a1a1a",
                padding: 18,
                borderRadius: 6,
                textAlign: "center",
                cursor: m.tx ? "pointer" : "default",
                userSelect: "none",
              }}
            >
              {m.art}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Page;
