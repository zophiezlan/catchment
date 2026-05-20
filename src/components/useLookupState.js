import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { IDX, decode, searchPostcodes } from "../utils/data";

function useDebounce(callback, delay) {
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(
    (...args) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  );
}

export function useLookupState() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [sugg, setSugg] = useState([]);
  const [open, setOpen] = useState(false);
  const [si, setSi] = useState(-1);
  const [hint, setHint] = useState("");
  const iRef = useRef(null);

  const debouncedSearch = useDebounce((t) => {
    const matches = searchPostcodes(t, 8);
    setSugg(matches);
    setOpen(matches.length > 0);
  }, 180);

  function doSearch(v) {
    setQ(v);
    setSi(-1);
    setHint("");
    const t = v.trim();

    if (/^\d+$/.test(t) && t.length > 4) {
      setHint("Australian postcodes are 3-4 digits");
      setSugg([]);
      setOpen(false);
      setRes(null);
      return;
    }

    const n = Number(t);
    if (/^\d{3,4}$/.test(t) && IDX[n]) {
      setRes(IDX[n]);
      setSugg([]);
      setOpen(false);
      return;
    }

    if (t.length >= 2) {
      debouncedSearch(t);
    } else {
      setSugg([]);
      setOpen(false);
    }
    setRes(null);
  }

  function pick(pc) {
    setQ(String(pc));
    setRes(IDX[pc]);
    setSugg([]);
    setOpen(false);
  }

  function clearSearch() {
    setQ("");
    setRes(null);
    setSugg([]);
    setOpen(false);
    setHint("");
    iRef.current?.focus();
  }

  function handleKey(e) {
    if (!open || !sugg.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSi((i) => Math.min(i + 1, sugg.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSi((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && si >= 0) {
      e.preventDefault();
      pick(sugg[si].pc);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const d = useMemo(() => (res ? decode(res[0]) : null), [res]);
  const multiState = !!(res && res.length > 1);

  const [nspCounts, setNspCounts] = useState(null);
  const [nearestNSP, setNearestNSP] = useState(null);
  const [suburbDistances, setSuburbDistances] = useState(null);
  const [acchsHere, setAcchsHere] = useState(null);
  const [otpHere, setOtpHere] = useState(null);
  const [seifa, setSeifa] = useState(null);

  useEffect(() => {
    if (!d?.pc) {
      setNspCounts(null);
      setNearestNSP(null);
      setSuburbDistances(null);
      setAcchsHere(null);
      setOtpHere(null);
      setSeifa(null);
      return;
    }

    Promise.all([
      import("../utils/nsp"),
      import("../data/suburb-centroids.json"),
      import("../utils/geo"),
      import("../utils/acchs"),
      import("../utils/otp"),
      import("../utils/seifa"),
    ]).then(([nspMod, salMod, geoMod, acchsMod, otpMod, seifaMod]) => {
      const { NSP_PC, getNearestPrimaryNSP, NSP_ALL } = nspMod;
      setNspCounts(NSP_PC[d.pc] ?? null);
      const nearest = getNearestPrimaryNSP(d.pc);
      setNearestNSP(nearest);

      const here = acchsMod.getACCHSByPostcode(d.pc);
      setAcchsHere(here.length > 0 ? here : null);

      setOtpHere(otpMod.getOTPByPostcode(d.pc));

      setSeifa(seifaMod.getSEIFA(d.pc));

      const salCentroids = salMod.default[d.pc];
      if (salCentroids) {
        const dists = salCentroids.map((c) => {
          if (!c) return null;
          const r = geoMod.nearestOutlet(c[0], c[1], NSP_ALL);
          return r ? r.distanceKm : null;
        });
        setSuburbDistances(dists);
      } else {
        setSuburbDistances(null);
      }
    });
  }, [d?.pc]);

  return {
    q,
    res,
    sugg,
    open,
    si,
    hint,
    iRef,
    d,
    multiState,
    nspCounts,
    nearestNSP,
    suburbDistances,
    acchsHere,
    otpHere,
    seifa,
    doSearch,
    pick,
    clearSearch,
    handleKey,
    setOpen,
    setSi,
  };
}
