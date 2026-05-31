# VLM Satellite Change Detection — Evaluation Metrics Framework

**Project:** Zero-Shot VLM Benchmarking for Satellite Imagery Change Detection  
**Author:** Behzad Hassan, Sukkur IBA University  
**Version:** 2.0 — May 2026

---

## Overview

This framework defines 10 evaluation metrics for assessing the quality of VLM-generated change detection reports on satellite image pairs. Each response is evaluated against ground truth labels derived from the LEVIR-CD dataset.

All metrics use a **0–5 scale. Higher is always better.**

**Maximum aggregate score:** 50  
**Minimum aggregate score:** 0

---

## Metrics

---

### M1 — Change Detection Accuracy
Did the model correctly identify whether a meaningful change occurred between the two images?
```
5=Correct with confidence
4=Correct but hedging
3=Correct but vague
2=Uncertain when answer was clear / Partial
1=Incorrect with some awareness
0=No response / Completely wrong
```

---

### M2 — Change Type Correctness
Did the model correctly classify the type of change (construction, demolition, vegetation, infrastructure, land use)?
```
5=Exact correct type
4=Broadly correct category
3=Partially correct — one of multiple types identified
2=Wrong type but change acknowledged
1=Completely wrong type
0=No type mentioned
```

---

### M3 — Spatial Localization
Did the model correctly describe where the change occurred using directional references and landmarks?
```
5=Correct with two+ directional references and a landmark
4=Correct with one directional reference
3=Partially correct general area
2=Vague / center only with no further detail
1=Entirely wrong location
0=No location described
```

---

### M4 — Scale Estimation
Did the model correctly estimate the scale of change as Small (<10%), Moderate (10–40%), or Large (>40%)?
```
5=Correct category
4=Correct category with minor boundary error
3=Off by one category
2=Wrong category stated with high confidence
1=Completely wrong category
0=No scale mentioned
```

---

### M5 — Completeness
Did the model detect and report all significant changes present in the image pair?
```
5=All significant changes reported
4=Most detected with minor omissions
3=Roughly half detected
2=Only one of several changes detected
1=Only trivial change detected
0=No changes detected at all
```

---

### M6 — Hallucination
Did the model fabricate or describe elements not visually present or verifiable in the images?
```
5=No hallucination at all
4=One minor unverifiable detail
3=A couple of unsupported claims
2=One clearly fabricated element stated with confidence
1=Multiple fabricated elements affecting core analysis
0=Response mostly or entirely hallucinated
```

---

### M7 — Unchanged Element Accuracy
Did the model correctly identify elements that remained the same between the two images?
```
5=All unchanged elements verified correct
4=Mostly correct with one minor error
3=Mixed — some correct some wrong
2=Mostly wrong
1=All described unchanged elements are actually changed
0=No unchanged elements described
```

---

### M8 — Visual Grounding
Did the model support its claims with specific observable visual features from the images?
```
5=Every major claim supported by a specific visible feature
4=Most claims grounded with one or two unsupported
3=About half of claims have visible evidence
2=Few claims grounded — rest generic
1=One vague reference only
0=No visual evidence cited anywhere
```

---

### M9 — Factual Consistency
Is the response internally consistent with no contradictions between sections or steps?
```
5=Fully consistent throughout
4=One minor inconsistency not affecting conclusion
3=One moderate inconsistency
2=One significant contradiction affecting conclusion
1=Multiple major contradictions
0=Conclusion directly contradicts its own evidence
```

---

### M10 — Response Utility
Would this response be useful to a real satellite imagery analyst making an operational decision?
```
5=Analyst could act on this directly with confidence
4=Mostly useful with minor gaps
3=Partially useful but needs heavy verification
2=Mostly useless — too vague or wrong
1=Misleading — would cause wrong decision
0=Harmful or completely useless
```

---

## Summary Table

| ID | Metric | Range | What It Captures |
|---|---|---|---|
| M1 | Change Detection Accuracy | 0–5 | Wrong binary judgment |
| M2 | Change Type Correctness | 0–5 | Misclassification |
| M3 | Spatial Localization | 0–5 | Wrong location |
| M4 | Scale Estimation | 0–5 | Wrong scale |
| M5 | Completeness | 0–5 | Missed changes |
| M6 | Hallucination | 0–5 | Fabricated content |
| M7 | Unchanged Element Accuracy | 0–5 | Mislabeled stable areas |
| M8 | Visual Grounding | 0–5 | Unsupported claims |
| M9 | Factual Consistency | 0–5 | Internal contradictions |
| M10 | Response Utility | 0–5 | Practical unusability |

**All metrics: Higher = Better. Maximum = 50. Minimum = 0.**

---

## Scoring Notes

- **Aggregate Score** = M1 + M2 + M3 + M4 + M5 + M6 + M7 + M8 + M9 + M10 (max 50)
- When comparing prompts (P1–P4), report mean aggregate score per prompt across all image pairs.
- When comparing models, report mean score per metric across all image pairs.
- For security-focused reporting, highlight **M3, M5, M6** as the Security Triad — the three metrics with highest operational impact.

---

## Security Triad (M3 + M5 + M6)

For security-focused analysis these three metrics are considered primary:

| Metric | Why Critical for Security |
|---|---|
| M3 — Spatial Localization | Analysts need to know exactly where to look |
| M5 — Completeness | Missing a change in a security context is a critical failure |
| M6 — Hallucination | False reports waste resources and erode trust |

**Security Triad Score** = M3 + M5 + M6 (max 15)

---

*Framework Version 2.0 — Behzad Hassan, Sukkur IBA University, May 2026*
