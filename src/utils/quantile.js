/*
Copyright 2010-2023 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
*/

/* eslint-disable no-use-before-define */
function number(x) {
  return x === null ? NaN : +x
}

export function quantileSorted(values, p, valueof = number) {
  if (!(n = values.length) || isNaN((p = +p))) return
  if (p <= 0 || n < 2) return +valueof(values[0], 0, values)
  if (p >= 1) return +valueof(values[n - 1], n - 1, values)
  var n,
    i = (n - 1) * p,
    i0 = Math.floor(i),
    value0 = +valueof(values[i0], i0, values),
    value1 = +valueof(values[i0 + 1], i0 + 1, values)
  return value0 + (value1 - value0) * (i - i0)
}
