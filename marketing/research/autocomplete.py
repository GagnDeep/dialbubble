#!/usr/bin/env python3
"""Pulls Google Autocomplete suggestions for Dialbubble's seed topics into keywords.json."""
import json, string, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

SEEDS = """twilio app
twilio ios app
twilio iphone app
twilio mobile app
twilio softphone
twilio dialer
twilio phone app
twilio send sms from iphone
twilio make call from phone
twilio console app
twilio client app
twilio sms app
twilio inbox
twilio number
twilio phone number
twilio phone number cost
twilio pricing
twilio sms pricing
twilio voice pricing
twilio call cost
twilio calculator
twilio trial account
twilio trial limitations
twilio account sid
twilio auth token
twilio error
twilio error 21610
twilio error 30007
twilio error code
twilio alternative
twilio vs
twilio twiml
twiml generator
twiml bin
twiml examples
twiml say
twiml dial
twiml gather
twimlets
twilio call forwarding
twilio voicemail
twilio call recording
twilio caller id
twilio verified caller id
twilio bridge call
twilio click to call
twilio a2p 10dlc
a2p 10dlc registration
10dlc cost
twilio messaging service
twilio schedule sms
twilio bulk sms
twilio mms
business phone app iphone
second phone number app
second phone number for business
virtual phone number app
virtual phone number iphone
international calling app iphone
call from different number iphone
how to make calls from another number
how to send sms from a virtual number
caller id app iphone
sms character counter
sms segment calculator
sms length calculator
gsm 7 character set
ucs-2 sms length
e.164 format
e164 phone number
e.164 converter
phone number formatter
country calling codes
sms cost calculator
voip call cost calculator
openphone alternative
quo alternative
google voice alternative
dialpad alternative
grasshopper alternative
telnyx vs twilio
programmable voice
sms api""".splitlines()
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:130.0) Gecko/20100101 Firefox/130.0"}

def fetch(q):
    url = "https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=" + urllib.parse.quote(q)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=12) as r:
                return q, json.loads(r.read().decode("utf-8", "replace"))[1]
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    return q, []

queries = list(SEEDS)
for s in SEEDS[:30]:
    queries += [f"{s} {c}" for c in string.ascii_lowercase[:26:2]]
for s in SEEDS:
    queries += [f"how to {s}", f"best {s}", f"{s} for"]

with ThreadPoolExecutor(6) as ex:
    results = dict(ex.map(fetch, queries))
freq = {}
for q, sug in results.items():
    for rank, s in enumerate(sug):
        freq.setdefault(s, {"hits": 0, "best": 99})
        freq[s]["hits"] += 1; freq[s]["best"] = min(freq[s]["best"], rank)
out = sorted(freq.items(), key=lambda kv: (-kv[1]["hits"], kv[1]["best"], kv[0]))
json.dump({"queries": len(queries), "answered": sum(1 for v in results.values() if v), "keywords": [{"k": k, **v} for k, v in out]}, open("keywords.json", "w"), indent=0)
print(len(queries), "queries;", sum(1 for v in results.values() if v), "answered;", len(out), "unique suggestions")
