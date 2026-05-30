# VLM Satellite Change Detection — Evaluation Metrics Framework

**Project:** Zero-Shot VLM Benchmarking for Satellite Imagery Change Detection  
**Author:** Behzad Hassan, Sukkur IBA University  
**Version:** 1.0 — May 2026

---

## Overview

This framework defines 10 evaluation metrics for assessing the quality of VLM-generated change detection reports on satellite image pairs. Each response is evaluated against ground truth labels derived from the LEVIR-CD dataset.

Metrics are divided into two categories:

- **Performance Metrics (M1–M5, M7–M10):** Scale of 1–5. Higher is better.
- **Penalty Metric (M6):** Scale of 0–5. Lower is better.

---

## Metric Definitions

---

### M1 — Change Detection Accuracy

**Description:**  
Measures whether the model correctly identified the overall change status of the image pair — that is, whether a meaningful change occurred, did not occur, or was uncertain. This is the most fundamental binary judgment in change detection.

**What to evaluate:**  
Compare the model's stated change status (Yes / No / Uncertain) against the ground truth label for the image pair.

| Score | Meaning |
|---|---|
| 5 | Correct change status identified with clear confidence |
| 4 | Correct but with unnecessary hedging or mild uncertainty |
| 3 | Correct but vague — change implied but not explicitly stated |
| 2 | Uncertain when answer was clear, or partially correct |
| 1 | Incorrect — stated no change when change occurred, or vice versa |

**Range:** 1–5 (Higher is better)

---

### M2 — Change Type Correctness

**Description:**  
Measures whether the model correctly classified the type of change that occurred. Change types include: Construction, Demolition, Infrastructure, Vegetation, Land Use shift, or No Change. A response may identify multiple change types if multiple changes occurred.

**What to evaluate:**  
Compare the model's stated change type(s) against ground truth. Partial credit is given for broadly correct classifications.

| Score | Meaning |
|---|---|
| 5 | Exact correct change type identified |
| 4 | Broadly correct category (e.g. "land use" when answer is "construction") |
| 3 | Partially correct — identified one type correctly, missed another |
| 2 | Wrong type, but correctly acknowledged that change occurred |
| 1 | Completely wrong classification |

**Range:** 1–5 (Higher is better)

---

### M3 — Spatial Localization

**Description:**  
Measures the accuracy of the model's description of where the change occurred within the image. Good localization uses directional references (north, south, east, west) and visible landmarks. Responses that use only "center" without further detail are penalized.

**What to evaluate:**  
Check if the directional references and landmark descriptions match the actual location of the change in the image.

| Score | Meaning |
|---|---|
| 5 | Correct location with at least two directional references and a landmark |
| 4 | Correct location with one directional reference |
| 3 | Partially correct — right general area, imprecise description |
| 2 | Vague or only uses "center" with no further detail |
| 1 | Wrong location entirely |

**Range:** 1–5 (Higher is better)

---

### M4 — Scale Estimation

**Description:**  
Measures how accurately the model estimated the spatial scale of the change relative to the whole image. Scale categories are: Small (under 10%), Moderate (10–40%), or Large (over 40%). Specific percentage estimates are not required.

**What to evaluate:**  
Compare the model's scale category against the ground truth scale derived from the change mask area.

| Score | Meaning |
|---|---|
| 5 | Correct scale category |
| 4 | Off by a small margin within the same category boundary |
| 3 | Off by one category (e.g. said Moderate when answer is Large) |
| 2 | Off by one category but with strong confidence in wrong answer |
| 1 | Completely wrong scale (e.g. said Small when change was Large) |

**Range:** 1–5 (Higher is better)

---

### M5 — Completeness

**Description:**  
Measures whether the model detected and reported all significant changes present in the image pair. An image pair may contain multiple distinct changes (e.g. new construction in the north AND vegetation loss in the south). A complete response addresses all of them.

**What to evaluate:**  
Count how many ground truth changes were correctly identified vs missed.

| Score | Meaning |
|---|---|
| 5 | All significant changes detected and reported |
| 4 | Most changes detected — only minor ones missed |
| 3 | Roughly half of changes detected |
| 2 | Only one minor change detected out of several |
| 1 | No meaningful change detected despite ground truth showing change |

**Range:** 1–5 (Higher is better)

---

### M6 — Hallucination

**Description:**  
Measures the degree to which the model fabricated or described elements that are not visually present or verifiable in the satellite images. Hallucination in VLMs is a critical failure mode — especially in security contexts where false reports can have serious consequences.

**What to evaluate:**  
Identify any claims in the response that cannot be verified by looking at the images. Count and assess their severity.

| Score | Meaning |
|---|---|
| 0 | No hallucination — every claim is visually verifiable |
| 1 | Very minor — one small unverifiable detail |
| 2 | Mild — a couple of unsupported descriptive claims |
| 3 | Moderate — one clearly fabricated element described with confidence |
| 4 | Severe — multiple fabricated elements affecting the core analysis |
| 5 | Critical — response is mostly or entirely hallucinated |

**Range:** 0–5 (Lower is better)

---

### M7 — Unchanged Element Accuracy

**Description:**  
Measures whether the elements the model described as unchanged are truly unchanged between the two images. This tests the model's ability to correctly anchor its analysis — identifying stable reference points is as important as identifying changes.

**What to evaluate:**  
Check the model's "unchanged elements" section against ground truth. Penalize if the model incorrectly labels a changed element as unchanged.

| Score | Meaning |
|---|---|
| 5 | All described-as-unchanged elements are verified unchanged |
| 4 | Mostly correct — one minor error |
| 3 | Mixed — some correct, some incorrectly labeled |
| 2 | Mostly wrong — labeled changed things as unchanged |
| 1 | Completely wrong — key changed elements called unchanged |

**Range:** 1–5 (Higher is better)

---

### M8 — Visual Grounding

**Description:**  
Measures whether the model's claims are grounded in specific, observable visual features in the images. A well-grounded response cites concrete evidence such as "new rooftops visible in the north," "disturbed soil near the western boundary," or "road markings added." Vague or generic descriptions score low.

**What to evaluate:**  
For each major claim, check whether the model cited a specific visible feature to support it.

| Score | Meaning |
|---|---|
| 5 | Every major claim supported by a specific visible feature |
| 4 | Most claims grounded — one or two unsupported |
| 3 | About half of claims have visible evidence cited |
| 2 | Very few claims grounded — mostly generic descriptions |
| 1 | No visible evidence cited — response is entirely abstract |

**Range:** 1–5 (Higher is better)

---

### M9 — Factual Consistency

**Description:**  
Measures internal consistency of the response. A consistent response does not contradict itself between sections (e.g. Step 1 should not conflict with Step 4, or the change type should not conflict with the visual evidence cited). This is especially important for structured prompts (P2, P3) where the model reasons across multiple steps.

**What to evaluate:**  
Read the full response and identify any contradictions between sections, steps, or claims.

| Score | Meaning |
|---|---|
| 5 | Fully consistent — no contradictions anywhere in the response |
| 4 | One minor inconsistency that does not affect the conclusion |
| 3 | Moderate inconsistency — one claim contradicts another |
| 2 | Multiple contradictions — response is internally unreliable |
| 1 | Severe contradiction — conclusion directly contradicts the evidence the model itself cited |

**Range:** 1–5 (Higher is better)

---

### M10 — Response Utility

**Description:**  
A holistic measure of whether the response would be useful to a real-world satellite imagery analyst making an operational decision. This metric synthesizes all others into a practical judgment — a response can score well on individual metrics but still be poorly structured or misleading in context.

**What to evaluate:**  
Imagine you are an analyst who receives only this response. Could you act on it? Would you trust it?

| Score | Meaning |
|---|---|
| 5 | Analyst could act on this directly with confidence |
| 4 | Mostly useful — minor gaps but actionable |
| 3 | Partially useful — needs significant verification before acting |
| 2 | Mostly not useful — too vague, wrong, or misleading |
| 1 | Misleading or useless — could cause harm if acted upon |

**Range:** 1–5 (Higher is better)

---

## Summary Table

| ID | Metric | Range | Direction | Primary Failure Captured |
|---|---|---|---|---|
| M1 | Change Detection Accuracy | 1–5 | Higher = better | Wrong binary judgment |
| M2 | Change Type Correctness | 1–5 | Higher = better | Misclassification |
| M3 | Spatial Localization | 1–5 | Higher = better | Wrong location |
| M4 | Scale Estimation | 1–5 | Higher = better | Wrong scale |
| M5 | Completeness | 1–5 | Higher = better | Missed changes |
| M6 | Hallucination | 0–5 | **Lower = better** | Fabricated content |
| M7 | Unchanged Element Accuracy | 1–5 | Higher = better | Mislabeled stable areas |
| M8 | Visual Grounding | 1–5 | Higher = better | Unsupported claims |
| M9 | Factual Consistency | 1–5 | Higher = better | Internal contradictions |
| M10 | Response Utility | 1–5 | Higher = better | Practical unusability |

**Maximum possible score:** 45 + 0 (hallucination) = 45 performance points  
**Minimum possible score:** 9 + 5 (hallucination) = 9 performance points

---

## Scoring Notes

- **M6 is always reported separately** from the aggregate score due to its inverted scale.
- **Aggregate Score** = M1 + M2 + M3 + M4 + M5 + M7 + M8 + M9 + M10 (max 45)
- **Hallucination Penalty** = M6 (reported independently, range 0–5)
- When comparing prompts (P1–P4), report both the aggregate score and the hallucination score side by side.
- When comparing models, report mean scores per metric across all image pairs.

---

## Security Context Weighting (Optional)

For security-focused analysis, the following three metrics are considered **primary** due to their direct operational impact:

| Metric | Why Critical for Security |
|---|---|
| M3 — Spatial Localization | Analysts need to know exactly where to look |
| M5 — Completeness | Missing a change in a security context is a critical failure |
| M6 — Hallucination | False reports waste resources and erode trust |

These can be reported as a **Security Triad Score** alongside the full metric table.

---

*Framework Version 1.0 — Behzad Hassan, Sukkur IBA University, May 2026*
