/* Hushfund landing: live read-only mainnet values. No transactions are sent. */
(function () {
  'use strict';
  var REFRESH_MS = 30000, TIMEOUT_MS = 8000, DASH = '\u2014';
  var API = (typeof window.API_BASE === 'string' ? window.API_BASE : '/api').replace(/\/$/, '');
  var timer = null, hasData = {};

  function els(key) { return document.querySelectorAll('[data-live="' + key + '"]'); }
  function set(key, text, title) {
    els(key).forEach(function (el) {
      el.textContent = text;
      if (title) el.setAttribute('title', title); else el.removeAttribute('title');
    });
    hasData[key] = text !== DASH && text !== 'Unavailable' && text !== 'NOT AVAILABLE';
  }
  // On failure: keep last good value but mark it stale; never show zero.
  function fail(key, label) {
    if (hasData[key]) {
      els(key).forEach(function (el) {
        if (!/ \(stale\)$/.test(el.textContent)) el.textContent += ' (stale)';
        el.setAttribute('title', 'Could not refresh; showing last known value');
      });
    } else set(key, label || 'Unavailable', 'Live data unavailable right now');
  }

  function getJSON(path) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var t = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    return fetch(path, { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .finally(function () { if (t) clearTimeout(t); });
  }

  function usdc(raw) {
    if (raw == null || raw === '') return null;
    var n = Number(raw) / 1e6;
    if (!isFinite(n) || n < 0) return null;
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    var digits = n > 0 && n < 1 ? 6 : 2;
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  }
  function pct(v) { return typeof v === 'number' && isFinite(v) ? v.toFixed(2) + '%' : null; }

  function loadStats() {
    return getJSON(API + '/vault/stats/all').then(function (d) {
      if (!d || !Array.isArray(d.vaults) || !d.vaults.length) throw new Error('bad stats');
      var tvl = usdc(d.totalAssets);
      tvl ? set('tvl', tvl, 'As of block ' + d.asOfBlock) : fail('tvl');

      var total = 0, ok = true;
      d.vaults.forEach(function (v) { if (typeof v.deposits === 'number') total += v.deposits; else ok = false; });
      ok ? set('deposits', total.toLocaleString('en-US'), 'As of block ' + d.asOfBlock) : fail('deposits');

      var v1000 = d.vaults.filter(function (v) { return String(v.denomination) === '1000000000'; })[0];
      if (v1000 && typeof v1000.deposits === 'number') {
        set('anon-1000', v1000.deposits.toLocaleString('en-US') + (v1000.deposits === 1 ? ' DEPOSIT' : ' DEPOSITS'));
      } else fail('anon-1000', 'NOT AVAILABLE');

      var withFee = d.vaults.filter(function (v) { return v.feeBps != null && v.feeBps !== ''; });
      var bps = withFee.map(function (v) { return Number(v.feeBps); }).filter(isFinite);
      if (bps.length) {
        var lo = Math.min.apply(null, bps), hi = Math.max.apply(null, bps);
        var f = function (b) { return String(+(b / 100).toFixed(2)); };
        set('fee', lo === hi ? f(lo) : f(lo) + '\u2013' + f(hi));
      } else set('fee', DASH);
      return d.vaults;
    }).catch(function () {
      ['tvl', 'deposits'].forEach(function (k) { fail(k); });
      fail('anon-1000', 'NOT AVAILABLE');
      fail('fee', DASH);
      return null;
    });
  }

  function loadApy(vaults) {
    if (!vaults || !vaults.length) { fail('apy-aave', DASH); fail('apy-morpho', DASH); return; }
    var pick = vaults.filter(function (v) { return String(v.denomination) === '1000000000'; })[0] || vaults[0];
    return getJSON(API + '/vault/apy?vault=' + encodeURIComponent(pick.address)).then(function (a) {
      if (a && a.status === 'available') {
        var ap = pct(a.aave), mp = pct(a.morpho);
        ap ? set('apy-aave', ap, a.message) : set('apy-aave', DASH, 'Not available');
        mp ? set('apy-morpho', mp, a.message) : set('apy-morpho', DASH, 'Not available');
      } else {
        var msg = (a && a.message) || 'Not available';
        set('apy-aave', DASH, msg); set('apy-morpho', DASH, msg);
      }
    }).catch(function () { fail('apy-aave', DASH); fail('apy-morpho', DASH); });
  }

  function loadGas() {
    return getJSON(API + '/relay/quote?action=withdraw').then(function (q) {
      var gwei = Number(q.maxFeePerGas) / 1e9;
      var price = isFinite(gwei) && q.maxFeePerGas != null ? (gwei < 1 ? gwei.toFixed(3) : gwei.toFixed(1)) + ' gwei' : null;
      var free = String(q.fee) === '0';
      if (!price) { fail('gas'); return; }
      set('gas', price + (free ? ' \u00b7 sponsored' : ''), free ? 'Network gas price; paid by the Hushfund relayer' : 'Network gas price');
    }).catch(function () { fail('gas'); });
  }

  function refresh() {
    if (document.hidden) return;
    loadStats().then(loadApy);
    loadGas();
  }
  function schedule() {
    if (timer) clearInterval(timer);
    timer = setInterval(refresh, REFRESH_MS);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (timer) clearInterval(timer); timer = null; }
    else { refresh(); schedule(); }
  });
  refresh();
  schedule();
})();
